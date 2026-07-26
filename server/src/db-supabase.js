const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase not configured. Using SQLite fallback.');
  // Fallback to SQLite if not configured
  module.exports = require('./db');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create a wrapper to make Supabase work like better-sqlite3
class Database {
  prepare(sql) {
    return new PreparedStatement(sql, supabase);
  }

  exec(sql) {
    // Not used for Supabase
  }
}

class PreparedStatement {
  constructor(sql, supabase) {
    this.sql = sql;
    this.supabase = supabase;
  }

  get(...params) {
    return this._query('get', params);
  }

  all(...params) {
    return this._query('all', params);
  }

  run(...params) {
    return this._query('run', params);
  }

  _query(mode, params) {
    // Parse SQL to determine table and operation
    if (this.sql.includes('INSERT INTO users')) {
      return this._handleUserInsert(params);
    }
    if (this.sql.includes('SELECT * FROM users WHERE name')) {
      return this._handleUserSelect(params);
    }
    // Add more handlers as needed
    return null;
  }

  async _handleUserInsert(params) {
    const [id, name, pin_hash, role] = params;
    const { data, error } = await this.supabase
      .from('users')
      .insert([{ id, name, pin_hash, role }])
      .select();
    
    if (error) throw error;
    return { changes: 1 };
  }

  async _handleUserSelect(params) {
    const [name] = params;
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    return data;
  }
}

const db = new Database();
module.exports = db;

