import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmt(n) {
  return (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString();
}
function custClass(c) {
  if (!c) return 'other';
  return c.toLowerCase().replace(/[^a-z]/g, '');
}

export default function Dashboard() {
  const [date, setDate] = useState(todayStr());
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getDashboard(date)
      .then((data) => {
        if (!cancelled) {
          setSummary(data.summary);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const totals = summary.reduce(
    (acc, r) => ({
      plan: acc.plan + (r.planDay || 0),
      actual: acc.actual + (r.actualDay || 0),
      wip: acc.wip + (r.wip || 0),
    }),
    { plan: 0, actual: 0, wip: 0 }
  );
  const ach = totals.plan > 0 ? (totals.actual / totals.plan) * 100 : null;
  const achClass = ach == null ? 'neutral' : ach >= 95 ? 'good' : ach >= 75 ? 'neutral' : 'bad';

  return (
    <section>
      <div className="card">
        <div className="row">
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {error && (
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi neutral">
          <div className="label">Plan — day</div>
          <div className="value">{fmt(totals.plan)}</div>
        </div>
        <div className="kpi neutral">
          <div className="label">Actual — day</div>
          <div className="value">{fmt(totals.actual)}</div>
        </div>
        <div className={'kpi ' + achClass}>
          <div className="label">Achievement</div>
          <div className="value">{ach == null ? '—' : fmt(ach) + '%'}</div>
        </div>
        <div className="kpi neutral">
          <div className="label">Total WIP</div>
          <div className="value">{fmt(totals.wip)}</div>
        </div>
      </div>

      <div className="card">
        <h2>Part-wise summary</h2>
        {loading ? (
          <p className="empty">Loading…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Customer</th>
                  <th className="num">Plan</th>
                  <th className="num">Actual</th>
                  <th className="num">Ach %</th>
                  <th className="num">WIP</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      No parts yet.
                    </td>
                  </tr>
                )}
                {summary.map((r) => {
                  const rowAch = r.planDay > 0 ? (r.actualDay / r.planDay) * 100 : null;
                  const badgeClass =
                    rowAch == null ? 'neutral' : rowAch >= 95 ? 'good' : rowAch >= 75 ? 'neutral' : 'bad';
                  return (
                    <tr key={r.partId}>
                      <td>{r.name}</td>
                      <td>
                        <span className={'badge cust-' + custClass(r.customer)}>{r.customer}</span>
                      </td>
                      <td className="num">{fmt(r.planDay)}</td>
                      <td className="num">{fmt(r.actualDay)}</td>
                      <td className="num">
                        <span className={'badge ' + badgeClass}>
                          {rowAch == null ? '—' : fmt(rowAch) + '%'}
                        </span>
                      </td>
                      <td className="num">{fmt(r.wip)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
