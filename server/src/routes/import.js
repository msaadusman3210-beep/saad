const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');
const julyData = require('../data/july-import');

const router = express.Router();

// Import July 2026 data
router.post('/import-july', auth.authRequired, (req, res) => {
  try {
    if (!req.user.role || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    // Get all existing part names (lowercase for matching)
    const existingParts = {};
    db.prepare('SELECT id, name FROM parts').all().forEach(p => {
      existingParts[p.name.toLowerCase()] = p;
    });

    let added = 0, updated = 0, entriesAdded = 0;
    const processStmt = db.prepare(
      'INSERT INTO processes (id, part_id, name, seq, cycle_time_sec, machine_id) VALUES (?,?,?,?,?,?)'
    );

    julyData.forEach(item => {
      const key = item.name.toLowerCase();
      let part = existingParts[key];

      if (part) {
        // Update customer if different
        if (part.name !== item.name) {
          db.prepare('UPDATE parts SET customer = ? WHERE id = ?')
            .run(item.customer || 'Other', part.id);
          updated++;
        }
      } else {
        // Create new part
        const partId = uuidv4();
        const processId = uuidv4();

        db.prepare('INSERT INTO parts (id, name, customer, pieces_per_sheet, track_process_id) VALUES (?,?,?,?,?)')
          .run(partId, item.name, item.customer || 'Other', 0, processId);

        // Add placeholder "Production" process
        processStmt.run(processId, partId, 'Production', 0, 0, '');

        part = { id: partId, name: item.name };
        existingParts[key] = part;
        added++;

        // Add opening stock
        if (item.stock && Object.keys(item.stock).length > 0) {
          db.prepare(
            `INSERT INTO app_data (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`
          ).run(
            `opening_stock_${partId}_2026-07`,
            JSON.stringify(item.stock)
          );
        }

        // Add plan
        if (item.plan && Object.keys(item.plan).length > 0) {
          db.prepare(
            `INSERT INTO app_data (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`
          ).run(
            `plan_${partId}`,
            JSON.stringify(item.plan)
          );
        }

        // Add actual entries
        if (item.actual && Object.keys(item.actual).length > 0) {
          const entryStmt = db.prepare(
            'INSERT INTO entries (id, date, part_id, process_id, qty, machine_no, worker, downtime, rejection, entered_by) VALUES (?,?,?,?,?,?,?,?,?,?)'
          );
          Object.keys(item.actual).forEach(date => {
            entryStmt.run(
              uuidv4(),
              date,
              part.id,
              processId,
              item.actual[date] || 0,
              '',
              '',
              0,
              0,
              'Imported from July 2026 plan'
            );
            entriesAdded++;
          });
        }
      }
    });

    res.json({
      success: true,
      message: `Added ${added} new parts, updated ${updated} existing parts, imported ${entriesAdded} actual entries`
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
