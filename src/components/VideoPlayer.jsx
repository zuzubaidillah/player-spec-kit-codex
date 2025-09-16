import { useEffect, useRef, useState } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer.js';
import './VideoPlayer.css';

export default function VideoPlayer({ source, autoPlay = false, onEnded, showPoster = true, fill = false, videoRef: externalRef, objectFit }) {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;
  const { state, controls } = useVideoPlayer(videoRef, source);
  const [fit, setFit] = useState('cover');

  // Best-effort autoplay kick for legacy engines
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (autoPlay) {
      const tryPlay = () => { try { const p = v.play(); if (p && p.catch) p.catch(()=>{}); } catch {} };
      v.addEventListener('canplay', tryPlay, { once: true });
      v.addEventListener('loadedmetadata', tryPlay, { once: true });
      // Also attempt immediately
      tryPlay();
      return () => {
        v.removeEventListener('canplay', tryPlay);
        v.removeEventListener('loadedmetadata', tryPlay);
      };
    }
  }, [videoRef, autoPlay, source?.src]);

  // Decide object-fit based on aspect ratio: portrait => contain, else cover
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      try {
        const w = v.videoWidth || 0, h = v.videoHeight || 0;
        if (w && h) setFit(h > w ? 'contain' : 'cover');
      } catch {}
    };
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('resize', onMeta);
    onMeta();
    return () => {
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('resize', onMeta);
    };
  }, [videoRef, source?.src]);

  // HLS fallback via hls.js when native HLS is not supported
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !source?.src) return;
    const isHls = String(source?.type || '').toLowerCase() === 'application/vnd.apple.mpegurl' || /\.m3u8(\?|#|$)/i.test(source.src);
    if (!isHls) return;
    let canNative = false;
    try { canNative = !!(v.canPlayType && (v.canPlayType('application/vnd.apple.mpegurl') || v.canPlayType('application/x-mpegURL'))); } catch {}
    if (canNative) return; // use native pipeline
    const ensureHls = () => new Promise((resolve) => {
      if (window.Hls) return resolve(window.Hls);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.14/dist/hls.min.js';
      s.async = true;
      s.onload = () => resolve(window.Hls);
      s.onerror = () => resolve(undefined);
      document.head.appendChild(s);
    });
    let hls;
    (async () => {
      const Hls = await ensureHls();
      if (!Hls || !Hls.isSupported()) return;
      hls = new Hls({ autoStartLoad: true });
      hls.loadSource(source.src);
      hls.attachMedia(v);
      const onErr = () => {};
      hls.on(Hls.Events.ERROR, onErr);
    })();
    return () => {
      try { if (hls) hls.destroy(); } catch {}
    };
  }, [source?.src, source?.type, videoRef]);

  return (
    <div className={`video-player${fill ? ' fill' : ''}`} data-spotlight-container>
      <video
        ref={videoRef}
        poster={showPoster ? source?.poster : undefined}
        controls={false}
        autoPlay={autoPlay}
        playsInline
        webkit-playsinline=""
        x5-playsinline=""
        preload="auto"
        muted
        tabIndex={0}
        onEnded={onEnded}
        style={{ width: '100%', height: '100%', objectFit: objectFit || fit }}
      />
      <div className="hud">
        <div className="title">{source?.title}</div>
        <div className="time">
          {Math.floor(state.currentTime)} / {Math.floor(state.duration)}s
        </div>
      </div>
      {state.error && <div className="error">{state.error}</div>}
    </div>
  );
}
