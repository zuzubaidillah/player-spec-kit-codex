import { useEffect, useMemo, useRef, useState } from 'react';
import Spotlight from '@enact/spotlight';
import { NavBar, LogViewer, Slideshow } from './components/index.js';
import './styles.css';
import { appendLog } from './lib/logStore.js';

Spotlight.setPointerMode(false);

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

function absolutize(base, src) {
  try { return new URL(src, base).toString(); } catch { return src; }
}

function normalizeDidaporPayload(payload) {
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
  const base = 'https://didapor.id/';
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const it = list[i] || {};
    const rawSrc = it.src || it.url || it.path || it.media_url || it.image || it.video || it.poster || '';
    if (!rawSrc) continue;
    const src = absolutize(base, rawSrc);
    const title = it.title || it.name || it.caption || `Item ${i + 1}`;
    let type = (it.type || '').toLowerCase();
    if (!type) type = guessTypeFromUrl(src);
    const poster = it.poster || it.thumbnail || '';
    let duration = Number(it.duration || it.durationSec || (it.durationMs ? it.durationMs / 1000 : 0) || 0);
    if (!Number.isFinite(duration) || duration < 0) duration = 0;
    const item = { id: it.id || `didapor-${i}`, title, src, type };
    if (poster) item.poster = absolutize(base, poster);
    if (duration) item.duration = duration;
    if (it.fit) item.fit = it.fit;
    out.push(item);
  }
  return out;
}

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

  // Fetch remote playlist (didapor) and drive slideshow strictly from it
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('https://didapor.id/api/playlist', { cache: 'no-store' });
        const j = await r.json();
        const mapped = normalizeDidapor(j);
        if (!cancelled && mapped.length) setPlaylist(mapped);
      } catch (e) {
        console.error('Failed to load remote playlist', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try remote playlist from didapor first
        let applied = false;
        try {
          const resRemote = await fetch('https://didapor.id/api/playlist', { cache: 'no-store' });
          const dataRemote = await resRemote.json();
          const itemsRemote = normalizeDidaporPayload(dataRemote);
          if (!cancelled && itemsRemote.length) {
            setPlaylist(itemsRemote.length > 1 ? itemsRemote : [...itemsRemote, ...DEFAULT_PLAYLIST]);
            applied = true;
          }
        } catch {}

        if (!applied) {
          // Fallback to packaged playlist.json (if present)
          try {
            const res = await fetch('playlist.json', { cache: 'no-store' });
            const data = await res.json();
            if (!cancelled && Array.isArray(data.items)) {
              if (data.items.length > 1) {
                setPlaylist(data.items);
              } else if (data.items.length === 1) {
                setPlaylist([...data.items, ...DEFAULT_PLAYLIST]);
              }
            }
          } catch {}
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
