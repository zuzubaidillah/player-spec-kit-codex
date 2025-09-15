import { useEffect, useState } from 'react';
import { clearLogs, readLogs } from '../lib/logStore.js';
import './LogViewer.css';

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { setLogs(readLogs()); }, []);

  const refresh = () => setLogs(readLogs());
  const clear = () => { clearLogs(); refresh(); };

  return (
    <div className="logviewer">
      <div className="toolbar">
        <button onClick={refresh}>Refresh</button>
        <button onClick={clear}>Clear</button>
      </div>
      <ul>
        {logs.map((l, i) => (
          <li key={i}>
            <span className="time">{l.time}</span>
            <span className="type">{l.type}</span>
            <code className="detail">{JSON.stringify(l.detail)}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
