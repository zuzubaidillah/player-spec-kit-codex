import { useEffect, useMemo, useRef, useState } from 'react';
import Spotlight from '@enact/spotlight';
import { NavBar, LogViewer, Slideshow } from './components/index.js';
import './styles.css';
import { appendLog } from './lib/logStore.js';

Spotlight.setPointerMode(false);

const DEFAULT_PLAYLIST = [
  { id: 'local-slide', title: 'Local Slide', src: 'slide-offline.png', type: 'image/png', duration: 5 }
];

export default function App() {
  const [view, setView] = useState('slideshow'); // 'slideshow' | 'logs'
  const [playlist, setPlaylist] = useState(DEFAULT_PLAYLIST);
  const mainRef = useRef(null);
  const lastViewRef = useRef('home');
  const navStartRef = useRef(0);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    Spotlight.resume();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/playlist.json');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length) {
          setPlaylist(data.items);
        }
      } catch (e) {
        console.error('Failed to load playlist', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const header = useMemo(() => {
    switch (view) {
      case 'logs':
        return <NavBar title="Logs" onBack={() => setView('slideshow')} />;
      default:
        return <NavBar title="Slideshow" right={<button onClick={() => setView('logs')}>Logs</button>} />;
    }
  }, [view]);

  const content = useMemo(() => {
    if (view === 'logs') {
      return (
        <div className="page" ref={mainRef} data-page="logs" data-spotlight-container data-spotlight-id="page-logs">
          <LogViewer />
        </div>
      );
    }
    return (
      <div className="page" ref={mainRef} data-page="slideshow" data-spotlight-container data-spotlight-id="page-slideshow">
        <Slideshow items={playlist} onExit={() => setView('slideshow')} />
      </div>
    );
  }, [view, playlist]);

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
    const pageId = view === 'logs' ? 'page-logs' : 'slideshow-stage';
    try { Spotlight.focus(pageId); } catch {}
  }, [view]);

  // Global D-pad/back handling
  useEffect(() => {
    const onKey = (e) => {
      // Map webOS remotes (Back/Escape) to back navigation
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (view === 'logs') {
          setView('slideshow');
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view]);

  return (
    <div className="app" data-spotlight-container data-spotlight-id="app-root">
      {header}
      {content}
    </div>
  );
}
