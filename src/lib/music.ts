// src/lib/music.ts
// 52-second unique synthwave loop — evolving, emotional, continuous

const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let isPlaying = false;
let loopTimer: number | null = null;
let currentVolume = 0.18;

const BPM = 96;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const LOOP_BARS = 32;
const LOOP_DURATION = BAR * LOOP_BARS; // ~50 seconds

// =============================================
// MUSICAL DATA — 8 unique chord changes
// Key of C minor / Eb major
// =============================================

// 8-chord progression (each plays for 4 bars = 32 bars total)
const PROGRESSION = [
  // Section A — Intro (dreamy, sparse)
  { bass: 65.41, chord: [130.81, 155.56, 196.00], mood: 'intro' },       // Cm
  { bass: 51.91, chord: [103.83, 130.81, 155.56], mood: 'intro' },       // Ab

  // Section B — Build (adding energy)
  { bass: 77.78, chord: [155.56, 196.00, 233.08], mood: 'build' },       // Eb
  { bass: 58.27, chord: [116.54, 146.83, 174.61], mood: 'build' },       // Bb

  // Section C — Peak (full energy, melody shines)
  { bass: 69.30, chord: [138.59, 164.81, 207.65], mood: 'peak' },        // Db/C#
  { bass: 77.78, chord: [155.56, 196.00, 246.94], mood: 'peak' },        // Eb (bright voicing)

  // Section D — Breakdown (emotional, stripped back)
  { bass: 87.31, chord: [174.61, 220.00, 261.63], mood: 'breakdown' },   // Fm
  { bass: 73.42, chord: [146.83, 174.61, 220.00], mood: 'breakdown' },   // G (dark voicing → resolve to Cm)
];

// Unique arp patterns per section mood — different rhythmic feels
const ARP_PATTERNS: Record<string, number[]> = {
  intro:     [0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 2, -1, 1, -1, 0, -1],
  build:     [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 0, 1, 2, 1, 0],
  peak:      [0, 1, 2, 2, 1, 0, 2, 1, 2, 0, 1, 2, 0, 2, 1, 0],
  breakdown: [0, -1, -1, 1, -1, -1, 2, -1, -1, 1, -1, -1, 0, -1, -1, -1],
};

// Melody notes (played over peak sections only) — a real singable melody in Cm
const MELODY_PHRASE_1 = [
  { note: 523.25, dur: 1.0 },   // C5 (hold)
  { note: 493.88, dur: 0.5 },   // B4
  { note: 392.00, dur: 1.0 },   // G4 (hold)
  { note: 440.00, dur: 0.5 },   // A4
  { note: 523.25, dur: 1.0 },   // C5
  { note: 587.33, dur: 1.0 },   // D5 (hold — climax note)
];

const MELODY_PHRASE_2 = [
  { note: 587.33, dur: 0.5 },   // D5
  { note: 523.25, dur: 0.5 },   // C5
  { note: 493.88, dur: 1.0 },   // B4
  { note: 392.00, dur: 0.5 },   // G4
  { note: 440.00, dur: 0.5 },   // A4
  { note: 392.00, dur: 2.0 },   // G4 (long resolve)
];

// Drum patterns per mood — fills, variation, groove
const KICK_PATTERNS: Record<string, number[]> = {
  intro:     [1,0,0,0, 0,0,1,0],
  build:     [1,0,0,0, 1,0,1,0],
  peak:      [1,0,1,0, 1,0,1,0],
  breakdown: [1,0,0,0, 0,0,0,0],
};

const HAT_PATTERNS: Record<string, Array<'c'|'o'|'-'>> = {
  intro:     ['c','-','c','-', 'c','-','c','-'],
  build:     ['c','c','c','c', 'c','o','c','c'],
  peak:      ['c','c','o','c', 'c','o','c','o'],
  breakdown: ['c','-','-','c', '-','-','c','-'],
};

// =============================================
// SYNTH ENGINES
// =============================================

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioCtx();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, ctx.currentTime);
    compressor.knee.setValueAtTime(20, ctx.currentTime);
    compressor.ratio.setValueAtTime(8, ctx.currentTime);
    compressor.attack.setValueAtTime(0.002, ctx.currentTime);
    compressor.release.setValueAtTime(0.15, ctx.currentTime);
    compressor.connect(ctx.destination);
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentVolume, ctx.currentTime);
    masterGain.connect(compressor);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function dest(): GainNode { getCtx(); return masterGain!; }

// --- Warm Pad (3-layer detuned sine/triangle with slow attack) ---
function padChord(freqs: number[], start: number, dur: number, volume = 1.0) {
  const c = getCtx();
  freqs.forEach((freq) => {
    const layers: [OscillatorType, number, number][] = [
      ['sine', freq, 0.10 * volume],
      ['triangle', freq * 1.004, 0.05 * volume],
      ['sine', freq * 0.998, 0.04 * volume],
      ['sine', freq * 0.5, 0.03 * volume],
    ];
    layers.forEach(([type, f, vol]) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(f, start);
      const g = c.createGain();
      const atk = Math.min(dur * 0.25, 1.5);
      const rel = Math.min(dur * 0.25, 1.2);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + atk);
      g.gain.setValueAtTime(vol, start + dur - rel);
      g.gain.linearRampToValueAtTime(0, start + dur);
      osc.connect(g); g.connect(dest());
      osc.start(start); osc.stop(start + dur + 0.2);
    });
  });
}

// --- Pulse Bass (saw+square through low-pass with filter sweep) ---
function bass(freq: number, start: number, dur: number, volume = 1.0) {
  const c = getCtx();
  const osc1 = c.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(freq, start);
  const osc2 = c.createOscillator(); osc2.type = 'square'; osc2.frequency.setValueAtTime(freq * 0.999, start);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.setValueAtTime(280, start); filter.Q.setValueAtTime(2, start);
  filter.frequency.linearRampToValueAtTime(700, start + dur * 0.25);
  filter.frequency.linearRampToValueAtTime(200, start + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.20 * volume, start + 0.015);
  g.gain.setValueAtTime(0.20 * volume, start + dur * 0.65);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc1.connect(filter); osc2.connect(filter); filter.connect(g); g.connect(dest());
  osc1.start(start); osc1.stop(start + dur + 0.05);
  osc2.start(start); osc2.stop(start + dur + 0.05);
}

// --- Shimmer Arp (square through filter + delay) ---
function arp(freq: number, start: number) {
  const c = getCtx();
  const dur = BEAT * 0.35;
  const osc = c.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(freq * 2, start);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.setValueAtTime(3500, start);
  filter.frequency.exponentialRampToValueAtTime(600, start + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.04, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  // Ping-pong delay effect
  const del = c.createDelay(); del.delayTime.setValueAtTime(BEAT * 0.375, start);
  const delG = c.createGain(); delG.gain.setValueAtTime(0.02, start);
  osc.connect(filter); filter.connect(g); g.connect(dest());
  g.connect(del); del.connect(delG); delG.connect(dest());
  osc.start(start); osc.stop(start + dur + BEAT);
}

// --- Lead Melody (sine + triangle, vibrato, delay) ---
function lead(freq: number, start: number, dur: number) {
  const c = getCtx();
  // Main oscillator
  const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start);
  // Vibrato LFO
  const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.setValueAtTime(5.5, start);
  const lfoG = c.createGain(); lfoG.gain.setValueAtTime(3, start); // 3Hz vibrato depth
  lfo.connect(lfoG); lfoG.connect(osc.frequency);
  // Warm layer
  const osc2 = c.createOscillator(); osc2.type = 'triangle'; osc2.frequency.setValueAtTime(freq * 1.002, start);
  const g = c.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.10, start + 0.08);
  g.gain.setValueAtTime(0.10, start + dur * 0.7);
  g.gain.linearRampToValueAtTime(0, start + dur);
  const g2 = c.createGain();
  g2.gain.setValueAtTime(0, start);
  g2.gain.linearRampToValueAtTime(0.05, start + 0.1);
  g2.gain.setValueAtTime(0.05, start + dur * 0.7);
  g2.gain.linearRampToValueAtTime(0, start + dur);
  // Delay tail
  const del = c.createDelay(); del.delayTime.setValueAtTime(BEAT * 0.75, start);
  const fb = c.createGain(); fb.gain.setValueAtTime(0.25, start);
  const delOut = c.createGain(); delOut.gain.setValueAtTime(0.06, start);
  osc.connect(g); g.connect(dest()); g.connect(del); del.connect(fb); fb.connect(del); del.connect(delOut); delOut.connect(dest());
  osc2.connect(g2); g2.connect(dest());
  osc.start(start); osc.stop(start + dur + 2);
  osc2.start(start); osc2.stop(start + dur + 0.1);
  lfo.start(start); lfo.stop(start + dur + 2);
}

// --- Drums ---
function kick(start: number) {
  const c = getCtx();
  const osc = c.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(160, start);
  osc.frequency.exponentialRampToValueAtTime(35, start + 0.15);
  const g = c.createGain();
  g.gain.setValueAtTime(0.28, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
  osc.connect(g); g.connect(dest());
  osc.start(start); osc.stop(start + 0.4);
}

function hat(start: number, open: boolean) {
  const c = getCtx();
  const dur = open ? 0.18 : 0.05;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(9000, start);
  const g = c.createGain(); g.gain.setValueAtTime(open ? 0.035 : 0.02, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(hp); hp.connect(g); g.connect(dest());
  src.start(start); src.stop(start + dur + 0.01);
}

function snare(start: number) {
  const c = getCtx();
  // Noise body
  const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(3000, start); bp.Q.setValueAtTime(0.8, start);
  const gn = c.createGain(); gn.gain.setValueAtTime(0.08, start); gn.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
  src.connect(bp); bp.connect(gn); gn.connect(dest());
  src.start(start); src.stop(start + 0.2);
  // Tone body
  const osc = c.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(200, start);
  osc.frequency.exponentialRampToValueAtTime(100, start + 0.05);
  const gt = c.createGain(); gt.gain.setValueAtTime(0.12, start); gt.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
  osc.connect(gt); gt.connect(dest());
  osc.start(start); osc.stop(start + 0.15);
}

// =============================================
// SEQUENCER — builds the full 32-bar loop
// =============================================

function scheduleLoop(startTime: number) {
  const c = getCtx();
  if (!c) return;

  for (let section = 0; section < 8; section++) {
    const prog = PROGRESSION[section];
    const sectionStart = startTime + section * BAR * 4;

    for (let bar = 0; bar < 4; bar++) {
      const barStart = sectionStart + bar * BAR;
      const barInSection = bar;

      // --- PAD ---
      // Intro/breakdown: quieter. Peak: full volume. Build volume between.
      const padVol = prog.mood === 'intro' ? 0.7
        : prog.mood === 'breakdown' ? 0.6
        : prog.mood === 'build' ? 0.85
        : 1.0;
      padChord(prog.chord, barStart, BAR + 0.4, padVol);

      // --- BASS ---
      const bassPattern = prog.mood === 'breakdown'
        ? [1,0,0,0, 0,0,0,0]  // sparse
        : prog.mood === 'intro'
        ? [1,0,0,0, 0,0,1,0]  // gentle pulse
        : [1,0,1,0, 1,0,1,0]; // driving 8ths

      for (let eighth = 0; eighth < 8; eighth++) {
        if (!bassPattern[eighth]) continue;
        const t = barStart + eighth * (BEAT / 2);
        const freq = eighth % 2 === 0 ? prog.bass : prog.bass * 2;
        const bVol = prog.mood === 'breakdown' ? 0.5 : prog.mood === 'intro' ? 0.7 : 1.0;
        bass(freq, t, BEAT / 2 * 0.85, bVol);
      }

      // --- ARP ---
      const arpPattern = ARP_PATTERNS[prog.mood];
      for (let step = 0; step < 16; step++) {
        const idx = arpPattern[step];
        if (idx === -1) continue; // rest
        const t = barStart + step * (BEAT / 4);
        arp(prog.chord[idx], t);
      }

      // --- DRUMS ---
      const kickPat = KICK_PATTERNS[prog.mood];
      const hatPat = HAT_PATTERNS[prog.mood];
      for (let eighth = 0; eighth < 8; eighth++) {
        const t = barStart + eighth * (BEAT / 2);
        if (kickPat[eighth]) kick(t);
        const h = hatPat[eighth];
        if (h === 'c') hat(t, false);
        else if (h === 'o') hat(t, true);
      }

      // Snare on beats 2 and 4 (only in build and peak)
      if (prog.mood === 'build' || prog.mood === 'peak') {
        snare(barStart + BEAT * 1);
        snare(barStart + BEAT * 3);
      }
      // Light snare on 4 only during breakdown bar 3-4 (transition hint)
      if (prog.mood === 'breakdown' && barInSection >= 2) {
        snare(barStart + BEAT * 3);
      }

      // --- DRUM FILLS at end of each 4-bar section ---
      if (barInSection === 3) {
        // 16th note hat fill on last beat
        for (let s = 0; s < 4; s++) {
          hat(barStart + BEAT * 3 + s * (BEAT / 4), s === 3);
        }
        // Extra kick hits for transition
        if (prog.mood === 'build') {
          kick(barStart + BEAT * 3.5);
          kick(barStart + BEAT * 3.75);
        }
      }
    }

    // --- MELODY (only during peak sections: indices 4 and 5) ---
    if (section === 4) {
      let t = sectionStart;
      MELODY_PHRASE_1.forEach((n) => {
        lead(n.note, t, n.dur * BEAT);
        t += n.dur * BEAT;
      });
    }
    if (section === 5) {
      let t = sectionStart;
      MELODY_PHRASE_2.forEach((n) => {
        lead(n.note, t, n.dur * BEAT);
        t += n.dur * BEAT;
      });
    }

    // --- COUNTER-MELODY (breakdown section 7 — hint of melody returning) ---
    if (section === 7) {
      const cm = sectionStart + BAR * 2; // last 2 bars
      [392.00, 440.00, 523.25, 493.88, 392.00].forEach((freq, i) => {
        lead(freq, cm + i * BEAT, BEAT * 0.9);
      });
    }
  }
}

// =============================================
// PUBLIC API
// =============================================

export function startMusic() {
  if (isPlaying) return;
  isPlaying = true;

  const c = getCtx();
  const startDelay = 0.5;
  let nextStart = c.currentTime + startDelay;

  // Fade in from silence to prevent distortion/clicking on initial playback
  if (masterGain) {
    masterGain.gain.cancelScheduledValues(c.currentTime);
    masterGain.gain.setValueAtTime(0, c.currentTime);
    masterGain.gain.linearRampToValueAtTime(currentVolume, nextStart);
  }

  scheduleLoop(nextStart);
  nextStart += LOOP_DURATION;

  loopTimer = window.setInterval(() => {
    if (!isPlaying || !ctx) return;
    if (ctx.currentTime >= nextStart - 3) {
      scheduleLoop(nextStart);
      nextStart += LOOP_DURATION;
    }
  }, 1000);
}

export function stopMusic() {
  isPlaying = false;
  if (loopTimer !== null) { clearInterval(loopTimer); loopTimer = null; }
  if (ctx) { ctx.close().catch(() => {}); ctx = null; masterGain = null; compressor = null; }
}

export function lowerMusicForGame() {
  if (!masterGain || !ctx) return;
  currentVolume = 0.04;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.8);
}

export function restoreMusicVolume() {
  if (!masterGain || !ctx) return;
  currentVolume = 0.18;
  masterGain.gain.cancelScheduledValues(ctx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.8);
}

export function toggleMusic(): boolean {
  if (isPlaying) { stopMusic(); return false; }
  else { startMusic(); return true; }
}

export function isMusicPlaying(): boolean { return isPlaying; }
