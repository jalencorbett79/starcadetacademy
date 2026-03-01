// src/lib/music.ts
// Retro 80s synthwave background music generator using Web Audio API

const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;
let intervalIds: number[] = [];
let oscillators: OscillatorNode[] = [];
let currentVolume = 0.12;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioCtx();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function getMasterGain(): GainNode {
  getCtx();
  return masterGain!;
}

// Synthwave bass line (80s retro feel)
const BASS_NOTES = [
  65.41,  // C2
  73.42,  // D2
  82.41,  // E2
  87.31,  // F2
  98.00,  // G2
  73.42,  // D2
  82.41,  // E2
  65.41,  // C2
];

// Pad chord progressions (Cm - Fm - G - Cm feel)
const PAD_CHORDS = [
  [130.81, 155.56, 196.00],  // Cm
  [174.61, 207.65, 261.63],  // Fm
  [196.00, 246.94, 293.66],  // G
  [130.81, 155.56, 196.00],  // Cm
];

// Arpeggio notes (high sparkly notes)
const ARPEGGIO_NOTES = [
  523.25, 622.25, 783.99, 622.25,  // C5 Eb5 G5 Eb5
  698.46, 831.61, 1046.5, 831.61,  // F5 Ab5 C6 Ab5
  783.99, 987.77, 1174.7, 987.77,  // G5 B5 D6 B5
  523.25, 622.25, 783.99, 622.25,  // C5 Eb5 G5 Eb5
];

function createBassNote(freq: number, startTime: number, duration: number) {
  const c = getCtx();
  const gain = getMasterGain();
  const osc = c.createOscillator();
  const noteGain = c.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, startTime);

  // Filter for warmth
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, startTime);
  filter.Q.setValueAtTime(2, startTime);

  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.6, startTime + 0.05);
  noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.05);

  osc.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(gain);

  osc.start(startTime);
  osc.stop(startTime + duration);
  oscillators.push(osc);
}

function createPadChord(freqs: number[], startTime: number, duration: number) {
  const c = getCtx();
  const gain = getMasterGain();

  freqs.forEach((freq) => {
    const osc = c.createOscillator();
    const noteGain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Slow attack, slow release for dreamy pad sound
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.15, startTime + 0.4);
    noteGain.gain.setValueAtTime(0.15, startTime + duration - 0.5);
    noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(noteGain);
    noteGain.connect(gain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    oscillators.push(osc);

    // Add slight detuned copy for thickness
    const osc2 = c.createOscillator();
    const noteGain2 = c.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.003, startTime);
    noteGain2.gain.setValueAtTime(0, startTime);
    noteGain2.gain.linearRampToValueAtTime(0.08, startTime + 0.5);
    noteGain2.gain.setValueAtTime(0.08, startTime + duration - 0.5);
    noteGain2.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc2.connect(noteGain2);
    noteGain2.connect(gain);
    osc2.start(startTime);
    osc2.stop(startTime + duration);
    oscillators.push(osc2);
  });
}

function createArpNote(freq: number, startTime: number) {
  const c = getCtx();
  const gain = getMasterGain();
  const osc = c.createOscillator();
  const noteGain = c.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, startTime);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, startTime);

  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

  osc.connect(filter);
  filter.connect(noteGain);
  noteGain.connect(gain);

  osc.start(startTime);
  osc.stop(startTime + 0.25);
  oscillators.push(osc);
}

function scheduleLoop() {
  const c = getCtx();
  const now = c.currentTime;
  const BPM = 100;
  const beatDuration = 60 / BPM;

  // Schedule 8 bars ahead
  for (let bar = 0; bar < 2; bar++) {
    const barStart = now + (bar * 8 * beatDuration);

    // Bass line: one note per beat
    BASS_NOTES.forEach((freq, i) => {
      createBassNote(freq, barStart + i * beatDuration, beatDuration * 0.9);
    });

    // Pad chords: one chord per 2 beats
    PAD_CHORDS.forEach((chord, i) => {
      createPadChord(chord, barStart + i * 2 * beatDuration, beatDuration * 1.9);
    });

    // Arpeggio: 16th notes across the bar
    ARPEGGIO_NOTES.forEach((freq, i) => {
      createArpNote(freq, barStart + i * (beatDuration / 2));
    });
  }
}

/** Start background music */
export function startMusic() {
  if (isPlaying) return;
  isPlaying = true;
  window.dispatchEvent(new CustomEvent('musicStateChange', { detail: { playing: true } }));

  // Initial schedule
  scheduleLoop();

  // Re-schedule every ~9 seconds to keep it looping.
  // Subtract 500ms so the next batch is scheduled before the current one ends,
  // preventing any audible gap between loop iterations.
  const BPM = 100;
  const loopDuration = (60 / BPM) * 8 * 2 * 1000; // 2 groups of 8 beats in ms
  const id = window.setInterval(() => {
    if (isPlaying) {
      // Clean up old oscillators
      oscillators = oscillators.filter((osc) => {
        try {
          osc.disconnect();
        } catch { /* already stopped */ }
        return false;
      });
      scheduleLoop();
    }
  }, loopDuration - 500);
  intervalIds.push(id);
}

/** Stop background music */
export function stopMusic() {
  isPlaying = false;
  window.dispatchEvent(new CustomEvent('musicStateChange', { detail: { playing: false } }));
  intervalIds.forEach((id) => clearInterval(id));
  intervalIds = [];
  oscillators.forEach((osc) => {
    try { osc.stop(); osc.disconnect(); } catch { /* ok */ }
  });
  oscillators = [];
}

/** Lower volume when in a game */
export function lowerMusicForGame() {
  if (!masterGain || !ctx) return;
  currentVolume = 0.03;
  masterGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.5);
}

/** Restore volume when leaving a game */
export function restoreMusicVolume() {
  if (!masterGain || !ctx) return;
  currentVolume = 0.12;
  masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
}

/** Toggle music on/off. Returns new state. */
export function toggleMusic(): boolean {
  if (isPlaying) {
    stopMusic();
    return false;
  } else {
    startMusic();
    return true;
  }
}

/** Check if music is currently playing */
export function isMusicPlaying(): boolean {
  return isPlaying;
}
