const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Store application data (parts, entries, plans, etc.)
// For simplicity, we'll store as JSON in a key-value table
// In production, this should be proper schema

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
    
    // Check if exists
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

module.exports = router;
