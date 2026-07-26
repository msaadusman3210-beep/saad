const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM machines ORDER BY name').all());
});

router.post('/', (req, res) => {
  const { name, tonnage, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Machine name required' });
  const id = uuidv4();
  db.prepare('INSERT INTO machines (id, name, tonnage, notes) VALUES (?,?,?,?)').run(
    id,
    name,
    tonnage || '',
    notes || ''
  );
  res.status(201).json(db.prepare('SELECT * FROM machines WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Machine not found' });
  const { name, tonnage, notes } = req.body;
  db.prepare('UPDATE machines SET name=?, tonnage=?, notes=? WHERE id=?').run(
    name ?? existing.name,
    tonnage ?? existing.tonnage,
    notes ?? existing.notes,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM machines WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
