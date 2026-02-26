import { idle } from './animations/idle.js';
import { thinking } from './animations/thinking.js';
import { coding } from './animations/coding.js';
import { researching } from './animations/researching.js';
import { bash } from './animations/bash.js';
import { listening } from './animations/listening.js';

const ANIMATIONS = { idle, thinking, coding, researching, bash, listening };

export class AnimationEngine {
  constructor(element) {
    this.el = element;
    this.currentState = 'idle';
    this.currentFrame = 0;
    this.timer = null;
    this.onStateChange = null;
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

  start() {
    this._restartTimer();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  _restartTimer() {
    this.stop();
    const anim = ANIMATIONS[this.currentState];
    const interval = Math.round(1000 / anim.fps);
    this._renderFrame();
    this.timer = setInterval(() => this._tick(), interval);
  }

  _tick() {
    const anim = ANIMATIONS[this.currentState];
    this.currentFrame = (this.currentFrame + 1) % anim.frames.length;
    this._renderFrame();
  }

  _renderFrame() {
    const anim = ANIMATIONS[this.currentState];
    const frame = anim.frames[this.currentFrame];
    this.el.textContent = frame.join('\n');
  }
}
