import { idle } from './animations/idle.js';
import { thinking } from './animations/thinking.js';
import { coding } from './animations/coding.js';
import { researching } from './animations/researching.js';
import { bash } from './animations/bash.js';
import { listening } from './animations/listening.js';
import * as moodOverlays from './sprites/mood-overlays.js';

const ANIMATIONS = { idle, thinking, coding, researching, bash, listening };

export class AnimationEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currentState = 'idle';
    this.currentFrame = 0;
    this.timer = null;
    this.scale = 4;
    this.onStateChange = null;

    // Mood overlay system
    this.currentMood = null;
    this.moodFrame = 0;
    this.moodTimer = null;

    this.ctx.imageSmoothingEnabled = false;
    this.setScale(this.scale);
  }

  setState(state) {
    if (state === this.currentState) return;
    if (!ANIMATIONS[state]) return;
    this.currentState = state;
    this.currentFrame = 0;
    this._restartTimer();
    if (this.onStateChange) this.onStateChange(state);
  }

  getState() {
    return this.currentState;
  }

  setMood(mood) {
    if (mood === this.currentMood) return;
    this.currentMood = mood;
    this.moodFrame = 0;
    this._restartMoodTimer();
    this._renderFrame();
  }

  setScale(factor) {
    this.scale = factor;
    const size = 32 * factor;
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.imageSmoothingEnabled = false;
    this._renderFrame();
  }

  start() {
    this._restartTimer();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.moodTimer) {
      clearInterval(this.moodTimer);
      this.moodTimer = null;
    }
  }

  _restartTimer() {
    if (this.timer) clearInterval(this.timer);
    const anim = ANIMATIONS[this.currentState];
    const interval = Math.round(1000 / anim.fps);
    this._renderFrame();
    this.timer = setInterval(() => this._tick(), interval);
  }

  _restartMoodTimer() {
    if (this.moodTimer) clearInterval(this.moodTimer);
    if (!this.currentMood || !moodOverlays[this.currentMood]) {
      this.moodTimer = null;
      return;
    }
    const overlay = moodOverlays[this.currentMood];
    const interval = Math.round(1000 / overlay.fps);
    this.moodTimer = setInterval(() => {
      this.moodFrame = (this.moodFrame + 1) % overlay.frames.length;
      this._renderFrame();
    }, interval);
  }

  _tick() {
    const anim = ANIMATIONS[this.currentState];
    this.currentFrame = (this.currentFrame + 1) % anim.frames.length;
    this._renderFrame();
  }

  _renderFrame() {
    const anim = ANIMATIONS[this.currentState];
    const frame = anim.frames[this.currentFrame];
    const s = this.scale;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const color = frame[y * 32 + x];
        if (color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(x * s, y * s, s, s);
        }
      }
    }

    // Stamp mood overlay on top
    if (this.currentMood && moodOverlays[this.currentMood]) {
      const overlay = moodOverlays[this.currentMood];
      const patches = overlay.frames[this.moodFrame % overlay.frames.length];
      for (const { x, y, color } of patches) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * s, y * s, s, s);
      }
    }
  }
}
