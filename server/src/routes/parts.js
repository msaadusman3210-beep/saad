const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

function partWithProcesses(partId) {
  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(partId);
  if (!part) return null;
  const processes = db
    .prepare('SELECT * FROM processes WHERE part_id = ? ORDER BY seq')
    .all(partId);
  return { ...part, processes };
}

router.get('/', (req, res) => {
  const parts = db.prepare('SELECT * FROM parts ORDER BY name').all();
  const withProcesses = parts.map((p) => ({
    ...p,
    processes: db.prepare('SELECT * FROM processes WHERE part_id = ? ORDER BY seq').all(p.id),
  }));
  res.json(withProcesses);
});

router.get('/:id', (req, res) => {
  const part = partWithProcesses(req.params.id);
  if (!part) return res.status(404).json({ error: 'Part not found' });
  res.json(part);
});

router.post('/', (req, res) => {
  const { name, customer, piecesPerSheet } = req.body;
  if (!name) return res.status(400).json({ error: 'Part name required' });
  const id = uuidv4();
  db.prepare(
    'INSERT INTO parts (id, name, customer, pieces_per_sheet) VALUES (?,?,?,?)'
  ).run(id, name, customer || 'Other', Number(piecesPerSheet) || 0);
  res.status(201).json(partWithProcesses(id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Part not found' });
  const { name, customer, piecesPerSheet, trackProcessId } = req.body;
  db.prepare(
    'UPDATE parts SET name=?, customer=?, pieces_per_sheet=?, track_process_id=? WHERE id=?'
  ).run(
    name ?? existing.name,
    customer ?? existing.customer,
    piecesPerSheet ?? existing.pieces_per_sheet,
    trackProcessId ?? existing.track_process_id,
    req.params.id
  );
  res.json(partWithProcesses(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM parts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- process steps ---

router.post('/:id/processes', (req, res) => {
  const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
  if (!part) return res.status(404).json({ error: 'Part not found' });

  const { name, cycleTimeSec, machineId } = req.body;
  const countRow = db
    .prepare('SELECT COUNT(*) as c FROM processes WHERE part_id = ?')
    .get(req.params.id);
  const id = uuidv4();
  db.prepare(
    'INSERT INTO processes (id, part_id, name, seq, cycle_time_sec, machine_id) VALUES (?,?,?,?,?,?)'
  ).run(id, req.params.id, name || 'New process', countRow.c, Number(cycleTimeSec) || 0, machineId || null);

  if (!part.track_process_id) {
    db.prepare('UPDATE parts SET track_process_id = ? WHERE id = ?').run(id, req.params.id);
  }
  res.status(201).json(partWithProcesses(req.params.id));
});

router.put('/processes/:procId', (req, res) => {
  const existing = db.prepare('SELECT * FROM processes WHERE id = ?').get(req.params.procId);
  if (!existing) return res.status(404).json({ error: 'Process not found' });
  const { name, cycleTimeSec, machineId, seq } = req.body;
  db.prepare(
    'UPDATE processes SET name=?, cycle_time_sec=?, machine_id=?, seq=? WHERE id=?'
  ).run(
    name ?? existing.name,
    cycleTimeSec ?? existing.cycle_time_sec,
    machineId ?? existing.machine_id,
    seq ?? existing.seq,
    req.params.procId
  );
  res.json(partWithProcesses(existing.part_id));
});

router.delete('/processes/:procId', (req, res) => {
  const existing = db.prepare('SELECT * FROM processes WHERE id = ?').get(req.params.procId);
  if (!existing) return res.status(404).json({ error: 'Process not found' });
  db.prepare('DELETE FROM processes WHERE id = ?').run(req.params.procId);
  res.json(partWithProcesses(existing.part_id));
});

module.exports = router;
