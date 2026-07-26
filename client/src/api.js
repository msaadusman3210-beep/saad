const BASE = '/api';

function getToken() {
  return localStorage.getItem('psm_token');
}
function setToken(token) {
  if (token) localStorage.setItem('psm_token', token);
  else localStorage.removeItem('psm_token');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getToken,
  setToken,

  login: (name, pin) => request('/auth/login', { method: 'POST', body: { name, pin } }),
  register: (name, pin, role) =>
    request('/auth/register', { method: 'POST', body: { name, pin, role } }),
  getUsers: () => request('/auth/users'),

  getParts: () => request('/parts'),
  createPart: (data) => request('/parts', { method: 'POST', body: data }),
  updatePart: (id, data) => request('/parts/' + id, { method: 'PUT', body: data }),
  deletePart: (id) => request('/parts/' + id, { method: 'DELETE' }),
  addProcess: (partId, data) =>
    request(`/parts/${partId}/processes`, { method: 'POST', body: data }),
  updateProcess: (procId, data) =>
    request(`/parts/processes/${procId}`, { method: 'PUT', body: data }),
  deleteProcess: (procId) => request(`/parts/processes/${procId}`, { method: 'DELETE' }),

  getMachines: () => request('/machines'),
  createMachine: (data) => request('/machines', { method: 'POST', body: data }),

  getEntries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('/entries' + (qs ? '?' + qs : ''));
  },
  createEntry: (data) => request('/entries', { method: 'POST', body: data }),
  deleteEntry: (id) => request('/entries/' + id, { method: 'DELETE' }),

  getPlans: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('/plans' + (qs ? '?' + qs : ''));
  },
  setPlan: (partId, date, qty) =>
    request('/plans', { method: 'PUT', body: { partId, date, qty } }),

  getDashboard: (date) => request('/dashboard?date=' + date),
  getWip: (date) => request('/dashboard/wip?date=' + date),

  importJuly: () => request('/import/import-july', { method: 'POST' }),
  exportEntriesCsv: () => request('/data/export/entries'),
  exportPartsCsv: () => request('/data/export/parts'),
  resetData: () => request('/data/reset', { method: 'POST' }),
};
