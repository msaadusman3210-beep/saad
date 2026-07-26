import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Login from './components/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DailyEntry from './pages/DailyEntry.jsx';
import Parts from './pages/Parts.jsx';
import Machines from './pages/Machines.jsx';
import WipReport from './pages/WipReport.jsx';
import Settings from './pages/Settings.jsx';
import { api } from './api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('psm_theme') || 'light');
  const [checkedToken, setCheckedToken] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('psm_theme', theme);
  }, [theme]);

  useEffect(() => {
    // v1 has no "who am I" endpoint. If a token is already stored we optimistically
    // treat the session as active for display purposes; any expired/invalid token
    // will simply fail on the first real API call and the user can sign in again.
    setCheckedToken(true);
  }, []);

  if (!checkedToken) return null;

  if (!user) {
    return <Login onLoggedIn={setUser} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={tab}
        onChange={setTab}
        user={user}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onSignOut={() => {
          api.setToken(null);
          setUser(null);
        }}
      />
      <div className="main-col">
        <main>
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'entry' && <DailyEntry />}
          {tab === 'parts' && <Parts />}
          {tab === 'machines' && <Machines />}
          {tab === 'wip' && <WipReport />}
          {tab === 'settings' && <Settings user={user} />}
        </main>
        <footer>Press Shop Production Manager &middot; React + Node backend</footer>
      </div>
    </div>
  );
}
