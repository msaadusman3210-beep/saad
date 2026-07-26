import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyEntry() {
  const [parts, setParts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [partId, setPartId] = useState('');
  const [processId, setProcessId] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const p = await api.getParts();
    setParts(p);
    setPartId((prev) => prev || (p[0] && p[0].id) || '');
    const e = await api.getEntries();
    setEntries(e);
  }
  useEffect(() => {
    load();
  }, []);

  const selectedPart = parts.find((p) => p.id === partId);

  useEffect(() => {
    if (
      selectedPart &&
      selectedPart.processes.length &&
      !selectedPart.processes.some((p) => p.id === processId)
    ) {
      setProcessId(selectedPart.processes[0].id);
    }
  }, [partId, parts]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!partId || !processId) {
      setError('Add a part with processes first');
      return;
    }
    try {
      await api.createEntry({ date, partId, processId, qty: Number(qty) || 0 });
      setQty('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this entry?')) return;
    await api.deleteEntry(id);
    load();
  }

  return (
    <section>
      <div className="card">
        <h2>Add production entry</h2>
        <form className="row" onSubmit={submit}>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Part</label>
            <select value={partId} onChange={(e) => setPartId(e.target.value)}>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Process</label>
            <select value={processId} onChange={(e) => setProcessId(e.target.value)}>
              {(selectedPart ? selectedPart.processes : []).map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Qty</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="field">
            <button className="btn" type="submit">
              Add entry
            </button>
          </div>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="card">
        <h2>Entries log</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Part</th>
                <th>Process</th>
                <th className="num">Qty</th>
                <th>Entered by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    No entries yet.
                  </td>
                </tr>
              )}
              {entries.map((e) => {
                const part = parts.find((p) => p.id === e.part_id);
                const proc = part ? part.processes.find((pr) => pr.id === e.process_id) : null;
                return (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{part ? part.name : '(deleted)'}</td>
                    <td>{proc ? proc.name : '(deleted)'}</td>
                    <td className="num">{e.qty}</td>
                    <td>{e.entered_by}</td>
                    <td>
                      <button className="icon-btn" type="button" onClick={() => remove(e.id)}>
                        &#10005;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
