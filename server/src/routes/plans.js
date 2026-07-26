const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const { partId, month } = req.query;
  let sql = 'SELECT * FROM plans WHERE 1=1';
  const params = [];
  if (partId) {
    sql += ' AND part_id = ?';
    params.push(partId);
  }
  if (month) {
    sql += ' AND date LIKE ?';
    params.push(month + '%');
  }
  sql += ' ORDER BY date';
  res.json(db.prepare(sql).all(...params));
});

// Upsert a single day's plan quantity for a part.
router.put('/', (req, res) => {
  const { partId, date, qty } = req.body;
  if (!partId || !date) return res.status(400).json({ error: 'partId and date are required' });
  const part = db.prepare('SELECT id FROM parts WHERE id = ?').get(partId);
  if (!part) return res.status(400).json({ error: 'Unknown partId' });

  const existing = db.prepare('SELECT id FROM plans WHERE part_id = ? AND date = ?').get(partId, date);
  if (existing) {
    db.prepare('UPDATE plans SET qty = ? WHERE id = ?').run(Number(qty) || 0, existing.id);
  } else {
    db.prepare('INSERT INTO plans (id, part_id, date, qty) VALUES (?,?,?,?)').run(
      uuidv4(),
      partId,
      date,
      Number(qty) || 0
    );
  }
  res.json(db.prepare('SELECT * FROM plans WHERE part_id = ? AND date = ?').get(partId, date));
});

module.exports = router;
