import { useEffect, useRef, useState } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer.js';
import './VideoPlayer.css';

/**
 * Why autoplay fails when startWithSound=true?
 * Many engines (including LG webOS browser builds) block autoplay WITH audio
 * until there is a user gesture. This component:
 *   1) Tries autoplay with sound if startWithSound=true
 *   2) If blocked, falls back to muted autoplay (so motion still starts)
 *   3) Shows an overlay hint and unmutes on first remote/keyboard/pointer action
 *   4) (Optional) asks webOS system to un-mute and set volume via Luna
 */
export default function VideoPlayer({
  source,
  autoPlay = false,
  onEnded,
  showPoster = true,
  fill = false,
  videoRef: externalRef,
  objectFit,
  startWithSound = false,
}) {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;
  const { state = {}, controls = {} } = useVideoPlayer?.(videoRef, source) ?? {};

  const [muted, setMuted] = useState(!startWithSound);
  const [fit, setFit] = useState('cover');
  const [playBlocked, setPlayBlocked] = useState(false); // true if autoplay with sound was blocked

  // Keep element in sync
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    v.muted = muted;
    if (!muted) { try { v.volume = 1.0; } catch {} }
  }, [muted, videoRef]);

  const unmuteSystemIfAvailable = () => {
    const svc = window?.webOS?.service;
    if (!svc) return;
    try {
      svc.request('luna://com.webos.audio', { method: 'setMuted', parameters: { muted: false } });
      svc.request('luna://com.webos.audio', { method: 'setVolume', parameters: { volume: 80 } });
    } catch {}
  };

  const unmute = () => {
    const v = videoRef.current; if (!v) return;
    try { v.muted = false; v.volume = 1.0; } catch {}
    setMuted(false);
    setPlayBlocked(false);
    unmuteSystemIfAvailable();
    try { v.play()?.catch(() => {}); } catch {}
    try { controls?.setMuted?.(false); } catch {}
  };

  // Robust autoplay: try with sound (if requested), else fallback to muted
  useEffect(() => {
    const v = videoRef.current; if (!v || !source?.src) return;

    const tryAutoplay = async () => {
      if (!autoPlay) return;
      // Try desired mode first
      const wantAudio = !!startWithSound;
      try {
        v.muted = !wantAudio;
        v.autoplay = true;
        const p = v.play();
        await (p || Promise.resolve());
        // Success in desired mode
        setMuted(!wantAudio);
        setPlayBlocked(false);
      } catch (e) {
        if (wantAudio) {
          // Fallback: muted autoplay so motion still shows
          try {
            v.muted = true;
            const p2 = v.play();
            await (p2 || Promise.resolve());
            setMuted(true);
            setPlayBlocked(true); // indicate we need a gesture to enable sound
          } catch {
            // As a last resort, wait for metadata/canplay then try again silently
          }
        }
      }
    };

    const onMeta = () => { tryAutoplay(); };
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('canplay', onMeta, { once: true });
    // First attempt immediately too
    tryAutoplay();

    return () => {
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('canplay', onMeta);
    };
  }, [autoPlay, startWithSound, source?.src, videoRef]);

  // Aspect-fit chooser
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onMeta = () => {
      try { const w = v.videoWidth||0, h=v.videoHeight||0; if (w && h) setFit(h>w ? 'contain' : 'cover'); } catch {}
    };
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('resize', onMeta);
    onMeta();
    return () => { v.removeEventListener('loadedmetadata', onMeta); v.removeEventListener('resize', onMeta); };
  }, [videoRef, source?.src]);

  // HLS fallback via hls.js
  useEffect(() => {
    const v = videoRef.current; if (!v || !source?.src) return;
    const isHls = String(source?.type||'').toLowerCase() === 'application/vnd.apple.mpegurl' || /\.m3u8(\?|#|$)/i.test(source.src);
    if (!isHls) return;
    let canNative = false;
    try { canNative = !!(v.canPlayType && (v.canPlayType('application/vnd.apple.mpegurl') || v.canPlayType('application/x-mpegURL'))); } catch {}
    if (canNative) return;

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
      hls.on(Hls.Events.ERROR, () => {});
    })();

    return () => { try { hls?.destroy(); } catch {} };
  }, [source?.src, source?.type, videoRef]);

  // First gesture = unmute (remote Enter/Space/PlayPause or pointer)
  useEffect(() => {
    const onKey = (e) => {
      if (!muted) return;
      const code = e.code || e.key || '';
      if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === 'MediaPlayPause') {
        e.preventDefault();
        unmute();
      }
    };
    const onDown = () => { if (muted) unmute(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [muted]);

  return (
    <div className={`video-player${fill ? ' fill' : ''}`} data-spotlight-container>
      <video
        ref={videoRef}
        poster={showPoster ? source?.poster : undefined}
        controls={false}
        autoPlay={autoPlay}
        playsInline
        preload="auto"
        muted={muted}
        tabIndex={0}
        onEnded={onEnded}
        style={{ width: '100%', height: '100%', objectFit: objectFit || fit }}
      />

      <div className="hud">
        <div className="title">{source?.title}</div>
        <div className="time">{Math.floor(state.currentTime||0)} / {Math.floor(state.duration||0)}s</div>
      </div>

      {(muted || playBlocked) && (
        <button className="unmute-overlay" onClick={unmute} aria-label="Unmute">
          🔊 Tekan OK/Enter untuk hidupkan suara
        </button>
      )}

      {state.error && <div className="error">{state.error}</div>}
    </div>
  );
}
