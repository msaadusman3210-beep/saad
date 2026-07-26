import React, { useState } from 'react';
import { api } from '../api.js';

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings({ user }) {
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState('');

  const handleImport = async () => {
    if (!window.confirm(
      'This will import parts data from the July 2026 Production Plan sheet (128 parts with customers, opening stock, daily plans, and actual entry data). Parts already in your list with the same name will have their customer corrected. Continue?'
    )) return;

    setImporting(true);
    setImportMsg('');
    try {
      const data = await api.importJuly();
      setImportMsg(data.message || 'Import completed');
    } catch (err) {
      setImportMsg('Error: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportEntries = async () => {
    setExporting('entries');
    try {
      const data = await api.exportEntriesCsv();
      downloadCsv(data.csv, 'press_shop_entries.csv');
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting('');
    }
  };

  const handleExportParts = async () => {
    setExporting('parts');
    try {
      const data = await api.exportPartsCsv();
      downloadCsv(data.csv, 'press_shop_parts_processes.csv');
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting('');
    }
  };

  const handleReset = async () => {
    if (!window.confirm(
      'This will permanently clear ALL parts, processes, entries, plans, and app data. Machines will be reset to 47 defaults. This cannot be undone. Continue?'
    )) return;
    if (!window.confirm('Are you absolutely sure? All production data will be lost.')) return;

    setResetting(true);
    try {
      const data = await api.resetData();
      alert(data.message || 'All data cleared');
      window.location.reload();
    } catch (err) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const isAdmin = user && user.role === 'Admin';

  return (
    <section>
      <div className="card">
        <h2>Import from your Production Plan sheet</h2>
        <p className="sub">
          Pulled from the "July 2026" sheet of your Production Plan file: 128 parts
          classified by customer (AHL, HINO PAK, AGRI AUTO, PSMCL, YMPK, ICT), this
          month's opening stock per department, and the daily plan quantities already
          scheduled for July. Parts already in your list (matched by name) are skipped,
          so this is safe to run more than once. Any actual production found in that
          sheet is logged against a placeholder "Production" process per part until
          you break each part into its real process steps in the Parts tab.
        </p>
        <div className="row">
          <button
            className="btn accent"
            type="button"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Import parts from July 2026 plan'}
          </button>
        </div>
        {importMsg && (
          <p className="helper" style={{ marginTop: 10, color: 'var(--success)' }}>
            {importMsg}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Data &amp; storage</h2>
        <p className="sub">
          This tool stores parts, processes, machines, plans, and daily entries in a
          SQLite database on the server. You can export data to CSV files or reset
          everything (Admin only).
        </p>
        <div className="row">
          <button
            className="btn ghost"
            type="button"
            onClick={handleExportEntries}
            disabled={exporting === 'entries'}
          >
            {exporting === 'entries' ? 'Exporting...' : 'Export entries to CSV'}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={handleExportParts}
            disabled={exporting === 'parts'}
          >
            {exporting === 'parts' ? 'Exporting...' : 'Export parts &amp; processes to CSV'}
          </button>
          {isAdmin && (
            <button
              className="btn danger"
              type="button"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? 'Resetting...' : 'Clear all data'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

