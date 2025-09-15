import { useEffect, useMemo, useRef, useState } from 'react';
import Spotlight from '@enact/spotlight';
import { NavBar, Playlist, VideoPlayer, LogViewer } from './components/index.js';
import './styles.css';

Spotlight.setPointerMode(false);

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'player' | 'logs'
  const [playlist, setPlaylist] = useState([]);
  const [selected, setSelected] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    Spotlight.resume();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/playlist.json');
        const data = await res.json();
        if (!cancelled) setPlaylist(data.items || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load playlist', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const header = useMemo(() => {
    switch (view) {
      case 'player':
        return <NavBar title={selected?.title || 'Player'} onBack={() => setView('home')} right={<button onClick={() => setView('logs')}>Logs</button>} />;
      case 'logs':
        return <NavBar title="Logs" onBack={() => setView(selected ? 'player' : 'home')} />;
      default:
        return <NavBar title="webOS Player" right={<button onClick={() => setView('logs')}>Logs</button>} />;
    }
  }, [view, selected]);

  const content = useMemo(() => {
    if (view === 'player' && selected) {
      return (
        <div className="page" ref={mainRef} data-page="player">
          <VideoPlayer source={selected} autoPlay />
        </div>
      );
    }
    if (view === 'logs') {
      return (
        <div className="page" ref={mainRef} data-page="logs">
          <LogViewer />
        </div>
      );
    }
    return (
      <div className="page" ref={mainRef} data-page="home">
        <Playlist items={playlist} onSelect={(item) => { setSelected(item); setView('player'); }} />
      </div>
    );
  }, [view, playlist, selected]);

  // Global D-pad/back handling
  useEffect(() => {
    const onKey = (e) => {
      // Map webOS remotes (Back/Escape) to back navigation
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (view === 'player') {
          setView('home');
          e.preventDefault();
        } else if (view === 'logs') {
          setView(selected ? 'player' : 'home');
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, selected]);

  return (
    <div className="app" data-spotlight-container data-spotlight-id="app-root">
      {header}
      {content}
    </div>
  );
}
