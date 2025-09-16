import { useRef } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer.js';
import './VideoPlayer.css';

export default function VideoPlayer({ source, autoPlay = false, onEnded, showPoster = true, fill = false, videoRef: externalRef }) {
  const internalRef = useRef(null);
  const videoRef = externalRef || internalRef;
  const { state, controls } = useVideoPlayer(videoRef, source);

  return (
    <div className={`video-player${fill ? ' fill' : ''}`} data-spotlight-container>
      <video
        ref={videoRef}
        poster={showPoster ? source?.poster : undefined}
        controls={false}
        autoPlay={autoPlay}
        tabIndex={0}
        muted
        onEnded={onEnded}
      />
      <div className="hud">
        <div className="title">{source?.title}</div>
        <div className="time">
          {Math.floor(state.currentTime)} / {Math.floor(state.duration)}s
        </div>
      </div>
      <div className="controls" data-spotlight-container>
        <button onClick={() => controls.step(-10)}>&laquo; 10s</button>
        <button onClick={controls.toggle}>{state.playing ? 'Pause' : 'Play'}</button>
        <button onClick={() => controls.step(10)}>10s &raquo;</button>
        <button onClick={() => controls.mute(!state.muted)}>{state.muted ? 'Unmute' : 'Mute'}</button>
      </div>
      {state.error && <div className="error">{state.error}</div>}
    </div>
  );
}
