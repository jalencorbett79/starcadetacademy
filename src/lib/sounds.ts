// src/lib/sounds.ts
const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch { /* audio not supported */ }
}

export function playCorrect() {
  playTone(523.25, 0.15, 'sine', 0.3);
  setTimeout(() => playTone(659.25, 0.15, 'sine', 0.3), 100);
  setTimeout(() => playTone(783.99, 0.25, 'sine', 0.3), 200);
}

export function playIncorrect() {
  playTone(200, 0.3, 'sawtooth', 0.15);
  setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.15), 150);
}

export function playClick() {
  playTone(880, 0.08, 'square', 0.1);
}

export function playLevelUp() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 120);
  });
}

export function playCelebration() {
  const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.2), i * 80);
  });
  setTimeout(() => {
    playTone(1046.5, 0.4, 'sine', 0.3);
    playTone(783.99, 0.4, 'sine', 0.2);
    playTone(523.25, 0.4, 'sine', 0.15);
  }, 700);
}

export function playButtonHover() {
  playTone(1200, 0.05, 'sine', 0.05);
}

export function playCountPop() {
  playTone(600 + Math.random() * 400, 0.1, 'sine', 0.15);
}

export function playLetterPlace() {
  playTone(440 + Math.random() * 200, 0.12, 'triangle', 0.2);
}

export function playRocketLaunch() {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => playTone(200 + i * 80, 0.15, 'sawtooth', 0.1 + i * 0.02), i * 60);
  }
}
