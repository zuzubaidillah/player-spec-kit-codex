import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appendLog } from '../lib/logStore.js';

function mediaErrorToText(err) {
  if (!err) return 'Unknown error';
  const map = {
    1: 'MEDIA_ERR_ABORTED',
    2: 'MEDIA_ERR_NETWORK',
    3: 'MEDIA_ERR_DECODE',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED'
  };
  return map[err.code] || `MediaError(code=${err.code})`;
}

export function useVideoPlayer(videoRef, source) {
  const [state, setState] = useState({
    ready: false,
    playing: false,
    duration: 0,
    currentTime: 0,
    buffered: 0,
    volume: 1,
    muted: false,
    error: null
  });

  const rafRef = useRef(null);

  const log = useCallback((type, detail) => {
    appendLog({ type, detail });
    console[type === 'error' ? 'error' : 'log']('[Video]', type, detail);
  }, []);

  const updateTime = useCallback(() => {
    const video = videoRef?.current;
    if (!video) return;
    setState((s) => ({ ...s, currentTime: video.currentTime }));
    rafRef.current = requestAnimationFrame(updateTime);
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const onLoaded = () => {
      setState((s) => ({ ...s, ready: true, duration: video.duration || 0 }));
      log('info', { event: 'loadedmetadata', duration: video.duration });
    };
    const onPlay = () => {
      setState((s) => ({ ...s, playing: true }));
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTime);
    };
    const onPause = () => {
      setState((s) => ({ ...s, playing: false }));
      cancelAnimationFrame(rafRef.current);
    };
    const onProgress = () => {
      try {
        const buf = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
        setState((s) => ({ ...s, buffered: buf }));
      } catch {}
    };
    const onVolume = () => {
      setState((s) => ({ ...s, volume: video.volume, muted: video.muted }));
    };
    const onError = () => {
      const err = video.error;
      const info = mediaErrorToText(err);
      setState((s) => ({ ...s, error: info }));
      log('error', { event: 'error', code: err?.code, message: info, src: video.currentSrc });
    };
    const onWaiting = () => log('info', { event: 'waiting' });
    const onStalled = () => log('info', { event: 'stalled' });

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('progress', onProgress);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('error', onError);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('error', onError);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
    };
  }, [videoRef, log, updateTime]);

  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;
    if (!source || !source.src) return;
    try {
      video.pause();
      video.src = source.src;
      if (source.type) video.type = source.type; // ignored by most browsers on element
      video.load();
      setState((s) => ({ ...s, ready: false, playing: false, error: null }));
      log('info', { event: 'sourcechange', src: source.src, type: source.type });
    } catch (e) {
      log('error', { event: 'sourcechange-failed', message: String(e) });
    }
  }, [source?.src, source?.type, videoRef, log]);

  // Controls
  const controls = useMemo(() => ({
    play: () => videoRef?.current?.play(),
    pause: () => videoRef?.current?.pause(),
    toggle: () => (videoRef?.current?.paused ? videoRef.current.play() : videoRef.current.pause()),
    seek: (t) => { if (videoRef?.current) videoRef.current.currentTime = Math.max(0, t); },
    step: (dt) => { if (videoRef?.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + dt); },
    setVolume: (v) => { if (videoRef?.current) videoRef.current.volume = Math.min(1, Math.max(0, v)); },
    mute: (m = true) => { if (videoRef?.current) videoRef.current.muted = !!m; },
  }), [videoRef]);

  return { state, controls };
}
