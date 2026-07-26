import React from 'react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'entry', label: 'Daily Entry' },
  { id: 'parts', label: 'Parts & Processes' },
  { id: 'machines', label: 'Machines' },
  { id: 'wip', label: 'WIP Report' },
];

export default function Sidebar({ active, onChange, user, onSignOut, theme, onToggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">PS</div>
        <div>
          <h1>Press Shop Production Manager</h1>
          <span>Blanking &rarr; Piercing &rarr; Bending</span>
        </div>
      </div>

      <nav className="tabs-vertical">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={active === tab.id ? 'active' : ''}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span>{user ? `${user.name} (${user.role})` : ''}</span>
          <button className="header-btn" type="button" onClick={onToggleTheme}>
            {theme === 'dark' ? '\u2600 Light' : '\uD83C\uDF19 Dark'}
          </button>
          <button className="header-btn" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
