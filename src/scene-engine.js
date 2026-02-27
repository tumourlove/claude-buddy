/**
 * SceneEngine — Layered isometric scene renderer for CLAWD's steampunk workshop.
 *
 * Rendering layers (bottom → top):
 *   0  floor tiles
 *   1  wall background
 *   2  furniture behind character (zIndex < charY)
 *   3  character (96×96 sprite)
 *   4  furniture in front of character (zIndex >= charY)
 *   5  effects (via onRenderEffects callback)
 */

const SCENE_SIZE = 480;

const STATIONS = {
  coding:      { x: 300, y: 200, direction: 'se' },
  researching: { x: 80,  y: 100, direction: 'sw' },
  bash:        { x: 340, y: 100, direction: 'se' },
  thinking:    { x: 80,  y: 220, direction: 'sw' },
  listening:   { x: 120, y: 340, direction: 'sw' },
  idle:        { x: 340, y: 340, direction: 'se' },
};

class SceneEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // State
    this.currentState = 'idle';
    this.currentMood = null;
    this.scale = 1;
    this.showRoom = true;
    this.running = false;
    this.rafId = null;

    // Images keyed by name
    this.images = new Map();

    // Furniture: { name, x, y, zIndex, image? }
    this.furniture = [];
    this.furnitureSorted = false;

    // Animation pool: state → [ { frames: [Image], fps: number } ]
    this.animationPool = new Map();
    // Currently active variant index per state
    this.activeVariant = new Map();
    // Track last-used variant to avoid immediate repeats
    this.lastVariant = new Map();

    // Animation playback
    this.animFrame = 0;
    this.animAccum = 0; // accumulated ms for frame timing
    this.lastTimestamp = 0;

    // Character tweening
    this.charX = STATIONS.idle.x;
    this.charY = STATIONS.idle.y;
    this.charDirection = STATIONS.idle.direction;
    this.targetX = this.charX;
    this.targetY = this.charY;
    this.tweenSpeed = 3; // pixels per frame (~180px/sec at 60fps)

    // Callbacks
    this.onRenderEffects = null;
    this.onStateChange = null;

    // Initial canvas setup
    this._applyScale();
  }

  // ── Image loading ──────────────────────────────────────────────────

  /**
   * Load a named image from `src` URL. Returns a promise that resolves
   * to the HTMLImageElement once loaded.
   */
  loadImage(name, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(name, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${name} (${src})`));
      img.src = src;
    });
  }

  // ── Furniture ──────────────────────────────────────────────────────

  /**
   * Register a furniture piece by name at scene coordinates (x, y).
   * zIndex controls draw order relative to the character.
   */
  addFurniture(name, x, y, zIndex) {
    this.furniture.push({ name, x, y, zIndex });
    this.furnitureSorted = false;
  }

  _ensureFurnitureSorted() {
    if (!this.furnitureSorted) {
      this.furniture.sort((a, b) => a.zIndex - b.zIndex);
      this.furnitureSorted = true;
    }
  }

  // ── Animation pool ─────────────────────────────────────────────────

  /**
   * Register animation variants for a state.
   * @param {string} state
   * @param {Array<{ frames: Image[], fps: number }>} variants
   */
  registerAnimations(state, variants) {
    this.animationPool.set(state, variants);
    // Pick initial variant
    this.activeVariant.set(state, 0);
    this.lastVariant.set(state, -1);
  }

  /**
   * Pick a random variant for the given state, avoiding the last-used one
   * when possible.
   */
  _pickVariant(state) {
    const variants = this.animationPool.get(state);
    if (!variants || variants.length === 0) return 0;
    if (variants.length === 1) return 0;

    const last = this.lastVariant.get(state) ?? -1;
    let idx;
    do {
      idx = Math.floor(Math.random() * variants.length);
    } while (idx === last && variants.length > 1);
    return idx;
  }

  /**
   * Get the currently active animation variant for the current state.
   */
  _currentVariant() {
    const variants = this.animationPool.get(this.currentState);
    if (!variants || variants.length === 0) return null;
    const idx = this.activeVariant.get(this.currentState) ?? 0;
    return variants[idx];
  }

  // ── State / mood ───────────────────────────────────────────────────

  setState(state) {
    if (state === this.currentState) return;
    if (!STATIONS[state]) return;

    this.currentState = state;
    this.animFrame = 0;
    this.animAccum = 0;

    // Set tween target
    const station = STATIONS[state];
    this.targetX = station.x;
    this.targetY = station.y;
    this.charDirection = station.direction;

    // Pick a new animation variant
    const idx = this._pickVariant(state);
    this.activeVariant.set(state, idx);
    this.lastVariant.set(state, idx);

    if (this.onStateChange) this.onStateChange(state);
  }

  getState() {
    return this.currentState;
  }

  setMood(mood) {
    this.currentMood = mood;
  }

  getMood() {
    return this.currentMood;
  }

  // ── Display controls ───────────────────────────────────────────────

  setShowRoom(show) {
    this.showRoom = !!show;
  }

  setScale(factor) {
    this.scale = factor;
    this._applyScale();
  }

  _applyScale() {
    const size = Math.round(SCENE_SIZE * this.scale);
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.imageSmoothingEnabled = false;
  }

  // ── Render loop ────────────────────────────────────────────────────

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame((ts) => this._loop(ts));
  }

  stop() {
    this.running = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _loop(timestamp) {
    if (!this.running) return;

    const dt = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this._updateTween();
    this._updateAnimation(dt);
    this._render();

    this.rafId = requestAnimationFrame((ts) => this._loop(ts));
  }

  // ── Tweening ───────────────────────────────────────────────────────

  _updateTween() {
    const dx = this.targetX - this.charX;
    const dy = this.targetY - this.charY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.tweenSpeed) {
      this.charX = this.targetX;
      this.charY = this.targetY;
    } else {
      this.charX += (dx / dist) * this.tweenSpeed;
      this.charY += (dy / dist) * this.tweenSpeed;
    }
  }

  // ── Animation frame advancement ────────────────────────────────────

  _updateAnimation(dt) {
    const variant = this._currentVariant();
    if (!variant || variant.frames.length === 0) return;

    const frameDuration = 1000 / variant.fps;
    this.animAccum += dt;

    while (this.animAccum >= frameDuration) {
      this.animAccum -= frameDuration;
      this.animFrame++;

      // Detect loop boundary
      if (this.animFrame >= variant.frames.length) {
        this.animFrame = 0;

        // 30% chance to swap variant on loop cycle
        if (Math.random() < 0.3) {
          const state = this.currentState;
          const idx = this._pickVariant(state);
          this.activeVariant.set(state, idx);
          this.lastVariant.set(state, idx);
        }
      }
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────

  _render() {
    const ctx = this.ctx;
    const s = this.scale;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.scale(s, s);

    // Layer 0–1: floor and wall (skipped when showRoom is off)
    if (this.showRoom) {
      this._drawLayer('floor');
      this._drawLayer('wall');
    }

    // Prepare furniture split around character
    this._ensureFurnitureSorted();
    const charDrawY = this.charY;
    const behind = [];
    const inFront = [];
    for (const f of this.furniture) {
      if (f.zIndex < charDrawY) {
        behind.push(f);
      } else {
        inFront.push(f);
      }
    }

    // Layer 2: furniture behind character
    for (const f of behind) {
      this._drawFurniture(f);
    }

    // Layer 3: character
    this._drawCharacter();

    // Layer 4: furniture in front of character
    for (const f of inFront) {
      this._drawFurniture(f);
    }

    ctx.restore();

    // Layer 5: effects callback (receives scaled ctx)
    if (this.onRenderEffects) {
      this.onRenderEffects(ctx, { x: this.charX, y: this.charY }, s);
    }
  }

  _drawLayer(name) {
    const img = this.images.get(name);
    if (img) {
      this.ctx.drawImage(img, 0, 0, SCENE_SIZE, SCENE_SIZE);
    }
  }

  _drawFurniture(f) {
    const img = this.images.get(f.name);
    if (img) {
      this.ctx.drawImage(img, f.x, f.y);
    }
  }

  _drawCharacter() {
    // Animated frame takes priority; fall back to static directional sprite
    const variant = this._currentVariant();
    let img = null;

    if (variant && variant.frames.length > 0) {
      const frameIdx = Math.min(this.animFrame, variant.frames.length - 1);
      img = variant.frames[frameIdx];
    }

    if (!img) {
      img = this.images.get(`clawd-${this.charDirection}`);
    }

    if (img) {
      // Center the 96×96 sprite on the character position
      this.ctx.drawImage(img, this.charX - 48, this.charY - 48);
    }
  }
}

export { SceneEngine, STATIONS, SCENE_SIZE };
