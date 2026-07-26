const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { dashboardSummary, wipRows } = require('../lib/calc');

const router = express.Router();
router.use(authRequired);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

router.get('/', (req, res) => {
  const date = req.query.date || todayStr();
  const parts = db.prepare('SELECT * FROM parts').all();
  const processes = db.prepare('SELECT * FROM processes').all();
  const entries = db.prepare('SELECT * FROM entries').all();
  const plans = db.prepare('SELECT * FROM plans').all();
  res.json({ date, summary: dashboardSummary(parts, processes, entries, plans, date) });
});

router.get('/wip', (req, res) => {
  const date = req.query.date || todayStr();
  const parts = db.prepare('SELECT * FROM parts').all();
  const processes = db.prepare('SELECT * FROM processes').all();
  const entries = db.prepare('SELECT * FROM entries').all();
  const result = parts.map((part) => ({
    partId: part.id,
    name: part.name,
    customer: part.customer,
    rows: wipRows(part, processes, entries, date),
  }));
  res.json({ date, result });
});

module.exports = router;
