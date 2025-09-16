import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideoPlayer from './VideoPlayer.jsx';
import './Slideshow.css';

export default function Slideshow({ items = [], startIndex = 0, defaultDuration = 5000, onExit, kiosk = true }) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  const [paused, setPaused] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgDims, setImgDims] = useState({w: 0, h: 0});
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const stallRef = useRef({ last: 0, timer: null, maxTimer: null });
  const containerRef = useRef(null);

  const item = items[index];
  const type = (item?.type || '').toLowerCase();
  const isImage = !!item && (type.startsWith('image/') || type === 'image' || type === 'image/*');
  const isVideo = !!item && (type.startsWith('video/') || type === 'video' || type === 'video/*' || type === 'application/vnd.apple.mpegurl');
  const isText  = !!item && (type.startsWith('text/') || item.kind === 'text');
  const fitMode = (item?.fit || 'contain'); // 'cover' | 'contain'
  const [textContent, setTextContent] = useState('');

  const durationMs = useMemo(() => {
    if (!item) return defaultDuration;
    if (isImage) {
      if (typeof item.durationMs === 'number') return item.durationMs;
      if (typeof item.duration === 'number') return item.duration * 1000;
      return defaultDuration;
    }
    return 0; // video uses onEnded
  }, [item, isImage, defaultDuration]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const next = useCallback(() => {
    if (!items.length) return;
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    if (!items.length) return;
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-advance for images & text; videos advance via onEnded
  useEffect(() => {
    clearTimer();
    setImgError(false);
    if (!paused && (isImage || isText) && durationMs > 0) {
      timerRef.current = setTimeout(() => next(), durationMs);
    }
    return () => clearTimer();
  }, [index, isImage, isText, durationMs, paused, next, clearTimer]);

  // Video stall watchdog and max duration safety
  useEffect(() => {
    // clear previous
    const s = stallRef.current;
    if (s.timer) { clearInterval(s.timer); s.timer = null; }
    if (s.maxTimer) { clearTimeout(s.maxTimer); s.maxTimer = null; }
    s.last = 0;

    if (!isVideo || paused) return;

    const v = videoRef.current;
    if (!v) return;

    const tick = () => {
      try {
        const t = v.currentTime || 0;
        if (t > s.last) {
          s.last = t;
        } else {
          // no progress; if stuck >8s, skip
          if (!s._since) s._since = Date.now();
          if (Date.now() - s._since > 8000) next();
        }
      } catch {}
    };
    s.timer = setInterval(tick, 2000);
    s.maxTimer = setTimeout(() => next(), 10 * 60 * 1000); // 10 minutes safeguard
    return () => {
      if (s.timer) { clearInterval(s.timer); s.timer = null; }
      if (s.maxTimer) { clearTimeout(s.maxTimer); s.maxTimer = null; }
      s._since = 0;
    };
  }, [index, isVideo, paused, next]);

  // Load text content if needed
  useEffect(() => {
    if (!isText) { setTextContent(''); return; }
    if (item?.text) { setTextContent(String(item.text)); return; }
    if (item?.src && /^data:text\//i.test(item.src)) {
      try {
        const comma = item.src.indexOf(',');
        const raw = item.src.slice(comma + 1);
        setTextContent(decodeURIComponent(raw));
      } catch { setTextContent(''); }
      return;
    }
    if (item?.src) {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(item.src);
          const txt = await res.text();
          if (!cancelled) setTextContent(txt);
        } catch { if (!cancelled) setTextContent(''); }
      })();
      return () => { cancelled = true; };
    }
  }, [isText, item?.src, item?.text]);

  // Keyboard controls: left/right navigate, space toggles pause, back exits
  const onKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); prev(); break;
      case 'ArrowRight': e.preventDefault(); next(); break;
      case ' ': case 'Spacebar': e.preventDefault(); setPaused((p) => !p); break;
      case 'Escape': case 'Backspace': if (onExit) { e.preventDefault(); onExit(); } break;
      default: break;
    }
  }, [next, prev, onExit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  if (!items.length) {
    return <div className="slideshow" data-spotlight-container><div className="empty">No items</div></div>;
  }

  const stageStyle = useMemo(() => {
    if (isImage) {
      const url = item?.src || item?.poster;
      const isPortrait = imgDims.h > imgDims.w && imgDims.h > 0;
      const size = fitMode === 'contain' ? 'contain' : (isPortrait ? 'contain' : 'cover');
      return url ? { backgroundImage: `url(${url})`, backgroundSize: size, backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {};
    }
    return {};
  }, [isImage, fitMode, item, imgDims]);

  return (
    <div className="slideshow" ref={containerRef} tabIndex={0} data-spotlight-container data-spotlight-id="slideshow-stage">
      <div className="stage" style={stageStyle}>
        {isImage && (
          // keep an img element to detect load errors on engines that don't raise CSS background image errors
          <img
            className="slide"
            src={item.src || item.poster}
            alt={item.title || 'slide'}
            onError={() => setImgError(true)}
            onLoad={(e) => { try { const im=e.currentTarget; setImgDims({w: im.naturalWidth||0, h: im.naturalHeight||0}); } catch {} }}
            style={{ opacity: 0, position: 'absolute', width: 1, height: 1, pointerEvents: 'none' }}
          />
        )}
        {isVideo && (
          <VideoPlayer
            key={item.src}
            videoRef={videoRef}
            source={item}
            autoPlay
            onEnded={next}
            showPoster={false}
            fill
            objectFit="contain"
            startWithSound={true}
          />
        )}
      </div>
      {!kiosk && (
        <div className="overlay">
          <div className="title">{imgError ? 'Image failed to load' : (item.title || '')}</div>
          <div className="meta">
            <span>{index + 1}/{items.length}</span>
            {isImage && <span> • {Math.round(durationMs / 1000)}s</span>}
            {isText && <span> • {Math.round(durationMs / 1000)}s</span>}
            {paused && <span> • Paused</span>}
          </div>
          <div className="controls">
            <button onClick={prev}>&laquo; Prev</button>
            <button onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
            <button onClick={next}>Next &raquo;</button>
          </div>
        </div>
      )}
      {kiosk && (
        <div className="overlay-bottom">
          <div className="info">
            <span className="name">{item?.title || ''}</span>
            <span className="sep">•</span>
            <span className="pos">{index + 1}/{items.length}</span>
          </div>
        </div>
      )}
      {isText && (
        <div className="text-stage" aria-label="text-slide">
          {textContent ? (
            <div className="text-box">{textContent}</div>
          ) : (
            <div className="text-box muted">(empty text)</div>
          )}
        </div>
      )}
    </div>
  );
}
