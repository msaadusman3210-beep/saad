const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'press_shop.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator'
);

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tonnage TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  customer TEXT DEFAULT 'Other',
  pieces_per_sheet REAL DEFAULT 0,
  track_process_id TEXT
);

CREATE TABLE IF NOT EXISTS processes (
  id TEXT PRIMARY KEY,
  part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seq INTEGER NOT NULL,
  cycle_time_sec REAL DEFAULT 0,
  machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  qty REAL NOT NULL DEFAULT 0,
  machine_no TEXT,
  worker TEXT,
  downtime REAL DEFAULT 0,
  rejection REAL DEFAULT 0,
  entered_by TEXT
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  qty REAL NOT NULL,
  UNIQUE(part_id, date)
);

CREATE INDEX IF NOT EXISTS idx_processes_part ON processes(part_id);
CREATE INDEX IF NOT EXISTS idx_entries_part_process_date ON entries(part_id, process_id, date);
CREATE INDEX IF NOT EXISTS idx_plans_part_date ON plans(part_id, date);
`);

module.exports = db;
