import { useEffect, useMemo, useRef, useState } from 'react';
import Spotlight from '@enact/spotlight';
import { NavBar, Playlist, VideoPlayer, LogViewer, Slideshow } from './components/index.js';
import './styles.css';
import { appendLog } from './lib/logStore.js';

Spotlight.setPointerMode(false);

export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'player' | 'logs' | 'slideshow'
  const [playlist, setPlaylist] = useState([]);
  const [selected, setSelected] = useState(null);
  const mainRef = useRef(null);
  const lastViewRef = useRef('home');
  const navStartRef = useRef(0);

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
      case 'slideshow':
        return <NavBar title="Slideshow" onBack={() => setView('home')} right={<button onClick={() => setView('logs')}>Logs</button>} />;
      default:
        return (
          <NavBar
            title="webOS Player"
            right={
              <>
                <button onClick={() => setView('slideshow')}>Start Slideshow</button>
                <button onClick={() => setView('logs')}>Logs</button>
              </>
            }
          />
        );
    }
  }, [view, selected]);

  const content = useMemo(() => {
    if (view === 'player' && selected) {
      return (
        <div className="page" ref={mainRef} data-page="player" data-spotlight-container data-spotlight-id="page-player">
          <VideoPlayer source={selected} autoPlay />
        </div>
      );
    }
    if (view === 'logs') {
      return (
        <div className="page" ref={mainRef} data-page="logs" data-spotlight-container data-spotlight-id="page-logs">
          <LogViewer />
        </div>
      );
    }
    if (view === 'slideshow') {
      return (
        <div className="page" ref={mainRef} data-page="slideshow" data-spotlight-container data-spotlight-id="page-slideshow">
          <Slideshow items={playlist} onExit={() => setView('home')} />
        </div>
      );
    }
    return (
      <div className="page" ref={mainRef} data-page="home" data-spotlight-container data-spotlight-id="page-home">
        <Playlist items={playlist} onSelect={(item) => { setSelected(item); setView('player'); }} />
      </div>
    );
  }, [view, playlist, selected]);

  // Perf: measure transition time when view changes
  useEffect(() => {
    const from = lastViewRef.current;
    const to = view;
    navStartRef.current = performance.now();
    // After next paint, measure duration
    const id = requestAnimationFrame(() => {
      const dur = performance.now() - navStartRef.current;
      appendLog({ type: 'perf', detail: { event: 'transition', from, to, durationMs: Math.round(dur) } });
    });
    lastViewRef.current = to;
    return () => cancelAnimationFrame(id);
  }, [view]);

  // Spotlight: focus the current page container
  useEffect(() => {
    const pageId = view === 'home' ? 'page-home' : view === 'player' ? 'page-player' : 'page-logs';
    try { Spotlight.focus(pageId); } catch {}
  }, [view]);

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
