// Pure functions only — no DB, no Express. Takes plain row arrays (as returned
// by better-sqlite3) and returns computed results. Kept separate so it can be
// unit-tested in isolation from the web server.

function processesForPart(processes, partId) {
  return processes
    .filter((p) => p.part_id === partId)
    .slice()
    .sort((a, b) => a.seq - b.seq);
}

function cumulativeQty(entries, partId, processId, throughDate) {
  let sum = 0;
  for (const e of entries) {
    if (
      e.part_id === partId &&
      e.process_id === processId &&
      (!throughDate || e.date <= throughDate)
    ) {
      sum += Number(e.qty) || 0;
    }
  }
  return sum;
}

function periodQty(entries, partId, processId, fromDate, toDate) {
  let sum = 0;
  for (const e of entries) {
    if (
      e.part_id === partId &&
      e.process_id === processId &&
      e.date >= fromDate &&
      e.date <= toDate
    ) {
      sum += Number(e.qty) || 0;
    }
  }
  return sum;
}

function trackProcessId(part, processes) {
  const procs = processesForPart(processes, part.id);
  if (procs.length === 0) return null;
  const tracked = procs.find((p) => p.id === part.track_process_id);
  return tracked ? tracked.id : procs[procs.length - 1].id;
}

function wipRows(part, processes, entries, asOfDate) {
  const procs = processesForPart(processes, part.id);
  const rows = procs.map((pr) => ({
    processId: pr.id,
    name: pr.name,
    cumulative: cumulativeQty(entries, part.id, pr.id, asOfDate),
  }));
  for (let i = 0; i < rows.length - 1; i++) {
    rows[i].wipToNext = rows[i].cumulative - rows[i + 1].cumulative;
  }
  if (rows.length) rows[rows.length - 1].wipToNext = null;
  return rows;
}

function totalWip(part, processes, entries, asOfDate) {
  const rows = wipRows(part, processes, entries, asOfDate);
  return rows.reduce(
    (sum, r) => sum + (r.wipToNext !== null && r.wipToNext !== undefined ? r.wipToNext : 0),
    0
  );
}

function planQtyForDay(plans, partId, date) {
  const row = plans.find((p) => p.part_id === partId && p.date === date);
  return row ? Number(row.qty) : 0;
}

function planQtyForRange(plans, partId, fromDate, toDate) {
  return plans
    .filter((p) => p.part_id === partId && p.date >= fromDate && p.date <= toDate)
    .reduce((sum, p) => sum + Number(p.qty), 0);
}

function actualForDay(entries, part, processes, date) {
  const tpId = trackProcessId(part, processes);
  if (!tpId) return 0;
  return periodQty(entries, part.id, tpId, date, date);
}

function actualForRange(entries, part, processes, fromDate, toDate) {
  const tpId = trackProcessId(part, processes);
  if (!tpId) return 0;
  return periodQty(entries, part.id, tpId, fromDate, toDate);
}

function dashboardSummary(parts, processes, entries, plans, date) {
  const ym = date.slice(0, 7);
  const monthStart = ym + '-01';
  return parts.map((part) => {
    const planDay = planQtyForDay(plans, part.id, date);
    const actualDay = actualForDay(entries, part, processes, date);
    const planMtd = planQtyForRange(plans, part.id, monthStart, date);
    const actualMtd = actualForRange(entries, part, processes, monthStart, date);
    const wip = totalWip(part, processes, entries, date);
    return {
      partId: part.id,
      name: part.name,
      customer: part.customer,
      planDay,
      actualDay,
      achDay: planDay > 0 ? (actualDay / planDay) * 100 : null,
      planMtd,
      actualMtd,
      achMtd: planMtd > 0 ? (actualMtd / planMtd) * 100 : null,
      wip,
    };
  });
}

module.exports = {
  processesForPart,
  cumulativeQty,
  periodQty,
  trackProcessId,
  wipRows,
  totalWip,
  planQtyForDay,
  planQtyForRange,
  actualForDay,
  actualForRange,
  dashboardSummary,
};
