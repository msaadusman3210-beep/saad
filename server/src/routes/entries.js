const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const { from, to, partId } = req.query;
  let sql = 'SELECT * FROM entries WHERE 1=1';
  const params = [];
  if (from) {
    sql += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND date <= ?';
    params.push(to);
  }
  if (partId) {
    sql += ' AND part_id = ?';
    params.push(partId);
  }
  sql += ' ORDER BY date DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { date, partId, processId, qty, machineNo, worker, downtime, rejection } = req.body;
  if (!date || !partId || !processId) {
    return res.status(400).json({ error: 'date, partId and processId are required' });
  }
  const part = db.prepare('SELECT id FROM parts WHERE id = ?').get(partId);
  if (!part) return res.status(400).json({ error: 'Unknown partId' });
  const process = db.prepare('SELECT id FROM processes WHERE id = ? AND part_id = ?').get(processId, partId);
  if (!process) return res.status(400).json({ error: 'That process does not belong to this part' });

  const id = uuidv4();
  db.prepare(
    `INSERT INTO entries (id, date, part_id, process_id, qty, machine_no, worker, downtime, rejection, entered_by)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    date,
    partId,
    processId,
    Number(qty) || 0,
    machineNo || '',
    worker || '',
    Number(downtime) || 0,
    Number(rejection) || 0,
    req.user.name
  );
  res.status(201).json(db.prepare('SELECT * FROM entries WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
