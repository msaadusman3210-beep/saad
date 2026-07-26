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

export default function WipReport() {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getWip(date)
      .then((res) => setData(res.result))
      .catch((err) => setError(err.message));
  }, [date]);

  return (
    <section>
      <div className="card">
        <div className="field">
          <label>As of date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      {error && (
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      )}
      {data.length === 0 && !error && (
        <div className="card">
          <p className="empty">No parts yet.</p>
        </div>
      )}
      {data.map((part) => (
        <div className="card" key={part.partId}>
          <h2>
            {part.name} <span className={'badge cust-' + custClass(part.customer)}>{part.customer}</span>
          </h2>
          <div className="funnel">
            {part.rows.map((r, i) => (
              <React.Fragment key={r.processId}>
                <div className="funnel-stage">
                  <div className="fname">{r.name}</div>
                  <div className="fcum">{fmt(r.cumulative)}</div>
                  <div className="fwip">
                    {r.wipToNext !== null ? (
                      <>
                        pending next stage: <b>{fmt(r.wipToNext)}</b>
                      </>
                    ) : (
                      'finished good stock'
                    )}
                  </div>
                </div>
                {i < part.rows.length - 1 && <div className="funnel-arrow">&rarr;</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
