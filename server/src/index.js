require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const partsRoutes = require('./routes/parts');
const machinesRoutes = require('./routes/machines');
const entriesRoutes = require('./routes/entries');
const plansRoutes = require('./routes/plans');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Basic error handler so a thrown error returns JSON instead of an HTML stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Press Shop API listening on http://localhost:${PORT}`);
});
