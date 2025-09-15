const KEY = 'playerLogs';

export function appendLog(entry) {
  try {
    const now = new Date().toISOString();
    const payload = { time: now, ...entry };
    const current = JSON.parse(localStorage.getItem(KEY) || '[]');
    current.push(payload);
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {}
}

export function readLogs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearLogs() {
  try { localStorage.removeItem(KEY); } catch {}
}
