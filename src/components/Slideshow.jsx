import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VideoPlayer from './VideoPlayer.jsx';
import './Slideshow.css';

export default function Slideshow({ items = [], startIndex = 0, defaultDuration = 5000, onExit }) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const item = items[index];
  const isImage = item && typeof item.type === 'string' && item.type.startsWith('image/');
  const isVideo = item && typeof item.type === 'string' && item.type.startsWith('video/');

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

  // Auto-advance for images
  useEffect(() => {
    clearTimer();
    if (!paused && isImage && durationMs > 0) {
      timerRef.current = setTimeout(() => next(), durationMs);
    }
    return () => clearTimer();
  }, [index, isImage, durationMs, paused, next, clearTimer]);

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

  return (
    <div className="slideshow" ref={containerRef} tabIndex={0} data-spotlight-container>
      <div className="stage">
        {isImage && (
          <img className="slide" src={item.src || item.poster} alt={item.title || 'slide'} />
        )}
        {isVideo && (
          <VideoPlayer source={item} autoPlay onEnded={next} />
        )}
      </div>
      <div className="overlay">
        <div className="title">{item.title}</div>
        <div className="meta">
          <span>{index + 1}/{items.length}</span>
          {isImage && <span> • {Math.round(durationMs / 1000)}s</span>}
          {paused && <span> • Paused</span>}
        </div>
        <div className="controls">
          <button onClick={prev}>&laquo; Prev</button>
          <button onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</button>
          <button onClick={next}>Next &raquo;</button>
        </div>
      </div>
    </div>
  );
}

