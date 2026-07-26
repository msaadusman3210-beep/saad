const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired, adminOnly, secret } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { name, pin } = req.body;
    if (!name || !pin) return res.status(400).json({ error: 'Name and PIN required' });

    const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name.trim());
    if (!user) return res.status(401).json({ error: 'User not found' });

    const ok = bcrypt.compareSync(String(pin), user.pin_hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect PIN' });

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      secret(),
      { expiresIn: '12h' }
    );
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

router.post('/register', (req, res) => {
  try {
    const { name, pin, role } = req.body;
    if (!name || !pin) return res.status(400).json({ error: 'Name and PIN required' });

    const existing = db.prepare('SELECT id FROM users WHERE name = ?').get(name.trim());
    if (existing) return res.status(409).json({ error: 'That name is already registered' });

    const id = uuidv4();
    const pinHash = bcrypt.hashSync(String(pin), 10);
    const finalRole = role === 'Admin' ? 'Admin' : 'Operator';
    db.prepare('INSERT INTO users (id, name, pin_hash, role) VALUES (?,?,?,?)').run(
      id,
      name.trim(),
      pinHash,
      finalRole
    );

    const token = jwt.sign({ id, name: name.trim(), role: finalRole }, secret(), {
      expiresIn: '12h',
    });
    res.status(201).json({ token, user: { id, name: name.trim(), role: finalRole } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

router.get('/users', authRequired, adminOnly, (req, res) => {
  try {
    res.json(db.prepare('SELECT id, name, role FROM users ORDER BY name').all());
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Failed to fetch users', message: err.message });
  }
});

module.exports = router;
