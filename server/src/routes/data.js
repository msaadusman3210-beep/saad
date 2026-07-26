const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Store application data (parts, entries, plans, etc.)
router.get('/:key', authRequired, (req, res) => {
  try {
    const key = req.params.key;
    const row = db.prepare('SELECT value FROM app_data WHERE key = ?').get(key);
    res.json({ value: row ? row.value : null });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/:key', authRequired, (req, res) => {
  try {
    const key = req.params.key;
    const value = req.body.value;
    
    const existing = db.prepare('SELECT id FROM app_data WHERE key = ?').get(key);
    if (existing) {
      db.prepare('UPDATE app_data SET value = ? WHERE key = ?').run(value, key);
    } else {
      db.prepare('INSERT INTO app_data (key, value) VALUES (?, ?)').run(key, value);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Export entries as CSV
router.get('/export/entries', authRequired, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT e.date, p.name as part, pr.name as process, e.qty, e.machine_no, e.worker, e.downtime, e.rejection, e.entered_by
      FROM entries e
      LEFT JOIN parts p ON p.id = e.part_id
      LEFT JOIN processes pr ON pr.id = e.process_id
      ORDER BY e.date DESC
    `).all();
    const header = 'Date,Part,Process,Qty,Machine,Worker,Downtime (min),Rejection,Entered By';
    const csv = rows.map(r => 
      [r.date, r.part, r.process, r.qty, r.machine_no||'', r.worker||'', r.downtime||0, r.rejection||0, r.entered_by||'']
        .map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')
    );
    res.json({ csv: header + '\n' + csv.join('\n') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export parts + processes as CSV
router.get('/export/parts', authRequired, (req, res) => {
  try {
    const parts = db.prepare('SELECT * FROM parts ORDER BY name').all();
    const rows = [];
    parts.forEach(p => {
      const procs = db.prepare('SELECT * FROM processes WHERE part_id = ? ORDER BY seq').all(p.id);
      if (procs.length === 0) {
        rows.push([p.name, p.customer, p.pieces_per_sheet||0, '', '', '', '', '']);
      } else {
        procs.forEach((pr, i) => {
          const m = db.prepare('SELECT name FROM machines WHERE id = ?').get(pr.machine_id);
          rows.push([p.name, p.customer, p.pieces_per_sheet||0, i+1, pr.name, pr.cycle_time_sec||0, m ? m.name : '', pr.operator||'']);
        });
      }
    });
    const header = 'Part,Customer,Pieces per Sheet,Process Order,Process,Cycle Time (sec),Machine,Operator';
    const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(','));
    res.json({ csv: header + '\n' + csv.join('\n') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset all data (admin only)
router.post('/reset', authRequired, adminOnly, (req, res) => {
  try {
    db.exec(`
      DELETE FROM entries;
      DELETE FROM plans;
      DELETE FROM processes;
      DELETE FROM parts;
      DELETE FROM machines;
      DELETE FROM app_data;
    `);
    // Re-insert default 47 machines
    for (let i = 1; i <= 47; i++) {
      db.prepare('INSERT INTO machines (id, name, tonnage, notes) VALUES (?,?,?,?)').run(
        uuidv4(), 'Press ' + i, '', ''
      );
    }
    res.json({ success: true, message: 'All data cleared, machines reset to 47 defaults' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
