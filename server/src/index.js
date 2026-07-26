require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const authRoutes = require('./routes/auth');
const partsRoutes = require('./routes/parts');
const machinesRoutes = require('./routes/machines');
const entriesRoutes = require('./routes/entries');
const plansRoutes = require('./routes/plans');
const dashboardRoutes = require('./routes/dashboard');
const dataRoutes = require('./routes/data');
const importRoutes = require('./routes/import');

let db;
try {
  db = require('./db');
} catch (err) {
  console.error('Failed to load database:', err.message);
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize default admin if not exists
try {
  if (db) {
    const adminExists = db.prepare('SELECT id FROM users WHERE name = ?').get('Admin');
    if (!adminExists) {
      const adminId = uuidv4();
      const pinHash = bcrypt.hashSync('1234', 10);
      db.prepare('INSERT INTO users (id, name, pin_hash, role) VALUES (?,?,?,?)').run(
        adminId,
        'Admin',
        pinHash,
        'Admin'
      );
      console.log('Default admin user created');
    }
  }
} catch (err) {
  console.error('Error initializing admin:', err.message);
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/import', importRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

// Export for Vercel serverless
module.exports = app;

// Listen locally for development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Press Shop API listening on http://localhost:${PORT}`);
  });
}
