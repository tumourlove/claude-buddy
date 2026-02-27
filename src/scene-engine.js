/**
 * SceneEngine — Isometric diamond-room renderer for cyberpunk goblin office.
 *
 * The room is a diamond-shaped isometric space:
 *   - Diamond floor centered in canvas
 *   - Two walls meeting at the back (top) corner
 *   - Furniture placed in isometric positions
 *   - Character walks between stations
 *
 * Rendering layers (bottom → top):
 *   0  room background (floor + walls as single image or procedural)
 *   1  furniture behind character (zIndex < charY)
 *   2  character (96×96 sprite)
 *   3  furniture in front of character (zIndex >= charY)
 *   4  effects (via onRenderEffects callback)
 */

const SCENE_SIZE = 480;

// Room diamond geometry — the floor diamond vertices
// Standard isometric ratio is 2:1 (halfW = 2 * halfH)
const ROOM = {
  cx: 240,        // center x
  cy: 270,        // center y (shifted down to leave wall space)
  halfW: 200,     // half-width of diamond
  halfH: 100,     // half-height of diamond (halfW/2 for true 2:1 isometric)
  wallH: 130,     // wall height in pixels
};

// Station-to-furniture mapping and default direction
// The character will stand next to the linked furniture piece.
const STATION_CONFIG = {
  coding:      { furniture: 'workbench',  direction: 'se', offsetX: -30, offsetY: 40 },
  researching: { furniture: 'bookshelf',  direction: 'sw', offsetX: 30,  offsetY: 40 },
  bash:        { furniture: 'terminal',   direction: 'se', offsetX: -30, offsetY: 40 },
  thinking:    { furniture: 'armchair',   direction: 'sw', offsetX: 30,  offsetY: 40 },
  listening:   { furniture: 'stool',      direction: 'sw', offsetX: 30,  offsetY: 30 },
  idle:        { furniture: 'hammock',    direction: 'se', offsetX: -20, offsetY: 40 },
};

// Fallback static positions (used before furniture is registered)
const STATIONS = {
  coding:      { x: 280, y: 270, direction: 'se' },
  researching: { x: 170, y: 210, direction: 'sw' },
  bash:        { x: 310, y: 205, direction: 'se' },
  thinking:    { x: 180, y: 270, direction: 'sw' },
  listening:   { x: 210, y: 310, direction: 'sw' },
  idle:        { x: 240, y: 310, direction: 'se' },
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
    this.tweenSpeed = 1.5; // pixels per frame (~90px/sec at 60fps)

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
   * zIndex is auto-calculated from y + image height for depth sorting.
   */
  addFurniture(name, x, y) {
    this.furniture.push({ name, x, y, zIndex: y + 64 });
    this.furnitureSorted = false;
  }

  /**
   * Load saved furniture positions from a map of { name: {x, y} }.
   */
  loadFurniturePositions(positions) {
    if (!positions) return;
    for (const f of this.furniture) {
      if (positions[f.name]) {
        f.x = positions[f.name].x;
        f.y = positions[f.name].y;
        f.zIndex = f.y + 64;
      }
    }
    this.furnitureSorted = false;
  }

  /**
   * Get all furniture positions as { name: {x, y} }.
   */
  getFurniturePositions() {
    const pos = {};
    for (const f of this.furniture) {
      pos[f.name] = { x: f.x, y: f.y };
    }
    return pos;
  }

  _ensureFurnitureSorted() {
    if (!this.furnitureSorted) {
      this.furniture.sort((a, b) => a.zIndex - b.zIndex);
      this.furnitureSorted = true;
    }
  }

  // ── Furniture dragging ────────────────────────────────────────────

  /**
   * Hit-test furniture at scene coordinates (sx, sy).
   * Returns the topmost (highest zIndex) furniture piece, or null.
   */
  furnitureAt(sx, sy) {
    // Check in reverse zIndex order (front to back)
    const sorted = [...this.furniture].sort((a, b) => b.zIndex - a.zIndex);
    for (const f of sorted) {
      const img = this.images.get(f.name);
      const w = img ? img.naturalWidth : 64;
      const h = img ? img.naturalHeight : 64;
      if (sx >= f.x && sx <= f.x + w && sy >= f.y && sy <= f.y + h) {
        return f;
      }
    }
    return null;
  }

  /**
   * Move a furniture piece to new scene coordinates.
   */
  moveFurniture(f, x, y) {
    f.x = x;
    f.y = y;
    f.zIndex = y + 64;
    this.furnitureSorted = false;
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

  /**
   * Get the target position for a state, based on linked furniture position.
   */
  _getStationPos(state) {
    const config = STATION_CONFIG[state];
    if (config) {
      const f = this.furniture.find(f => f.name === config.furniture);
      if (f) {
        return {
          x: f.x + 32 + config.offsetX,  // 32 = half of 64px furniture
          y: f.y + 32 + config.offsetY,
          direction: config.direction,
        };
      }
    }
    return STATIONS[state] || { x: 240, y: 260, direction: 'se' };
  }

  setState(state) {
    if (state === this.currentState) return;
    if (!STATIONS[state] && !STATION_CONFIG[state]) return;

    this.currentState = state;
    this.animFrame = 0;
    this.animAccum = 0;

    // Set tween target from furniture position
    const station = this._getStationPos(state);
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

    // Layer 0: isometric room (floor diamond + walls)
    if (this.showRoom) {
      this._drawRoom();
    }

    // Painter's algorithm: sort all drawable objects by their base Y
    // Character base Y = charY (center of sprite, feet area)
    // Furniture base Y = f.y + height (bottom edge of the prop)
    const drawables = [];

    for (const f of this.furniture) {
      const img = this.images.get(f.name);
      const h = img ? img.naturalHeight : 64;
      drawables.push({ type: 'furniture', f, sortY: f.y + h });
    }

    // Character sort Y: use a point near the feet (charY is center, +20 toward feet)
    drawables.push({ type: 'character', sortY: this.charY + 20 });

    // Sort by sortY ascending — things higher on screen draw first (behind)
    drawables.sort((a, b) => a.sortY - b.sortY);

    for (const d of drawables) {
      if (d.type === 'furniture') {
        this._drawFurniture(d.f);
      } else {
        this._drawCharacter();
      }
    }

    ctx.restore();

    // Layer 5: effects callback (receives scaled ctx)
    if (this.onRenderEffects) {
      this.onRenderEffects(ctx, { x: this.charX, y: this.charY }, s);
    }
  }

  /**
   * Draw the complete isometric room: diamond floor + two back walls.
   * If a 'room' image is loaded, draw that; otherwise draw procedurally.
   */
  _drawRoom() {
    const img = this.images.get('room');
    if (img) {
      // Single pre-rendered room image
      this.ctx.drawImage(img, 0, 0);
      return;
    }
    // Procedural isometric room
    this._drawProceduralRoom();
  }

  _drawProceduralRoom() {
    const ctx = this.ctx;
    const { cx, cy, halfW, halfH, wallH } = ROOM;

    // Diamond floor vertices: top, right, bottom, left
    const top    = { x: cx, y: cy - halfH };
    const right  = { x: cx + halfW, y: cy };
    const bottom = { x: cx, y: cy + halfH };
    const left   = { x: cx - halfW, y: cy };

    // ── Left wall (back-left edge going up) ──
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(left.x, left.y - wallH);
    ctx.lineTo(top.x, top.y - wallH);
    ctx.closePath();
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wall detail lines (left wall)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const y1 = top.y - wallH + t * wallH;
      const y2 = left.y - wallH + t * wallH;
      ctx.beginPath();
      ctx.moveTo(top.x, y1);
      ctx.lineTo(left.x, y2);
      ctx.stroke();
    }

    // ── Right wall (back-right edge going up) ──
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(right.x, right.y - wallH);
    ctx.lineTo(top.x, top.y - wallH);
    ctx.closePath();
    ctx.fillStyle = '#16213e';
    ctx.fill();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wall detail lines (right wall)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const y1 = top.y - wallH + t * wallH;
      const y2 = right.y - wallH + t * wallH;
      ctx.beginPath();
      ctx.moveTo(top.x, y1);
      ctx.lineTo(right.x, y2);
      ctx.stroke();
    }

    // Neon strip along wall top edges
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y - wallH);
    ctx.lineTo(top.x, top.y - wallH);
    ctx.lineTo(right.x, right.y - wallH);
    ctx.stroke();

    // ── Diamond floor ──
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();

    // Fill floor with dark base first
    ctx.fillStyle = '#0a0a1a';
    ctx.fill();

    // Tile the floor aligned to isometric diamond axes.
    // The floor tile is an isometric diamond (64x64 canvas, ~64 wide, ~32 tall diamond).
    // Place tiles along the diamond's two axes so they seamlessly tile.
    //
    // Isometric tile spacing:
    //   Along right-edge of diamond (top→right): each tile steps (+tileW/2, +tileH_diamond/2)
    //   Along left-edge of diamond (top→left):   each tile steps (-tileW/2, +tileH_diamond/2)
    // where tileH_diamond ≈ tileW/2 for standard 2:1 isometric.
    const floorImg = this.images.get('floor');
    if (floorImg) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(right.x, right.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.lineTo(left.x, left.y);
      ctx.closePath();
      ctx.clip();

      const tw = floorImg.naturalWidth;   // 64
      // The diamond in the tile is tw wide and tw/2 tall (standard 2:1 iso)
      const dw = tw;      // tile diamond width = 64
      const dh = tw / 2;  // tile diamond height = 32

      // Basis vectors for isometric grid placement:
      // Move one tile to the "right" along the diamond's right-edge axis
      const axX = dw / 2;    // +32
      const axY = dh / 2;    // +16
      // Move one tile "down" along the diamond's left-edge axis
      const ayX = -dw / 2;   // -32
      const ayY = dh / 2;    // +16

      // We need enough tiles to cover the diamond. The diamond spans
      // halfW along each axis, so we need ceil(halfW / (dw/2)) tiles per axis
      const tilesPerAxis = Math.ceil(halfW / (dw / 2)) + 2;

      // Origin: start from the top vertex of the room diamond
      const originX = top.x;
      const originY = top.y;

      for (let row = -1; row < tilesPerAxis; row++) {
        for (let col = -1; col < tilesPerAxis; col++) {
          // Position of this tile's center in screen coords
          const px = originX + col * axX + row * ayX;
          const py = originY + col * axY + row * ayY;
          // drawImage places at top-left, tile center is at (tw/2, dh/2) within the image
          ctx.drawImage(floorImg, px - tw / 2, py - dh / 2);
        }
      }

      ctx.restore();
    }

    // Floor outline
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid lines on floor for isometric feel
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridLines = 8;
    for (let i = 1; i < gridLines; i++) {
      const t = i / gridLines;
      // Lines parallel to left edge (top→right lerped with left→bottom)
      const x1 = top.x + (right.x - top.x) * t;
      const y1 = top.y + (right.y - top.y) * t;
      const x2 = left.x + (bottom.x - left.x) * t;
      const y2 = left.y + (bottom.y - left.y) * t;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Lines parallel to right edge (top→left lerped with right→bottom)
      const x3 = top.x + (left.x - top.x) * t;
      const y3 = top.y + (left.y - top.y) * t;
      const x4 = right.x + (bottom.x - right.x) * t;
      const y4 = right.y + (bottom.y - right.y) * t;
      ctx.beginPath();
      ctx.moveTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.stroke();
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
