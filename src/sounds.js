export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.volume = 0.2;
    this.muted = false;
    this.codingLoopTimer = null;
    this.victoryPlaying = false;
    this.musicPlaying = false;
    this.musicStartTimer = null;
    this.musicGainNode = null;
    this.musicScheduler = null;
    this._codingClickVolume = 0.3;
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

  // ── SNES-style voice: square wave with ADSR envelope ──────────────

  _snesVoice(freq, { type = 'square', attack = 0.01, decay = 0.05, sustain = 0.6,
    release = 0.1, duration = 0.2, startTime = 0, detune = 0, vibRate = 0,
    vibDepth = 0, gain: vol = 0.4 } = {}) {
    const g = this._gain();
    if (!g) return null;
    const t = this.ctx.currentTime + startTime;

    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;

    // Vibrato LFO
    if (vibRate && vibDepth) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = vibRate;
      lfoGain.gain.value = vibDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + duration + release + 0.1);
    }

    // ADSR envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol, t + attack);
    env.gain.linearRampToValueAtTime(vol * sustain, t + attack + decay);
    env.gain.setValueAtTime(vol * sustain, t + duration - release);
    env.gain.linearRampToValueAtTime(0, t + duration);

    osc.connect(env);
    env.connect(g);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    osc.onended = () => { try { osc.disconnect(); } catch {} };
    return osc;
  }

  // ── SNES noise hit (snare/hat style) ──────────────────────────────

  _snesNoise(duration = 0.08, { startTime = 0, filter = 4000, vol = 0.3 } = {}) {
    const g = this._gain();
    if (!g) return;
    const t = this.ctx.currentTime + startTime;

    const bufLen = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    // SNES-style short period noise (more tonal/gritty)
    let val = 1;
    for (let i = 0; i < bufLen; i++) {
      if (Math.random() < 0.4) val = -val;
      data[i] = val * (1 - i / bufLen);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = filter;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.linearRampToValueAtTime(0, t + duration);

    src.connect(filt);
    filt.connect(env);
    env.connect(g);
    src.start(t);
    src.stop(t + duration + 0.01);
    src.onended = () => { try { src.disconnect(); } catch {} };
  }

  // ── State sounds (SNES style) ─────────────────────────────────────

  // Coding: mechanical keyboard clicks — short square pops
  playClawClick() {
    const freq = 800 + Math.random() * 400;
    this._snesVoice(freq, {
      type: 'square', duration: 0.03, attack: 0.002, decay: 0.01,
      sustain: 0.2, release: 0.01, vol: this._codingClickVolume || 0.3,
    });
    // Add a tiny noise click on top
    if (Math.random() > 0.5) {
      this._snesNoise(0.02, { filter: 6000, vol: 0.15 });
    }
  }

  startCodingLoop() {
    this.stopCodingLoop();
    const tick = () => {
      this.playClawClick();
      const delay = 80 + Math.random() * 120;
      this.codingLoopTimer = setTimeout(tick, delay);
    };
    tick();
  }

  stopCodingLoop() {
    if (this.codingLoopTimer) {
      clearTimeout(this.codingLoopTimer);
      this.codingLoopTimer = null;
    }
  }

  startCodingMusic() {
    if (this.musicPlaying) return;
    if (!this.ctx) this.init();
    this.musicPlaying = true;

    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    this.musicGainNode.gain.linearRampToValueAtTime(this.volume * 0.5, this.ctx.currentTime + 2);
    this.musicGainNode.connect(this.ctx.destination);

    this._codingClickVolume = 0.15;
    this._scheduleMusicLoop();
  }

  stopCodingMusic() {
    if (!this.musicPlaying) return;
    this.musicPlaying = false;
    this._codingClickVolume = 0.3;

    if (this.musicGainNode) {
      try {
        this.musicGainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        setTimeout(() => {
          try { this.musicGainNode.disconnect(); } catch {}
          this.musicGainNode = null;
        }, 1200);
      } catch {}
    }
    if (this.musicScheduler) {
      clearTimeout(this.musicScheduler);
      this.musicScheduler = null;
    }
  }

  _scheduleMusicLoop() {
    if (!this.musicPlaying || !this.musicGainNode) return;

    const bpm = 90;
    const beat = 60 / bpm;
    const bar = beat * 4;
    const t = this.ctx.currentTime;

    const scale = [262, 294, 330, 392, 440, 523, 587, 659];

    const melodyPattern = [
      [0, 2, 4, 5],  [4, 2, 0, -1],
      [2, 4, 5, 7],  [5, 4, 2, 0],
      [0, 4, 2, 5],  [7, 5, 4, 2],
      [4, 2, 5, 4],  [2, 0, -1, 0],
    ];

    const chordBass = [262, 262, 349, 349, 392, 392, 262, 262];

    const totalDuration = bar * 8;

    melodyPattern.forEach((barNotes, barIdx) => {
      barNotes.forEach((noteIdx, beatIdx) => {
        if (noteIdx < 0) return;
        const noteTime = t + barIdx * bar + beatIdx * beat;
        const freq = scale[noteIdx];

        this._musicVoice(freq, {
          type: 'triangle', startTime: noteTime - t,
          duration: beat * 0.8, attack: 0.02, decay: 0.05,
          sustain: 0.4, release: beat * 0.2, vol: 0.25,
        });
      });

      const bassFreq = chordBass[barIdx] / 2;
      this._musicVoice(bassFreq, {
        type: 'triangle', startTime: barIdx * bar,
        duration: beat * 1.5, attack: 0.02, decay: 0.1,
        sustain: 0.5, release: 0.2, vol: 0.2,
      });
      this._musicVoice(bassFreq, {
        type: 'triangle', startTime: barIdx * bar + beat * 2,
        duration: beat * 1.5, attack: 0.02, decay: 0.1,
        sustain: 0.5, release: 0.2, vol: 0.15,
      });

      if (barIdx % 2 === 0) {
        const chordFreq = chordBass[barIdx];
        this._musicVoice(chordFreq, {
          type: 'square', startTime: barIdx * bar,
          duration: bar * 2 * 0.9, attack: 0.1, decay: 0.2,
          sustain: 0.3, release: 0.5, vol: 0.06,
        });
        this._musicVoice(chordFreq * 1.5, {
          type: 'square', startTime: barIdx * bar,
          duration: bar * 2 * 0.9, attack: 0.1, decay: 0.2,
          sustain: 0.3, release: 0.5, vol: 0.04,
        });
      }
    });

    this.musicScheduler = setTimeout(() => {
      this._scheduleMusicLoop();
    }, totalDuration * 1000 - 100);
  }

  _musicVoice(freq, opts) {
    if (!this.musicGainNode || !this.musicPlaying) return;
    const t = this.ctx.currentTime + (opts.startTime || 0);

    const osc = this.ctx.createOscillator();
    osc.type = opts.type || 'triangle';
    osc.frequency.value = freq;

    const env = this.ctx.createGain();
    const dur = opts.duration || 0.5;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(opts.vol || 0.2, t + (opts.attack || 0.02));
    env.gain.linearRampToValueAtTime((opts.vol || 0.2) * (opts.sustain || 0.4), t + (opts.attack || 0.02) + (opts.decay || 0.05));
    env.gain.setValueAtTime((opts.vol || 0.2) * (opts.sustain || 0.4), t + dur - (opts.release || 0.1));
    env.gain.linearRampToValueAtTime(0, t + dur);

    osc.connect(env);
    env.connect(this.musicGainNode);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    osc.onended = () => { try { osc.disconnect(); } catch {} };
  }

  // Thinking: RPG menu cursor sound — two quick ascending square blips
  playThinking() {
    this._snesVoice(440, {
      type: 'square', duration: 0.08, attack: 0.005, decay: 0.02,
      sustain: 0.5, release: 0.03, vol: 0.35,
    });
    this._snesVoice(660, {
      type: 'square', duration: 0.1, attack: 0.005, decay: 0.02,
      sustain: 0.4, release: 0.04, startTime: 0.07, vol: 0.3,
    });
  }

  // Researching: page flip / scroll sound — filtered noise sweep
  playResearching() {
    const g = this._gain();
    if (!g) return;
    try {
      const dur = 0.18;
      const bufLen = this.ctx.sampleRate * dur;
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const filt = this.ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.Q.value = 3;
      filt.frequency.setValueAtTime(800, this.ctx.currentTime);
      filt.frequency.linearRampToValueAtTime(3000, this.ctx.currentTime + dur);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.25, this.ctx.currentTime);
      env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);

      src.connect(filt);
      filt.connect(env);
      env.connect(g);
      src.start();
      src.stop(this.ctx.currentTime + dur);
      src.onended = () => src.disconnect();
    } catch {}

    // Tiny triangle accent on top
    this._snesVoice(1100, {
      type: 'triangle', duration: 0.06, attack: 0.005, sustain: 0.3,
      release: 0.02, vol: 0.2,
    });
  }

  // Bash: terminal command execute — sharp square beep + noise burst
  playBash() {
    this._snesVoice(330, {
      type: 'square', duration: 0.06, attack: 0.003, decay: 0.015,
      sustain: 0.4, release: 0.02, vol: 0.35,
    });
    this._snesVoice(220, {
      type: 'square', duration: 0.08, attack: 0.003, decay: 0.02,
      sustain: 0.3, release: 0.03, startTime: 0.05, vol: 0.25,
    });
    this._snesNoise(0.04, { startTime: 0.02, filter: 2000, vol: 0.2 });
  }

  // Listening: RPG text prompt chime — ascending triangle arpeggio
  playListening() {
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      this._snesVoice(freq, {
        type: 'triangle', duration: 0.15, attack: 0.005, decay: 0.03,
        sustain: 0.5, release: 0.06, startTime: i * 0.08, vol: 0.35,
      });
    });
  }

  // ── Mood sounds (SNES style) ──────────────────────────────────────

  // Frustrated: descending minor — like taking damage
  playFrustrated() {
    const notes = [440, 370, 311]; // A4, F#4, Eb4 — diminished feel
    notes.forEach((freq, i) => {
      this._snesVoice(freq, {
        type: 'square', duration: 0.15, attack: 0.005, decay: 0.04,
        sustain: 0.5, release: 0.05, startTime: i * 0.1,
        vol: 0.35 - i * 0.05, detune: -10,
      });
    });
    this._snesNoise(0.12, { startTime: 0.05, filter: 1500, vol: 0.2 });
  }

  // Celebrating: FF Victory Fanfare! 🎺
  playCelebrating() {
    if (this.victoryPlaying) return;
    this.victoryPlaying = true;

    // FF victory fanfare melody (simplified to fit SNES square waves)
    // Iconic: da-da-da DA da da-da DA daaaa
    const bpm = 160;
    const beat = 60 / bpm;
    const q = beat;       // quarter
    const e = beat / 2;   // eighth
    const h = beat * 2;   // half
    const dq = beat * 1.5; // dotted quarter

    // Main melody (square wave, lead voice)
    const melody = [
      // da da da-DA — opening fanfare
      { note: 587, dur: e },    // D5
      { note: 587, dur: e },    // D5
      { note: 587, dur: e },    // D5
      { note: 784, dur: dq },   // G5 (held)
      { rest: e },
      // da da da-DA
      { note: 659, dur: e },    // E5
      { note: 659, dur: e },    // E5
      { note: 659, dur: e },    // E5
      { note: 880, dur: dq },   // A5 (held)
      { rest: e },
      // da da da-DA-da-da
      { note: 740, dur: e },    // F#5
      { note: 740, dur: e },    // F#5
      { note: 740, dur: e },    // F#5
      { note: 988, dur: q },    // B5
      { note: 880, dur: e },    // A5
      { note: 784, dur: e },    // G5
      // DAAAAA — triumphant resolve
      { note: 1047, dur: h },   // C6 (big finish)
    ];

    // Bass line (triangle wave)
    const bass = [
      { note: 196, dur: q * 3 },  // G3
      { rest: e },
      { note: 220, dur: q * 3 },  // A3
      { rest: e },
      { note: 247, dur: q * 2 },  // B3
      { note: 262, dur: q * 2 },  // C4
      { note: 294, dur: h },      // D4
    ];

    let time = 0;
    for (const step of melody) {
      if (step.rest) { time += step.rest; continue; }
      this._snesVoice(step.note, {
        type: 'square', duration: step.dur * 0.9, attack: 0.008,
        decay: 0.03, sustain: 0.65, release: step.dur * 0.15,
        startTime: time, vol: 0.3,
        vibRate: step.dur > q ? 5 : 0,
        vibDepth: step.dur > q ? 8 : 0,
      });
      time += step.dur;
    }

    let bassTime = 0;
    for (const step of bass) {
      if (step.rest) { bassTime += step.rest; continue; }
      this._snesVoice(step.note, {
        type: 'triangle', duration: step.dur * 0.85, attack: 0.01,
        decay: 0.05, sustain: 0.7, release: step.dur * 0.2,
        startTime: bassTime, vol: 0.25,
      });
      bassTime += step.dur;
    }

    // Cymbal crash on the big finish note
    const finishTime = time - (h * 0.9);
    this._snesNoise(0.4, { startTime: finishTime, filter: 3000, vol: 0.15 });

    setTimeout(() => { this.victoryPlaying = false; }, time * 1000 + 500);
  }

  // Confused: wobbly pitch bend — RPG puzzle/mystery sound
  playConfused() {
    this._snesVoice(500, {
      type: 'square', duration: 0.35, attack: 0.01, decay: 0.05,
      sustain: 0.5, release: 0.1, vol: 0.3,
      vibRate: 8, vibDepth: 30,
    });
    this._snesVoice(400, {
      type: 'triangle', duration: 0.25, attack: 0.01, decay: 0.05,
      sustain: 0.4, release: 0.08, startTime: 0.15, vol: 0.2,
      vibRate: 6, vibDepth: 20,
    });
  }

  // Excited: rapid ascending notes — RPG level up / power up
  playExcited() {
    const notes = [523, 659, 784, 988, 1047]; // C5 E5 G5 B5 C6
    notes.forEach((freq, i) => {
      this._snesVoice(freq, {
        type: 'square', duration: 0.1, attack: 0.005, decay: 0.02,
        sustain: 0.5, release: 0.04, startTime: i * 0.06, vol: 0.3,
      });
    });
    // Sparkle noise at the top
    this._snesNoise(0.06, { startTime: 0.28, filter: 8000, vol: 0.15 });
  }

  // Sleepy: slow descending triangle — RPG inn / save point
  playSleepy() {
    const notes = [392, 330, 262]; // G4, E4, C4
    notes.forEach((freq, i) => {
      this._snesVoice(freq, {
        type: 'triangle', duration: 0.35, attack: 0.02, decay: 0.08,
        sustain: 0.4, release: 0.15, startTime: i * 0.25,
        vol: 0.25 - i * 0.05,
        vibRate: 3, vibDepth: 5,
      });
    });
  }

  playEureka() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this._snesVoice(freq, {
        type: 'triangle', duration: 0.12, attack: 0.005, decay: 0.02,
        sustain: 0.6, release: 0.05, startTime: i * 0.08, vol: 0.35,
      });
    });
    this._snesNoise(0.05, { startTime: 0.3, filter: 8000, vol: 0.12 });
  }

  playFlinch() {
    this._snesVoice(350, {
      type: 'square', duration: 0.1, attack: 0.003, decay: 0.03,
      sustain: 0.4, release: 0.04, vol: 0.35, detune: -15,
    });
    this._snesNoise(0.08, { filter: 2000, vol: 0.25 });
  }

  playDetermined() {
    this._snesVoice(330, {
      type: 'square', duration: 0.1, attack: 0.005, decay: 0.02,
      sustain: 0.6, release: 0.03, vol: 0.35,
    });
    this._snesVoice(440, {
      type: 'square', duration: 0.15, attack: 0.005, decay: 0.03,
      sustain: 0.5, release: 0.05, startTime: 0.08, vol: 0.3,
    });
  }

  playProud() {
    const notes = [262, 330, 392];
    notes.forEach((freq) => {
      this._snesVoice(freq, {
        type: 'triangle', duration: 0.6, attack: 0.03, decay: 0.1,
        sustain: 0.4, release: 0.2, vol: 0.2,
        vibRate: 4, vibDepth: 5,
      });
    });
  }

  playCurious() {
    this._snesVoice(440, {
      type: 'triangle', duration: 0.25, attack: 0.01, decay: 0.05,
      sustain: 0.4, release: 0.1, vol: 0.25,
    });
    this._snesVoice(523, {
      type: 'triangle', duration: 0.2, attack: 0.01, decay: 0.05,
      sustain: 0.35, release: 0.08, startTime: 0.12, vol: 0.2,
    });
    this._snesVoice(415, {
      type: 'square', duration: 0.3, attack: 0.02, decay: 0.05,
      sustain: 0.3, release: 0.1, startTime: 0.2, vol: 0.12,
    });
  }

  // ── Dispatchers ───────────────────────────────────────────────────

  playForMood(mood) {
    if (!this.ctx) this.init();
    if (!mood) return;
    switch (mood) {
      case 'frustrated': this.playFrustrated(); break;
      case 'celebrating': this.playCelebrating(); break;
      case 'confused': this.playConfused(); break;
      case 'excited': this.playExcited(); break;
      case 'sleepy': this.playSleepy(); break;
      case 'determined': this.playDetermined(); break;
      case 'proud': this.playProud(); break;
      case 'curious': this.playCurious(); break;
    }
  }

  playForState(state) {
    if (!this.ctx) this.init();

    if (state !== 'coding' && state !== 'building') {
      this.stopCodingLoop();
      this.stopCodingMusic();
      if (this.musicStartTimer) {
        clearTimeout(this.musicStartTimer);
        this.musicStartTimer = null;
      }
    }

    switch (state) {
      case 'coding':
      case 'building':
        this.startCodingLoop();
        if (!this.musicStartTimer && !this.musicPlaying) {
          this.musicStartTimer = setTimeout(() => {
            this.startCodingMusic();
            this.musicStartTimer = null;
          }, 10000);
        }
        break;
      case 'thinking':
      case 'delegating':
        this.playThinking(); break;
      case 'researching':
      case 'browsing':
        this.playResearching(); break;
      case 'bash': this.playBash(); break;
      case 'listening': this.playListening(); break;
    }
  }
}
