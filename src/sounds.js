export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.volume = 0.2;
    this.muted = false;
    this.codingLoopTimer = null;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }
  setMuted(m) { this.muted = m; }

  _gain() {
    if (!this.ctx || this.muted) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
      return null;
    }
    const gain = this.ctx.createGain();
    gain.gain.value = this.volume;
    gain.connect(this.ctx.destination);
    return gain;
  }

  // Claw click — short percussive sine
  playClawClick() {
    const g = this._gain(); if (!g) return;
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 1200 + Math.random() * 600;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.6, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.025);
      osc.connect(env);
      env.connect(g);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Start continuous clicking loop for coding state
  startCodingLoop() {
    this.stopCodingLoop();
    const tick = () => {
      this.playClawClick();
      const delay = 80 + Math.random() * 120;
      this.codingLoopTimer = setTimeout(tick, delay);
    };
    tick();
  }

  // Stop the clicking loop
  stopCodingLoop() {
    if (this.codingLoopTimer) {
      clearTimeout(this.codingLoopTimer);
      this.codingLoopTimer = null;
    }
  }

  // Gentle blip for thinking
  playThinking() {
    const g = this._gain(); if (!g) return;
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.15);
      osc.connect(g);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Whoosh for researching
  playResearching() {
    const g = this._gain(); if (!g) return;
    try {
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
      noise.stop(this.ctx.currentTime + 0.2);
      noise.onended = () => noise.disconnect();
    } catch {}
  }

  // Terminal beep for bash
  playBash() {
    const g = this._gain(); if (!g) return;
    try {
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
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Gentle chime for listening
  playListening() {
    const g = this._gain(); if (!g) return;
    try {
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
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Low descending tone for frustration
  playFrustrated() {
    const g = this._gain(); if (!g) return;
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.3);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.3, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      osc.connect(env);
      env.connect(g);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Rising triumphant arpeggio for celebration
  playCelebrating() {
    const g = this._gain(); if (!g) return;
    try {
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.1);
        env.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + i * 0.1 + 0.05);
        env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.1 + 0.2);
        osc.connect(env);
        env.connect(g);
        osc.start(this.ctx.currentTime + i * 0.1);
        osc.stop(this.ctx.currentTime + i * 0.1 + 0.2);
        osc.onended = () => osc.disconnect();
      });
    } catch {}
  }

  // Wobbly confused tone
  playConfused() {
    const g = this._gain(); if (!g) return;
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(450, this.ctx.currentTime + 0.16);
      osc.frequency.setValueAtTime(550, this.ctx.currentTime + 0.24);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.3, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      osc.connect(env);
      env.connect(g);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Quick ascending chirp for excitement
  playExcited() {
    const g = this._gain(); if (!g) return;
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.15);
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.4, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
      osc.connect(env);
      env.connect(g);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Soft low hum for sleepy
  playSleepy() {
    const g = this._gain(); if (!g) return;
    try {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 180;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.15, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      osc.connect(env);
      env.connect(g);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
      osc.onended = () => osc.disconnect();
    } catch {}
  }

  // Play one-shot sound when mood changes
  playForMood(mood) {
    if (!this.ctx) this.init();
    if (!mood) return;
    switch (mood) {
      case 'frustrated': this.playFrustrated(); break;
      case 'celebrating': this.playCelebrating(); break;
      case 'confused': this.playConfused(); break;
      case 'excited': this.playExcited(); break;
      case 'sleepy': this.playSleepy(); break;
    }
  }

  // Play sound for state — starts/stops coding loop as needed
  playForState(state) {
    if (!this.ctx) this.init();

    // Stop coding loop when leaving coding state
    if (state !== 'coding') {
      this.stopCodingLoop();
    }

    switch (state) {
      case 'coding': this.startCodingLoop(); break;
      case 'thinking': this.playThinking(); break;
      case 'researching': this.playResearching(); break;
      case 'bash': this.playBash(); break;
      case 'listening': this.playListening(); break;
    }
  }
}
