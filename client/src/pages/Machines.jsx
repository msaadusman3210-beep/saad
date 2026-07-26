import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [name, setName] = useState('');
  const [tonnage, setTonnage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setMachines(await api.getMachines());
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createMachine({ name, tonnage });
      setName('');
      setTonnage('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="card">
        <h2>Press machines</h2>
        <form className="row" onSubmit={add}>
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Tonnage</label>
            <input value={tonnage} onChange={(e) => setTonnage(e.target.value)} />
          </div>
          <div className="field">
            <button className="btn ghost" type="submit">
              + Add machine
            </button>
          </div>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th>Tonnage</th>
              </tr>
            </thead>
            <tbody>
              {machines.length === 0 && (
                <tr>
                  <td colSpan={2} className="empty">
                    No machines yet.
                  </td>
                </tr>
              )}
              {machines.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.tonnage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
