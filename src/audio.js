// All sounds synthesized with WebAudio — no audio files.
export class Sfx {
  constructor() {
    this.ctx = null;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.startBreeze();
      this.scheduleBirds();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  noiseBuffer(seconds = 1) {
    const len = this.ctx.sampleRate * seconds;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // gentle leafy breeze bed
  startBreeze() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(3);
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.025;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
    lfo.start();
  }

  // random birdsong chirps
  scheduleBirds() {
    const chirp = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const base = 1800 + Math.random() * 1600;
      const notes = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const start = t + i * (0.08 + Math.random() * 0.06);
        const f = base * (0.85 + Math.random() * 0.4);
        osc.frequency.setValueAtTime(f, start);
        osc.frequency.exponentialRampToValueAtTime(f * 1.4, start + 0.06);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.linearRampToValueAtTime(0.05, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
        osc.connect(g); g.connect(this.master);
        osc.start(start); osc.stop(start + 0.12);
      }
      setTimeout(chirp, 2500 + Math.random() * 5000);
    };
    setTimeout(chirp, 1500);
  }

  // apple thrown — soft whoosh, pitch scales with power
  throwWhoosh(power = 0.6) {
    this.ensure();
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.3);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(500 + power * 700, t);
    bp.frequency.exponentialRampToValueAtTime(1600 + power * 1200, t + 0.18);
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.18 + power * 0.12, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    noise.connect(bp); bp.connect(g); g.connect(this.master);
    noise.start(t); noise.stop(t + 0.3);
  }

  // apple squish on impact
  splat() {
    this.ensure();
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.12);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise.connect(lp); lp.connect(g); g.connect(this.master);
    noise.start(t);
  }

  // tin can knocked off — metallic clatter
  canClatter() {
    this.ensure();
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const dt = i * (0.05 + Math.random() * 0.06);
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const f = 600 + Math.random() * 1400;
      osc.frequency.setValueAtTime(f, t + dt);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + dt + 0.12);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.18, t + dt);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.16);
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = 4;
      osc.connect(bp); bp.connect(g); g.connect(this.master);
      osc.start(t + dt); osc.stop(t + dt + 0.18);
    }
  }

  // happy reveal chime
  chime() {
    this.ensure();
    const t = this.ctx.currentTime;
    for (const [i, f] of [523.25, 659.25, 784].entries()) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      const start = t + i * 0.07;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.16, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(g); g.connect(this.master);
      osc.start(start); osc.stop(start + 0.45);
    }
  }

  pickup() {
    this.ensure();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.16);
  }

  objective() {
    this.ensure();
    const t = this.ctx.currentTime;
    for (const [i, f] of [392, 523.25].entries()) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + i * 0.14);
      g.gain.linearRampToValueAtTime(0.2, t + i * 0.14 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.14 + 0.4);
      osc.connect(g); g.connect(this.master);
      osc.start(t + i * 0.14); osc.stop(t + i * 0.14 + 0.45);
    }
  }

  // car door thunk
  carDoor() {
    this.ensure();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.2);
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.05);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1500;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.2, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.connect(hp); hp.connect(ng); ng.connect(this.master);
    noise.start(t);
  }

  // hood / metal creak
  hood() {
    this.ensure();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 3;
    osc.connect(bp); bp.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.65);
  }

  // oil glugging into the engine
  oilGlug() {
    this.ensure();
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const dt = i * 0.16;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 + Math.random() * 60, t + dt);
      osc.frequency.exponentialRampToValueAtTime(90, t + dt + 0.12);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + dt);
      g.gain.linearRampToValueAtTime(0.18, t + dt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.14);
      osc.connect(g); g.connect(this.master);
      osc.start(t + dt); osc.stop(t + dt + 0.16);
    }
  }

  // engine cranks then settles into an idle rumble
  engineStart() {
    this.ensure();
    const t = this.ctx.currentTime;
    // cranking
    for (let i = 0; i < 3; i++) {
      const dt = i * 0.18;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, t + dt);
      osc.frequency.linearRampToValueAtTime(110, t + dt + 0.12);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.18, t + dt);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.16);
      osc.connect(g); g.connect(this.master);
      osc.start(t + dt); osc.stop(t + dt + 0.18);
    }
    // idle rumble settles in
    const start = t + 0.55;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, start);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 240;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(0.1, start + 0.3);
    g.gain.linearRampToValueAtTime(0.05, start + 2.5);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 4);
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 12;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = 8;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    osc.connect(lp); lp.connect(g); g.connect(this.master);
    osc.start(start); osc.stop(start + 4.2);
    lfo.start(start); lfo.stop(start + 4.2);
  }

  doorCreak() {
    this.ensure();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.7);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.9);
  }

  fanfare() {
    this.ensure();
    const t = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 784];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      const start = t + i * 0.15;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.2, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, start + (i === notes.length - 1 ? 1.1 : 0.4));
      osc.connect(g); g.connect(this.master);
      osc.start(start); osc.stop(start + 1.2);
    });
  }

  footstep() {
    this.ensure();
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.07);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420 + Math.random() * 140;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    noise.connect(lp); lp.connect(g); g.connect(this.master);
    noise.start(t);
  }
}
