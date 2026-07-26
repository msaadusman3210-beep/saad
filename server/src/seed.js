require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const DUMMY_PARTS = [
  'Clutch Lifter',
  'Hood Hinge R',
  'Hood Hinge L',
  'Striker Y4J',
  'Bracket Engine Mounting',
  'Stay Front Fender',
  'Band Battery Mount',
  'Plate Main Stand Stopper',
  'Handle Lock Stopper',
  'Meter Stay',
  'Washer Plain',
  'Nut Fuel Tank',
];
const CUSTOMERS = ['AHL', 'HINO PAK', 'AGRI AUTO'];
const STEP_SEQUENCE = [
  { name: 'Blanking', cycleTimeSec: 3.0 },
  { name: 'Piercing', cycleTimeSec: 2.5 },
  { name: 'Bending', cycleTimeSec: 4.2 },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function run() {
  console.log('Seeding database...');

  db.exec(`
    DELETE FROM entries;
    DELETE FROM plans;
    DELETE FROM processes;
    DELETE FROM parts;
    DELETE FROM machines;
    DELETE FROM users;
  `);

  // Default admin account
  const adminId = uuidv4();
  db.prepare('INSERT INTO users (id, name, pin_hash, role) VALUES (?,?,?,?)').run(
    adminId,
    'Admin',
    bcrypt.hashSync('1234', 10),
    'Admin'
  );

  // A handful of press machines
  const machineIds = [];
  for (let i = 1; i <= 10; i++) {
    const id = uuidv4();
    db.prepare('INSERT INTO machines (id, name, tonnage, notes) VALUES (?,?,?,?)').run(
      id,
      'Press ' + i,
      60 + i * 10 + 'T',
      ''
    );
    machineIds.push(id);
  }

  const ym = todayStr().slice(0, 7);
  const nDays = daysInMonth(ym);

  DUMMY_PARTS.forEach((name, idx) => {
    const partId = uuidv4();
    const customer = CUSTOMERS[idx % CUSTOMERS.length];
    db.prepare(
      'INSERT INTO parts (id, name, customer, pieces_per_sheet) VALUES (?,?,?,?)'
    ).run(partId, name, customer, 30 + (idx % 5) * 4);

    // Every part gets the same three-step sequence, in order:
    // 1. Blanking  2. Piercing  3. Bending
    let trackId = null;
    STEP_SEQUENCE.forEach((step, seq) => {
      const stepId = uuidv4();
      const machineId = machineIds[(idx + seq) % machineIds.length];
      db.prepare(
        'INSERT INTO processes (id, part_id, name, seq, cycle_time_sec, machine_id) VALUES (?,?,?,?,?,?)'
      ).run(stepId, partId, step.name, seq, step.cycleTimeSec, machineId);
      trackId = stepId; // Bending (last step) is the "finished good" tracking stage
    });
    db.prepare('UPDATE parts SET track_process_id = ? WHERE id = ?').run(trackId, partId);

    // Dummy monthly plan: a flat daily quantity for the whole current month
    const planQty = 400 + (idx % 4) * 50;
    for (let d = 1; d <= nDays; d++) {
      const ds = ym + '-' + String(d).padStart(2, '0');
      db.prepare('INSERT OR IGNORE INTO plans (id, part_id, date, qty) VALUES (?,?,?,?)').run(
        uuidv4(),
        partId,
        ds,
        planQty
      );
    }

    // Dummy actual production entries for the last 5 days, across all 3 processes,
    // with a bit of natural attrition from Blanking -> Piercing -> Bending (normal WIP).
    const procRows = db
      .prepare('SELECT * FROM processes WHERE part_id = ? ORDER BY seq')
      .all(partId);
    for (let back = 4; back >= 0; back--) {
      const ds = isoDaysAgo(back);
      const base = 420 + (idx % 3) * 30 - back * 5;
      procRows.forEach((proc, seq) => {
        const qty = Math.max(0, base - seq * 20);
        const rejection = Math.round(qty * 0.01);
        db.prepare(
          `INSERT INTO entries
             (id, date, part_id, process_id, qty, machine_no, worker, downtime, rejection, entered_by)
           VALUES (?,?,?,?,?,?,?,?,?,?)`
        ).run(uuidv4(), ds, partId, proc.id, qty, '', 'Demo Operator', 0, rejection, 'Seed script');
      });
    }
  });

  console.log(
    `Seed complete: 1 admin user (Admin / PIN 1234), ${machineIds.length} machines, ` +
      `${DUMMY_PARTS.length} parts each set up with Blanking -> Piercing -> Bending, ` +
      `plus ${nDays} days of plan and 5 days of actual entries per part.`
  );
}

run();
