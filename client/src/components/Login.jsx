import React, { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLoggedIn }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('Operator');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data =
        mode === 'login' ? await api.login(name, pin) : await api.register(name, pin, role);
      api.setToken(data.token);
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-overlay">
      <div className="card login-card">
        <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
        <p className="sub">
          {mode === 'login'
            ? 'Enter your name and PIN to continue.'
            : "Pick a name and a PIN — this is for accountability on a shared device, it's not a secure password."}
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>
          {mode === 'register' && (
            <div className="field" style={{ marginTop: 10 }}>
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Operator">Operator</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 14 }}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account & sign in'}
          </button>
        </form>
        <p className="helper" style={{ marginTop: 12 }}>
          {mode === 'login' ? (
            <>
              First time?{' '}
              <button type="button" className="link-btn" onClick={() => setMode('register')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have one?{' '}
              <button type="button" className="link-btn" onClick={() => setMode('login')}>
                Sign in instead
              </button>
            </>
          )}
        </p>
        {mode === 'login' && (
          <p className="helper">
            Default admin account (after running the seed script): <b>Admin</b> / PIN <b>1234</b>
          </p>
        )}
      </div>
    </div>
  );
}
