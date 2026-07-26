import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

function custClass(c) {
  if (!c) return 'other';
  return c.toLowerCase().replace(/[^a-z]/g, '');
}

export default function Parts() {
  const [parts, setParts] = useState([]);
  const [machines, setMachines] = useState([]);
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('AHL');
  const [pps, setPps] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const [p, m] = await Promise.all([api.getParts(), api.getMachines()]);
      setParts(p);
      setMachines(m);
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function addPart(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await api.createPart({ name, customer, piecesPerSheet: Number(pps) || 0 });
      // Standard sequence for every new part: Blanking -> Piercing -> Bending
      await api.addProcess(created.id, { name: 'Blanking', cycleTimeSec: 3 });
      await api.addProcess(created.id, { name: 'Piercing', cycleTimeSec: 2.5 });
      await api.addProcess(created.id, { name: 'Bending', cycleTimeSec: 4 });
      setName('');
      setPps('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removePart(id) {
    if (!window.confirm('Delete this part and its processes?')) return;
    try {
      await api.deletePart(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function machineName(id) {
    const m = machines.find((mm) => mm.id === id);
    return m ? m.name : '—';
  }

  return (
    <section>
      <div className="card">
        <h2>Add a part</h2>
        <p className="sub">
          New parts are automatically set up with the standard Blanking &rarr; Piercing &rarr; Bending
          sequence. Edit cycle times and machine assignment on the part card below.
        </p>
        <form className="row" onSubmit={addPart}>
          <div className="field">
            <label>Part name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Customer</label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </div>
          <div className="field">
            <label>Pieces per sheet</label>
            <input type="number" value={pps} onChange={(e) => setPps(e.target.value)} />
          </div>
          <div className="field">
            <button className="btn" type="submit">
              Save part
            </button>
          </div>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="card">
        <h2>Existing parts</h2>
        {parts.length === 0 && <p className="empty">No parts yet.</p>}
        {parts.map((part) => (
          <div className="part-block" key={part.id}>
            <div className="part-block-head">
              <h3>
                {part.name}{' '}
                <span className={'badge cust-' + custClass(part.customer)}>{part.customer}</span>
              </h3>
              <button className="btn danger small" type="button" onClick={() => removePart(part.id)}>
                Delete
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Process</th>
                    <th className="num">Cycle time (s)</th>
                    <th>Machine</th>
                  </tr>
                </thead>
                <tbody>
                  {part.processes.map((pr, i) => (
                    <tr key={pr.id}>
                      <td>{i + 1}</td>
                      <td>{pr.name}</td>
                      <td className="num">{pr.cycle_time_sec}</td>
                      <td>{machineName(pr.machine_id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
