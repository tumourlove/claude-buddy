export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.volume = 0.2;
    this.muted = false;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }
  setMuted(m) { this.muted = m; }

  _gain() {
    if (!this.ctx || this.muted) return null;
    const gain = this.ctx.createGain();
    gain.gain.value = this.volume;
    gain.connect(this.ctx.destination);
    return gain;
  }

  // Soft click for coding/typing
  playTyping() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800 + Math.random() * 400;
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  // Gentle blip for thinking
  playThinking() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.15);
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Whoosh for researching
  playResearching() {
    const g = this._gain(); if (!g) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    noise.connect(filter);
    filter.connect(g);
    noise.start();
  }

  // Terminal beep for bash
  playBash() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 440;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g2.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
    osc.connect(g2);
    g2.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Gentle chime for listening
  playListening() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.1);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.4, this.ctx.currentTime);
    env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.25);
    osc.connect(env);
    env.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Play sound for state
  playForState(state) {
    if (!this.ctx) this.init();
    switch (state) {
      case 'coding': this.playTyping(); break;
      case 'thinking': this.playThinking(); break;
      case 'researching': this.playResearching(); break;
      case 'bash': this.playBash(); break;
      case 'listening': this.playListening(); break;
    }
  }
}
