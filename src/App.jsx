import { useEffect, useMemo, useRef, useState } from 'react';
import Spotlight from '@enact/spotlight';
import { NavBar, LogViewer, Slideshow } from './components/index.js';
import './styles.css';
import { appendLog } from './lib/logStore.js';

Spotlight.setPointerMode(false);

const USE_LOCAL = true; // local slideshow mode
const LOCAL_DURATION_SEC = 7; // default per-slide duration
const DEFAULT_PLAYLIST = [];

function guessTypeFromUrl(u) {
  const url = String(u || '').toLowerCase();
  if (url.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (/(\.mp4|\.webm|\.ogg)(\?|#|$)/.test(url)) return 'video/mp4';
  if (/(\.jpg|\.jpeg)(\?|#|$)/.test(url)) return 'image/jpeg';
  if (/(\.png)(\?|#|$)/.test(url)) return 'image/png';
  if (/(\.gif)(\?|#|$)/.test(url)) return 'image/gif';
  if (/(\.webp)(\?|#|$)/.test(url)) return 'image/webp';
  return '';
}

function normalizeDidapor(items) {
  const base = 'https://didapor.id/';
  const arr = Array.isArray(items?.data) ? items.data : (Array.isArray(items) ? items : []);
  return arr.map((it, i) => {
    const raw = it?.src || it?.url || it?.path || it?.media_url || it?.image || it?.video || it?.poster || '';
    const src = raw ? (new URL(raw, base)).toString() : '';
    let type = String(it?.type || '').toLowerCase();
    if (!type) type = guessTypeFromUrl(src);
    if (type === 'image') type = 'image/*';
    if (type === 'video') type = 'video/*';
    const poster = it?.poster || it?.thumbnail || '';
    const title = String(it?.title || it?.name || it?.caption || src.split('/').pop() || `Item ${i+1}`);
    const out = { id: it?.id || `didapor-${i}`, title, src, type };
    if (poster) out.poster = (new URL(poster, base)).toString();
    const dur = Number(it?.duration || it?.durationSec || (it?.durationMs ? it.durationMs/1000 : 0) || 0);
    if (Number.isFinite(dur) && dur > 0) out.duration = dur;
    if (it?.fit) out.fit = it.fit;
    return out;
  }).filter(x => x.src);
}

// (deduped helpers above)

export default function App() {
  const [view, setView] = useState('slideshow'); // 'slideshow' | 'logs'
  const [playlist, setPlaylist] = useState(DEFAULT_PLAYLIST);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const mainRef = useRef(null);
  const lastViewRef = useRef('home');
  const navStartRef = useRef(0);
  const autoStartedRef = useRef(false);
  const retryRef = useRef(null);

  useEffect(() => {
    Spotlight.resume();
  }, []);

  // Local slideshow discovery: scan for slide-00*.png (slide-001.png ...)
  useEffect(() => {
    if (!USE_LOCAL) return;
    let cancelled = false;

    const tryImg = (src) => new Promise((resolve) => {
      const img = new Image();
      let done = false;
      const finish = (ok) => { if (!done) { done = true; resolve(ok); } };
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = src + '?t=' + Date.now();
      setTimeout(() => finish(false), 4000);
    });

    (async () => {
      const found = [];
      // Try slide-001..slide-050 with .png then .jpg
      for (let i = 1; i <= 50; i++) {
        const name = 'slide-' + String(i).padStart(3, '0');
        const png = name + '.png';
        const jpg = name + '.jpg';
        // Prefer .png
        // eslint-disable-next-line no-await-in-loop
        const okPng = await tryImg(png);
        if (okPng) {
          found.push({ id: name, title: name, src: png, type: 'image/png', duration: LOCAL_DURATION_SEC });
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const okJpg = await tryImg(jpg);
        if (okJpg) found.push({ id: name, title: name, src: jpg, type: 'image/jpeg', duration: LOCAL_DURATION_SEC });
      }
      if (!cancelled) {
        setPlaylist(found);
        setLoading(false);
        setLoadError(found.length ? '' : 'No local slides found (slide-00*.png|jpg)');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // (removed duplicate fetch effect; single remote fetch above drives playlist)

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
        {loading ? (
          <div style={{padding:12,opacity:.8}}>Loading local slides…</div>
        ) : playlist && playlist.length ? (
          <Slideshow items={playlist} onExit={() => setView('slideshow')} />
        ) : (
          <div style={{padding:12,opacity:.8}}>No items. {loadError ? `(${loadError})` : ''}</div>
        )}
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
