/**
 * SceneEngine — Isometric diamond-room renderer for game dev office.
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
// Offsets position the character relative to furniture center (32,32).
// In isometric view: +X = right, +Y = down. "In front of" furniture
// means down-right or down-left along isometric axes.
const STATION_CONFIG = {
  coding:      { furniture: 'workbench',  direction: 'se', offsetX: 42,  offsetY: 2 },
  researching: { furniture: 'bookshelf',  direction: 'se', offsetX: 0,   offsetY: 20 },
  bash:        { furniture: 'terminal',   direction: 'sw', offsetX: -31, offsetY: 26 },
  thinking:    { furniture: 'armchair',   direction: 'se', offsetX: -20, offsetY: 11 },
  listening:   { furniture: 'armchair',   direction: 'sw', offsetX: -20, offsetY: 11 },
  idle:        { furniture: 'armchair',   direction: 'se', offsetX: -20, offsetY: 11 },
  browsing:    { furniture: 'terminal',   direction: 'sw', offsetX: -31, offsetY: 26 },
  building:    { furniture: 'workbench',  direction: 'se', offsetX: 42,  offsetY: 2 },
  delegating:  { furniture: 'armchair',   direction: 'sw', offsetX: -20, offsetY: 11 },
};

// Fallback static positions (used before furniture is registered)
const STATIONS = {
  coding:      { x: 280, y: 270, direction: 'se' },
  researching: { x: 170, y: 210, direction: 'n' },
  bash:        { x: 310, y: 205, direction: 's' },
  thinking:    { x: 180, y: 270, direction: 'sw' },
  listening:   { x: 180, y: 270, direction: 'sw' },
  idle:        { x: 200, y: 280, direction: 'se' },
  browsing:   { x: 310, y: 205, direction: 's' },
  building:   { x: 280, y: 270, direction: 'se' },
  delegating: { x: 180, y: 270, direction: 'sw' },
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
    this.isMoving = false; // true while tweening to target

    // Thought bubble
    this.thoughtBubble = null; // { emoji, opacity, fadeIn }
    this.moodBubble = null;    // { emoji, opacity, fadeIn }

    // One-shot animation (flinch, eureka, victory)
    this.oneShotAnim = null;
    this.oneShotPrevEmoji = null;

    // Idle wandering
    this.wanderTimer = null;
    this.wanderState = 'idle';
    this.isWandering = false;
    this.wanderEmojis = ['🤔', '🔧', '📦', '✨', '🔍', '🎵'];

    // Flow state
    this.inFlow = false;

    // LED ticker tape
    this.tickerMessage = '';
    this.tickerScrollX = 0;
    this.tickerQueue = [];
    this.tickerUsed = new Map();
    this.tickerSpeed = 35;          // pixels per second
    this.tickerWidth = 0;           // calculated text width (set during render)
    this.tickerPanelWidth = 160;    // will be recalculated during render

    // Callbacks
    this.onRenderEffects = null;
    this.onStateChange = null;

    // Initial canvas setup
    this._applyScale();

    this.tickerMessage = 'BOOTING UP...';
    this.tickerScrollX = 0;
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
   * Uses walking animation when the character is moving between stations.
   */
  _currentVariant() {
    if (this.oneShotAnim) {
      return this.oneShotAnim.variant;
    }

    // Use walking animation while moving (supports n, s, se, sw)
    if (this.isMoving) {
      const walkKey = `walking-${this.charDirection}`;
      const walkVariants = this.animationPool.get(walkKey);
      if (walkVariants && walkVariants.length > 0) return walkVariants[0];
      // Fallback: try east/west if exact direction not registered
      const fallback = (this.charDirection === 'n' || this.charDirection === 'sw') ? 'walking-sw' : 'walking-se';
      const fbVariants = this.animationPool.get(fallback);
      if (fbVariants && fbVariants.length > 0) return fbVariants[0];
    }

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

  // ── Thought bubble ──────────────────────────────────────────────────

  static THOUGHT_EMOJIS = {
    coding:      '💻',
    researching: '📖',
    bash:        '⚡',
    thinking:    '💭',
    listening:   '👂',
    idle:        '😴',
    browsing:    '🌐',
    building:    '🏗️',
    delegating:  '🫡',
  };

  static MOOD_EMOJIS = {
    frustrated:  '😤',
    celebrating: '🎉',
    confused:    '❓',
    excited:     '🔥',
    sleepy:      '💤',
    determined:  '💪',
    proud:       '🌟',
    curious:     '🔎',
  };

  static TICKER_MESSAGES = {
    coding:      ['HACKING THE MAINFRAME', 'TYPING FURIOUSLY', 'DEPLOYING BUTTERFLIES', 'MOVING PIXELS AROUND', 'COPY PASTE ENGINEERING', 'ARTISANAL CODE CRAFTING'],
    researching: ['PONTIFICATING', 'CONSULTING THE ORACLE', 'READING ANCIENT SCROLLS', 'GOOGLING INTENSELY', 'ABSORBING KNOWLEDGE', 'SPEED READING'],
    bash:        ['SUMMONING DEMONS', 'RUNNING WITH SCISSORS', 'POKING THE BEAR', 'sudo MAKE ME A SANDWICH', 'EXECUTING ORDER 66', 'PERMISSION DENIED LOL'],
    thinking:    ['LOADING THOUGHTS...', 'BRAIN.EXE RUNNING', 'CONTEMPLATING EXISTENCE', 'BUFFERING...', 'COGITATING VIGOROUSLY', 'PROCESSING...'],
    listening:   ['AWAITING ORDERS', 'ALL EARS', 'YES BOSS?', 'STANDING BY', 'READY FOR INPUT', 'AT YOUR SERVICE'],
    idle:        ['ZZZ', 'POWER SAVING MODE', 'SCREEN SAVER ACTIVE', 'ON BREAK', 'DO NOT DISTURB', 'AFK'],
    browsing:    ['SURFING THE WEB', 'DOOM SCROLLING', 'DOWNLOADING MORE RAM', 'CLICKING LINKS', 'INCOGNITO MODE'],
    building:    ['CONSTRUCTING PYLONS', 'LAYING BRICKS', 'ASSEMBLING IKEA CODE', 'BUILDING CHARACTER', 'SOME ASSEMBLY REQUIRED'],
    delegating:  ['PASSING THE BUCK', 'DELEGATING RESPONSIBILITY', 'OUTSOURCING', 'MIDDLE MANAGEMENT', 'HERDING CATS'],
  };

  _showThoughtBubble(state) {
    const emoji = SceneEngine.THOUGHT_EMOJIS[state];
    if (!emoji) return;
    // Persistent bubble — stays until state changes
    this.thoughtBubble = { emoji, opacity: 0, fadeIn: true };
  }

  _showMoodEmoji(mood) {
    if (mood) {
      const emoji = SceneEngine.MOOD_EMOJIS[mood];
      if (emoji) {
        this.moodBubble = { emoji, opacity: 0, fadeIn: true };
        return;
      }
    }
    // No mood or unknown mood — fade out
    if (this.moodBubble) {
      this.moodBubble.fadeIn = false;
    }
  }

  _updateThoughtBubble() {
    // Update state bubble (persistent, fade in only)
    if (this.thoughtBubble) {
      if (this.thoughtBubble.fadeIn && this.thoughtBubble.opacity < 1) {
        this.thoughtBubble.opacity = Math.min(1, this.thoughtBubble.opacity + 0.05);
      }
    }
    // Update mood bubble (fade in/out)
    if (this.moodBubble) {
      if (this.moodBubble.fadeIn && this.moodBubble.opacity < 1) {
        this.moodBubble.opacity = Math.min(1, this.moodBubble.opacity + 0.05);
      } else if (!this.moodBubble.fadeIn) {
        this.moodBubble.opacity -= 0.03;
        if (this.moodBubble.opacity <= 0) {
          this.moodBubble = null;
        }
      }
    }
  }

  _drawBubble(ctx, emoji, opacity, bx, by, showTrail) {
    ctx.save();
    ctx.globalAlpha = opacity;

    if (showTrail) {
      // Small bubble trail
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(this.charX + 6, this.charY - 36, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.charX + 12, this.charY - 42, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main bubble background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const bw = 24;
    const bh = 22;
    ctx.beginPath();
    const r = 8;
    ctx.moveTo(bx - bw / 2 + r, by - bh / 2);
    ctx.arcTo(bx + bw / 2, by - bh / 2, bx + bw / 2, by + bh / 2, r);
    ctx.arcTo(bx + bw / 2, by + bh / 2, bx - bw / 2, by + bh / 2, r);
    ctx.arcTo(bx - bw / 2, by + bh / 2, bx - bw / 2, by - bh / 2, r);
    ctx.arcTo(bx - bw / 2, by - bh / 2, bx + bw / 2, by - bh / 2, r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Emoji
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(emoji, bx, by);

    ctx.restore();
  }

  _drawThoughtBubble() {
    const ctx = this.ctx;
    // State bubble (with trail dots)
    if (this.thoughtBubble && this.thoughtBubble.opacity > 0) {
      const bx = this.charX + 20;
      const by = this.charY - 52;
      this._drawBubble(ctx, this.thoughtBubble.emoji, this.thoughtBubble.opacity, bx, by, true);
    }
    // Mood bubble (above state bubble, no trail)
    if (this.moodBubble && this.moodBubble.opacity > 0) {
      const bx = this.charX + 20;
      const by = this.charY - 78;
      this._drawBubble(ctx, this.moodBubble.emoji, this.moodBubble.opacity, bx, by, false);
    }
  }

  setState(state) {
    this.stopWandering();
    if (this.oneShotAnim) {
      this.oneShotAnim = null;
      this.oneShotPrevEmoji = null;
    }
    if (state === this.currentState) return;
    if (!STATIONS[state] && !STATION_CONFIG[state]) return;

    this.currentState = state;
    this.animFrame = 0;
    this.animAccum = 0;

    // Show thought bubble for the new state
    this._showThoughtBubble(state);

    // Queue ticker message for new state
    this.tickerQueue.push(this._pickTickerMessage(state));
    if (this.tickerQueue.length > 3) {
      this.tickerQueue = this.tickerQueue.slice(-2);
    }

    // Set tween target from furniture position, clamped to diamond
    const station = this._getStationPos(state);
    const clamped = this._clampToDiamond(station.x, station.y);
    this.targetX = clamped.x;
    this.targetY = clamped.y;
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
    this._showMoodEmoji(mood);
  }

  getMood() {
    return this.currentMood;
  }

  playOneShot(animKey, { emoji = null, onComplete = null } = {}) {
    const variants = this.animationPool.get(animKey);
    if (!variants || variants.length === 0) return;
    const variant = variants[0];

    this.oneShotPrevEmoji = this.thoughtBubble ? this.thoughtBubble.emoji : null;
    this.oneShotAnim = { variant, frameIdx: 0, accum: 0, emoji, onComplete };

    if (emoji) {
      this.thoughtBubble = { emoji, opacity: 1, fadeIn: true };
    }
  }

  setFlow(flowing) {
    this.inFlow = flowing;
  }

  _pickTickerMessage(state) {
    const pool = SceneEngine.TICKER_MESSAGES[state];
    if (!pool || pool.length === 0) return 'BUSY...';

    let used = this.tickerUsed.get(state);
    if (!used || used.size >= pool.length) {
      used = new Set();
      this.tickerUsed.set(state, used);
    }

    const available = pool.filter(m => !used.has(m));
    const msg = available[Math.floor(Math.random() * available.length)];
    used.add(msg);
    return msg;
  }

  // ── Idle wandering ──────────────────────────────────────────────────

  startWandering() {
    if (this.isWandering) return;
    this.isWandering = true;
    this._wanderNext();
  }

  stopWandering() {
    this.isWandering = false;
    this.wanderState = 'idle';
    if (this.wanderTimer) {
      clearTimeout(this.wanderTimer);
      this.wanderTimer = null;
    }
  }

  _wanderNext() {
    if (!this.isWandering) return;

    const candidates = this.furniture.filter(f => {
      const dx = f.x + 32 - this.charX;
      const dy = f.y + 32 - this.charY;
      return Math.sqrt(dx * dx + dy * dy) > 40;
    });
    if (candidates.length === 0) return;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const offsetX = (Math.random() - 0.5) * 30;
    const clamped = this._clampToDiamond(target.x + 32 + offsetX, target.y + 32 + 40);
    this.targetX = clamped.x;
    this.targetY = clamped.y;
    this.wanderState = 'walking';
    this.wanderTarget = target.name;
  }

  _updateWander() {
    if (!this.isWandering) return;

    if (this.wanderState === 'walking' && !this.isMoving) {
      // Arrived at furniture — show curiosity emoji and pause
      const emoji = this.wanderEmojis[Math.floor(Math.random() * this.wanderEmojis.length)];
      this._showThoughtBubble(emoji);
      this.wanderState = 'pausing';
      const delay = 3000 + Math.random() * 4000;
      this.wanderTimer = setTimeout(() => {
        if (this.isWandering) this._wanderNext();
      }, delay);
    }
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
    this._updateWander();
    this._updateAnimation(dt);
    this._updateTicker(dt);
    this._updateThoughtBubble();
    this._render();

    this.rafId = requestAnimationFrame((ts) => this._loop(ts));
  }

  // ── Diamond bounds ─────────────────────────────────────────────────

  /**
   * Clamp a point to stay inside the room diamond.
   * Diamond test: |x - cx| / halfW + |y - cy| / halfH <= 1
   * If outside, project back onto the nearest diamond edge.
   */
  _clampToDiamond(x, y) {
    const { cx, cy, halfW, halfH } = ROOM;
    const margin = 10; // keep character a few px inside the edge
    const hw = halfW - margin;
    const hh = halfH - margin;
    const d = Math.abs(x - cx) / hw + Math.abs(y - cy) / hh;
    if (d <= 1) return { x, y };
    // Scale the offset toward center so it lands on the edge
    return { x: cx + (x - cx) / d, y: cy + (y - cy) / d };
  }

  // ── Tweening ───────────────────────────────────────────────────────

  _updateTween() {
    const dx = this.targetX - this.charX;
    const dy = this.targetY - this.charY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const wasMoving = this.isMoving;

    if (dist < this.tweenSpeed) {
      this.charX = this.targetX;
      this.charY = this.targetY;
      this.isMoving = false;
    } else {
      this.charX += (dx / dist) * this.tweenSpeed;
      this.charY += (dy / dist) * this.tweenSpeed;
      this.isMoving = true;

      // Pick walk direction from movement angle (4-way: n, s, se, sw)
      const angle = Math.atan2(dy, dx); // -PI to PI
      if (angle < -Math.PI * 0.6) {
        this.charDirection = 'sw';       // upper-left
      } else if (angle < -Math.PI * 0.1) {
        this.charDirection = 'n';        // upward
      } else if (angle < Math.PI * 0.4) {
        this.charDirection = 'se';       // right / down-right
      } else if (angle < Math.PI * 0.85) {
        this.charDirection = 's';        // downward
      } else {
        this.charDirection = 'sw';       // left
      }
    }

    // Reset animation frame when movement state changes
    if (wasMoving && !this.isMoving) {
      this.animFrame = 0;
      this.animAccum = 0;
    }

    // Keep character inside the diamond
    const clamped = this._clampToDiamond(this.charX, this.charY);
    this.charX = clamped.x;
    this.charY = clamped.y;
  }

  // ── Animation frame advancement ────────────────────────────────────

  _updateAnimation(dt) {
    const variant = this._currentVariant();
    if (!variant || variant.frames.length === 0) return;

    const frameDuration = 1000 / variant.fps;
    this.animAccum += dt;

    while (this.animAccum >= frameDuration) {
      this.animAccum -= frameDuration;

      if (this.oneShotAnim) {
        this.oneShotAnim.frameIdx++;
        this.animFrame = this.oneShotAnim.frameIdx;
        if (this.oneShotAnim.frameIdx >= variant.frames.length) {
          const cb = this.oneShotAnim.onComplete;
          if (this.oneShotPrevEmoji) {
            this.thoughtBubble = { emoji: this.oneShotPrevEmoji, opacity: 1, fadeIn: true };
          }
          this.oneShotAnim = null;
          this.oneShotPrevEmoji = null;
          this.animFrame = 0;
          this.animAccum = 0;
          if (cb) cb();
          return;
        }
      } else {
        this.animFrame++;
        if (this.animFrame >= variant.frames.length) {
          this.animFrame = 0;
          if (Math.random() < 0.3) {
            const state = this.currentState;
            const idx = this._pickVariant(state);
            this.activeVariant.set(state, idx);
            this.lastVariant.set(state, idx);
          }
        }
      }
    }
  }

  _updateTicker(dt) {
    if (!this.tickerMessage) return;

    this.tickerScrollX += this.tickerSpeed * (dt / 1000);

    // When current message has fully scrolled off, load next
    if (this.tickerScrollX > this.tickerWidth + this.tickerPanelWidth) {
      if (this.tickerQueue.length > 0) {
        this.tickerMessage = this.tickerQueue.shift();
      }
      this.tickerScrollX = 0;
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

    // Character sort Y: use a point near the feet (charY is center, +32 toward feet)
    drawables.push({ type: 'character', sortY: this.charY + 32 });

    // Sort by sortY ascending — things higher on screen draw first (behind)
    drawables.sort((a, b) => a.sortY - b.sortY);

    for (const d of drawables) {
      if (d.type === 'furniture') {
        this._drawFurniture(d.f);
      } else {
        this._drawCharacter();
        this._drawThoughtBubble();
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
    ctx.fillStyle = '#d4c4a8';
    ctx.fill();
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wall detail lines (left wall)
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.2)';
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const y1 = top.y - wallH + t * wallH;
      const y2 = left.y - wallH + t * wallH;
      ctx.beginPath();
      ctx.moveTo(top.x, y1);
      ctx.lineTo(left.x, y2);
      ctx.stroke();
    }

    // ── Window on left wall ──
    // The left wall is an isometric parallelogram: top edge slopes down-left,
    // sides go straight down. Window must follow the same geometry.
    // Wall horizontal axis: top→left direction (isometric slant)
    const wallDx = (left.x - top.x);
    const wallDy = (left.y - top.y);
    // Window position: 30%-65% along wall horizontally, 25%-70% up the wall vertically
    const wt0 = 0.30, wt1 = 0.65; // horizontal extent along wall
    const wvTop = 0.70, wvBot = 0.25; // vertical (0=bottom of wall, 1=top)
    // Four corners of the window parallelogram
    // Top-left (closer to top vertex, higher on wall)
    const wTL = { x: top.x + wallDx * wt0, y: (top.y + wallDy * wt0) - wallH * wvTop };
    // Top-right (closer to left vertex, higher on wall)
    const wTR = { x: top.x + wallDx * wt1, y: (top.y + wallDy * wt1) - wallH * wvTop };
    // Bottom-right
    const wBR = { x: top.x + wallDx * wt1, y: (top.y + wallDy * wt1) - wallH * wvBot };
    // Bottom-left
    const wBL = { x: top.x + wallDx * wt0, y: (top.y + wallDy * wt0) - wallH * wvBot };

    // Night sky fill
    ctx.beginPath();
    ctx.moveTo(wTL.x, wTL.y); ctx.lineTo(wTR.x, wTR.y);
    ctx.lineTo(wBR.x, wBR.y); ctx.lineTo(wBL.x, wBL.y);
    ctx.closePath();
    ctx.fillStyle = '#131325';
    ctx.fill();

    // Stars (interpolated within the parallelogram)
    ctx.fillStyle = '#ffffff';
    const stars = [[0.2, 0.2], [0.5, 0.15], [0.8, 0.35], [0.3, 0.6], [0.7, 0.7], [0.15, 0.85], [0.6, 0.45]];
    for (const [u, v] of stars) {
      // Bilinear interpolation within parallelogram
      const px = wTL.x + (wTR.x - wTL.x) * u + (wBL.x - wTL.x) * v;
      const py = wTL.y + (wTR.y - wTL.y) * u + (wBL.y - wTL.y) * v;
      ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
    }

    // Moon (crescent)
    const mU = 0.65, mV = 0.25;
    const moonX = wTL.x + (wTR.x - wTL.x) * mU + (wBL.x - wTL.x) * mV;
    const moonY = wTL.y + (wTR.y - wTL.y) * mU + (wBL.y - wTL.y) * mV;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f0e68c';
    ctx.fill();
    // Crescent cutout
    ctx.beginPath();
    ctx.arc(moonX + 2, moonY - 1, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#131325';
    ctx.fill();

    // Window frame (outer)
    ctx.strokeStyle = '#5a4020';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(wTL.x, wTL.y); ctx.lineTo(wTR.x, wTR.y);
    ctx.lineTo(wBR.x, wBR.y); ctx.lineTo(wBL.x, wBL.y);
    ctx.closePath();
    ctx.stroke();

    // Cross dividers (matching isometric perspective)
    ctx.strokeStyle = '#5a4020';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Vertical divider (midpoint along wall axis)
    const midT = (wTL.x + wTR.x) / 2, midTy = (wTL.y + wTR.y) / 2;
    const midB = (wBL.x + wBR.x) / 2, midBy = (wBL.y + wBR.y) / 2;
    ctx.moveTo(midT, midTy); ctx.lineTo(midB, midBy);
    // Horizontal divider (midpoint vertically)
    const midL = (wTL.x + wBL.x) / 2, midLy = (wTL.y + wBL.y) / 2;
    const midR = (wTR.x + wBR.x) / 2, midRy = (wTR.y + wBR.y) / 2;
    ctx.moveTo(midL, midLy); ctx.lineTo(midR, midRy);
    ctx.stroke();

    // Warm light glow from window onto floor area
    ctx.fillStyle = 'rgba(255, 220, 150, 0.06)';
    ctx.beginPath();
    ctx.moveTo(wBL.x, wBL.y); ctx.lineTo(wBR.x, wBR.y);
    ctx.lineTo(wBR.x - 20, wBR.y + 40); ctx.lineTo(wBL.x - 20, wBL.y + 40);
    ctx.closePath();
    ctx.fill();

    // ── Right wall (back-right edge going up) ──
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(right.x, right.y - wallH);
    ctx.lineTo(top.x, top.y - wallH);
    ctx.closePath();
    ctx.fillStyle = '#c4b494';
    ctx.fill();
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wall detail lines (right wall)
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.2)';
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const y1 = top.y - wallH + t * wallH;
      const y2 = right.y - wallH + t * wallH;
      ctx.beginPath();
      ctx.moveTo(top.x, y1);
      ctx.lineTo(right.x, y2);
      ctx.stroke();
    }

    // ── LED ticker tape on right wall ──
    this._drawTicker();

    // Trim along wall top edges
    ctx.strokeStyle = '#6b5b3e';
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

    // Fill floor with warm base first
    ctx.fillStyle = '#5a4a3a';
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
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid lines on floor for isometric feel
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.12)';
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

  _drawTicker() {
    const ctx = this.ctx;
    const { cx, cy, halfW, halfH, wallH } = ROOM;

    const top   = { x: cx, y: cy - halfH };
    const right = { x: cx + halfW, y: cy };

    // Wall axis direction
    const wallDx = right.x - top.x;  // 200
    const wallDy = right.y - top.y;  // 100
    const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

    // Ticker position on wall: h=horizontal (0-1), v=vertical from top (0-1)
    const h0 = 0.08, h1 = 0.92;
    const vCenter = 0.38;
    const vHalf = 0.05;  // half-height of strip as fraction of wall

    // Four corners of ticker strip parallelogram
    // Point at (h, v): x = top.x + h*wallDx, y = (top.y - wallH) + h*wallDy + v*wallH
    const panelTL = { x: top.x + h0 * wallDx, y: (top.y - wallH) + h0 * wallDy + (vCenter - vHalf) * wallH };
    const panelTR = { x: top.x + h1 * wallDx, y: (top.y - wallH) + h1 * wallDy + (vCenter - vHalf) * wallH };
    const panelBR = { x: top.x + h1 * wallDx, y: (top.y - wallH) + h1 * wallDy + (vCenter + vHalf) * wallH };
    const panelBL = { x: top.x + h0 * wallDx, y: (top.y - wallH) + h0 * wallDy + (vCenter + vHalf) * wallH };

    // Draw dark panel background
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(panelTL.x, panelTL.y);
    ctx.lineTo(panelTR.x, panelTR.y);
    ctx.lineTo(panelBR.x, panelBR.y);
    ctx.lineTo(panelBL.x, panelBL.y);
    ctx.closePath();

    ctx.fillStyle = '#0a0a14';
    ctx.fill();
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Subtle top bevel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(panelTL.x, panelTL.y);
    ctx.lineTo(panelTR.x, panelTR.y);
    ctx.stroke();

    // Clip to panel
    ctx.beginPath();
    ctx.moveTo(panelTL.x, panelTL.y);
    ctx.lineTo(panelTR.x, panelTR.y);
    ctx.lineTo(panelBR.x, panelBR.y);
    ctx.lineTo(panelBL.x, panelBL.y);
    ctx.closePath();
    ctx.clip();

    // Isometric transform: text x-axis follows wall direction
    const ux = wallDx / wallLen;
    const uy = wallDy / wallLen;

    // Origin: left edge of panel, vertically centered
    const originX = panelTL.x;
    const originY = (panelTL.y + panelBL.y) / 2;

    ctx.setTransform(ux, uy, 0, 1, originX, originY);

    // LED text style
    ctx.font = 'bold 9px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff8c00';

    // Glow
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 4;

    // Measure and store for scroll logic
    const textWidth = ctx.measureText(this.tickerMessage).width;
    this.tickerWidth = textWidth;
    const panelW = (h1 - h0) * wallLen;
    this.tickerPanelWidth = panelW;

    // Text enters from right, scrolls left
    const textX = panelW - this.tickerScrollX;
    ctx.fillText(this.tickerMessage, textX, 0);

    ctx.restore();
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
      // Fallback static sprites: map n/s to sw/se
      const staticDir = (this.charDirection === 'n' || this.charDirection === 'sw') ? 'sw' : 'se';
      img = this.images.get(`clawd-${staticDir}`);
    }

    if (img) {
      // Center the 96×96 sprite on the character position
      this.ctx.drawImage(img, this.charX - 48, this.charY - 48);
    }
  }
}

export { SceneEngine, STATIONS, SCENE_SIZE };
