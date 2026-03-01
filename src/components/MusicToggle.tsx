// src/components/MusicToggle.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { startMusic, stopMusic, isMusicPlaying } from '../lib/music';

const btnStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 9999,
  background: 'rgba(0, 0, 30, 0.8)',
  border: '2px solid rgba(0, 212, 255, 0.4)',
  borderRadius: '50%',
  width: '52px',
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  cursor: 'pointer',
  boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)',
  transition: 'all 0.3s ease',
  color: '#00d4ff',
};

function MusicToggle(): React.ReactElement {
  const [playing, setPlaying] = useState(isMusicPlaying());

  useEffect(() => {
    const handler = (e: Event) => {
      setPlaying((e as CustomEvent<{ playing: boolean }>).detail.playing);
    };
    window.addEventListener('musicStateChange', handler);
    return () => window.removeEventListener('musicStateChange', handler);
  }, []);

  const handleToggle = useCallback(() => {
    if (playing) {
      stopMusic();
      setPlaying(false);
    } else {
      startMusic();
      setPlaying(true);
    }
  }, [playing]);

  return (
    <button
      style={btnStyle}
      onClick={handleToggle}
      title={playing ? 'Mute music' : 'Play music'}
      aria-label={playing ? 'Mute music' : 'Play music'}
    >
      {playing ? '🔊' : '🔇'}
    </button>
  );
}

export default MusicToggle;
