// ============================================================
// AUDIO ENGINE — synthesized with the Web Audio API.
// There are no real orchestral recordings or foley samples bundled
// with this project, so every effect and musical drone below is
// generated live from oscillators/noise — footsteps, torch crackle,
// door creaks, chest chimes, victory fanfare, and an ambient wind +
// string pad bed that plays as "background music". Volume sliders
// in Settings control master music/sfx gain in real time.
// ============================================================

class PalaceAudio {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.ambientNodes = [];
    this.started = false;
  }

  // Must be called after a user gesture (browser autoplay policy)
  init() {
    if (this.started) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.ctx.destination);
    this.started = true;
  }

  setMusicVolume(v) { this.musicVolume = v; if (this.musicGain) this.musicGain.gain.value = v; }
  setSfxVolume(v) { this.sfxVolume = v; if (this.sfxGain) this.sfxGain.gain.value = v; }

  now() { return this.ctx.currentTime; }

  // ---- generic tone helper ----
  tone({ freq = 440, dur = 0.2, type = "sine", gainNode, startGain = 0.3, endGain = 0.0001, delay = 0, sweep = null }) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.now() + delay);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(sweep, this.now() + delay + dur);
    gain.gain.setValueAtTime(0.0001, this.now() + delay);
    gain.gain.exponentialRampToValueAtTime(startGain, this.now() + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(endGain, this.now() + delay + dur);
    osc.connect(gain);
    gain.connect(gainNode || this.sfxGain);
    osc.start(this.now() + delay);
    osc.stop(this.now() + delay + dur + 0.05);
  }

  noiseBurst({ dur = 0.15, gainNode, startGain = 0.25, filterFreq = 2000, delay = 0 }) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(startGain, this.now() + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.now() + delay + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode || this.sfxGain);
    src.start(this.now() + delay);
  }

  // ---- SFX library ----
  correct() {
    this.tone({ freq: 523.25, dur: 0.15, type: "triangle", startGain: 0.25 });
    this.tone({ freq: 659.25, dur: 0.2, type: "triangle", startGain: 0.25, delay: 0.1 });
    this.tone({ freq: 783.99, dur: 0.3, type: "triangle", startGain: 0.25, delay: 0.2 });
  }
  wrong() {
    this.tone({ freq: 200, dur: 0.3, type: "sawtooth", startGain: 0.2, sweep: 90 });
  }
  hint() {
    this.tone({ freq: 880, dur: 0.12, type: "square", startGain: 0.12 });
    this.tone({ freq: 660, dur: 0.15, type: "square", startGain: 0.12, delay: 0.08 });
  }
  click() {
    this.tone({ freq: 440, dur: 0.06, type: "square", startGain: 0.12 });
  }
  footstep() {
    this.noiseBurst({ dur: 0.08, startGain: 0.15, filterFreq: 400 });
  }
  doorCreak() {
    this.tone({ freq: 110, dur: 1.1, type: "sawtooth", startGain: 0.15, sweep: 180 });
    this.noiseBurst({ dur: 1.0, startGain: 0.05, filterFreq: 700 });
  }
  chestOpen() {
    this.tone({ freq: 300, dur: 0.4, type: "triangle", startGain: 0.2, sweep: 700 });
    this.tone({ freq: 900, dur: 0.5, type: "sine", startGain: 0.2, delay: 0.15 });
  }
  heartLost() {
    this.tone({ freq: 400, dur: 0.25, type: "square", startGain: 0.2, sweep: 120 });
  }
  fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone({ freq: f, dur: 0.5, type: "triangle", startGain: 0.3, delay: i * 0.15 });
    });
  }
  gameOverJingle() {
    [400, 350, 300, 220].forEach((f, i) => {
      this.tone({ freq: f, dur: 0.4, type: "sawtooth", startGain: 0.2, delay: i * 0.2 });
    });
  }

  // ---- ambient bed: soft drone + wind noise loop ----
  startAmbient() {
    if (!this.ctx || this.ambientNodes.length) return;
    // low drone pad
    [110, 165, 220].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.05 - i * 0.01;
      osc.connect(g);
      g.connect(this.musicGain);
      osc.start();
      this.ambientNodes.push(osc, g);
    });
    // wind noise loop
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 500;
    filter.Q.value = 0.6;
    const g = this.ctx.createGain();
    g.gain.value = 0.04;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);
    src.start();
    this.ambientNodes.push(src, filter, g);
  }
  stopAmbient() {
    this.ambientNodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch (e) {} });
    this.ambientNodes = [];
  }
}

window.PalaceAudioEngine = new PalaceAudio();
