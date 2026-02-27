# Steampunk CLAWD Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace CLAWD's 32×32 hex-array sprite system with a 96×96 PNG-based steampunk mech-crab in an isometric workshop, featuring station-based animations, persistent smoke effects, mood particles, and autonomous idle behavior.

**Architecture:** Layered scene renderer (floor → walls → furniture → character → effects) on a 480×480 canvas. Character moves between stations via position tweening. Smoke and mood effects run as independent particle systems on the top layer. All sprites are PNG assets generated via PixelLab MCP and loaded at runtime.

**Tech Stack:** Electron (existing), PixelLab MCP (asset generation), Canvas 2D API (rendering), PNG sprite sheets (assets)

---

## Task 1: Generate Character Assets via PixelLab

**Files:**
- Create: `assets/sprites/` directory

**Step 1: Create the steampunk crab character**

Use PixelLab MCP `create_character`:
- Description: "steampunk mechanical crab with rust-orange armored shell, gold rivets and brass trim, glowing red eye visor, steam chimney pipe on top, metallic silver-tipped claws, gold mechanical joints, copper plating"
- body_type: "humanoid" (closest available — crab shape will be approximated)
- size: 96
- n_directions: 4 (we need south-west and south-east)
- view: "low top-down" (isometric perspective)
- detail: "high detail"
- shading: "detailed shading"
- outline: "selective outline"
- proportions: `{"type": "preset", "name": "chibi"}` (compact body suits a crab)

**Step 2: Poll for completion**

Use `get_character` with the returned character_id. Check every 60s until status is "completed". Save the character_id for animation generation.

**Step 3: Generate walking animation**

Use `animate_character`:
- character_id: from step 1
- template_animation_id: "walking"
- action_description: "mechanical crab walking with clanking legs"

**Step 4: Generate idle animations**

Use `animate_character` for each:
1. template_animation_id: "breathing-idle", action_description: "mechanical crab idling, steam puffing gently, looking around"
2. template_animation_id: "crouching", action_description: "mechanical crab sleeping, powered down, dim eye"

**Step 5: Generate activity animations**

Use `animate_character` for each:
1. template_animation_id: "pushing", action_description: "mechanical crab pressing buttons and pulling levers"
2. template_animation_id: "picking-up", action_description: "mechanical crab picking up and reading a book"
3. template_animation_id: "drinking", action_description: "mechanical crab sitting attentively, listening"

**Step 6: Download all assets**

Use `get_character` with include_preview=true. Download the ZIP file. Extract sprite sheets into `assets/sprites/`:
- `clawd-sw.png` — south-west facing base
- `clawd-se.png` — south-east facing base
- `clawd-walk-sw.png` / `clawd-walk-se.png` — walking sprite sheets
- `clawd-idle-*.png` — idle animation sheets
- `clawd-activity-*.png` — activity animation sheets

**Step 7: Verify assets**

Open each PNG manually to confirm the steampunk crab looks reasonable. If any look bad, regenerate with adjusted descriptions.

**Step 8: Commit**

```bash
git add assets/sprites/
git commit -m "assets: add steampunk CLAWD character sprites from PixelLab"
```

---

## Task 2: Generate Scene Assets via PixelLab

**Files:**
- Create: `assets/scene/` directory

**Step 1: Generate isometric floor tile**

Use `create_isometric_tile`:
- description: "steampunk workshop wooden floor with brass rivets and iron grating"
- size: 64
- tile_shape: "thin tile"
- detail: "medium detail"
- shading: "medium shading"

**Step 2: Generate furniture map objects**

Use `create_map_object` for each station (all at view: "low top-down"):

1. Workbench: "steampunk workbench with brass typewriter, gears, and tools, isometric pixel art"
   - width: 128, height: 96
2. Bookshelf: "tall steampunk bookshelf with leather-bound books, brass magnifying glass, isometric pixel art"
   - width: 96, height: 128
3. Terminal: "steampunk terminal console with pressure gauges, levers, and a glowing screen, isometric pixel art"
   - width: 96, height: 112
4. Armchair: "steampunk leather armchair with brass frame and pipe rest, isometric pixel art"
   - width: 80, height: 80
5. Stool: "small steampunk brass stool with leather seat, isometric pixel art"
   - width: 48, height: 48
6. Hammock: "steampunk hammock made of chain links between two brass posts, isometric pixel art"
   - width: 112, height: 64

**Step 3: Generate wall/background**

Use `create_map_object`:
- description: "steampunk workshop wall with copper pipes, gears, steam vents, and brass fittings, isometric back wall"
- width: 480, height: 240
- view: "low top-down"

**Step 4: Download all scene assets**

Poll each with `get_map_object` / `get_isometric_tile`. Save to `assets/scene/`:
- `floor-tile.png`
- `workbench.png`, `bookshelf.png`, `terminal.png`, `armchair.png`, `stool.png`, `hammock.png`
- `wall-background.png`

**Step 5: Commit**

```bash
git add assets/scene/
git commit -m "assets: add steampunk workshop scene furniture and tiles from PixelLab"
```

---

## Task 3: Build Scene Engine Core

**Files:**
- Create: `src/scene-engine.js`

**Step 1: Create the scene engine with layer rendering**

```javascript
// src/scene-engine.js
// Layered isometric scene renderer for steampunk workshop

const SCENE_SIZE = 480;

// Station positions (x, y) in scene coordinates
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
    this.scale = 1;
    this.showRoom = true;

    // Character state
    this.currentState = 'idle';
    this.targetPos = { ...STATIONS.idle };
    this.currentPos = { ...STATIONS.idle };
    this.direction = 'se';
    this.isMoving = false;
    this.moveSpeed = 3; // pixels per frame

    // Animation state
    this.currentAnim = null;
    this.currentFrame = 0;
    this.animTimer = null;
    this.animPool = {};     // state -> [animation variants]
    this.lastVariant = {};  // state -> last picked index (avoid repeats)

    // Layers
    this.images = {};       // name -> HTMLImageElement
    this.furniture = [];    // { name, img, x, y, zIndex }

    // Effects (smoke, mood) managed externally, drawn via callback
    this.onRenderEffects = null;
    this.onStateChange = null;

    // Idle behavior
    this.idlePool = [];
    this.idleTimer = null;

    this._resize();
  }

  // --- Asset Loading ---

  async loadImage(name, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this.images[name] = img; resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  addFurniture(name, x, y, zIndex) {
    const img = this.images[name];
    if (img) this.furniture.push({ name, img, x, y, zIndex });
    this.furniture.sort((a, b) => a.zIndex - b.zIndex);
  }

  registerAnimations(state, variants) {
    // variants: [{ frames: [Image], fps: number }]
    this.animPool[state] = variants;
  }

  // --- State Management ---

  setState(state) {
    if (!STATIONS[state]) return;
    const prev = this.currentState;
    this.currentState = state;
    this.targetPos = { ...STATIONS[state] };
    this.direction = STATIONS[state].direction;
    this.isMoving = true;

    // Pick random animation variant (avoid last)
    this._pickVariant(state);

    if (this.onStateChange && prev !== state) {
      this.onStateChange(state);
    }
  }

  setShowRoom(show) {
    this.showRoom = show;
  }

  setScale(factor) {
    this.scale = factor;
    this._resize();
  }

  _resize() {
    const size = Math.round(SCENE_SIZE * this.scale);
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx.imageSmoothingEnabled = false;
  }

  _pickVariant(state) {
    const pool = this.animPool[state];
    if (!pool || pool.length === 0) return;
    let idx = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && idx === this.lastVariant[state]) {
      idx = (idx + 1) % pool.length;
    }
    this.lastVariant[state] = idx;
    this.currentAnim = pool[idx];
    this.currentFrame = 0;
    this._restartAnimTimer();
  }

  // --- Animation Loop ---

  start() {
    this._startRenderLoop();
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this.animTimer) clearInterval(this.animTimer);
  }

  _startRenderLoop() {
    const loop = () => {
      this._update();
      this._render();
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  _restartAnimTimer() {
    if (this.animTimer) clearInterval(this.animTimer);
    if (!this.currentAnim) return;
    const interval = 1000 / this.currentAnim.fps;
    this.animTimer = setInterval(() => {
      this.currentFrame++;
      if (this.currentFrame >= this.currentAnim.frames.length) {
        this.currentFrame = 0;
        // 30% chance to swap variant on loop
        if (Math.random() < 0.3) {
          this._pickVariant(this.currentState);
        }
      }
    }, interval);
  }

  // --- Movement ---

  _update() {
    if (!this.isMoving) return;
    const dx = this.targetPos.x - this.currentPos.x;
    const dy = this.targetPos.y - this.currentPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.moveSpeed) {
      this.currentPos.x = this.targetPos.x;
      this.currentPos.y = this.targetPos.y;
      this.isMoving = false;
    } else {
      this.currentPos.x += (dx / dist) * this.moveSpeed;
      this.currentPos.y += (dy / dist) * this.moveSpeed;
      // Face direction of movement
      this.direction = dx > 0 ? 'se' : 'sw';
    }
  }

  // --- Rendering ---

  _render() {
    const s = this.scale;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Layer 0-1: Background (floor + walls)
    if (this.showRoom) {
      if (this.images['floor']) {
        // Tile the floor
        const floorImg = this.images['floor'];
        const tw = floorImg.width * s;
        const th = floorImg.height * s;
        for (let y = SCENE_SIZE * s * 0.4; y < SCENE_SIZE * s; y += th) {
          for (let x = 0; x < SCENE_SIZE * s; x += tw) {
            ctx.drawImage(floorImg, x, y, tw, th);
          }
        }
      }
      if (this.images['wall']) {
        const wallImg = this.images['wall'];
        ctx.drawImage(wallImg, 0, 0, SCENE_SIZE * s, SCENE_SIZE * s * 0.5);
      }
    }

    // Layer 2: Furniture behind character
    const charY = this.currentPos.y * s;
    for (const f of this.furniture) {
      if (f.zIndex < 0 || f.y * s < charY) {
        ctx.drawImage(f.img, f.x * s, f.y * s, f.img.width * s, f.img.height * s);
      }
    }

    // Layer 3: Character
    if (this.currentAnim && this.currentAnim.frames.length > 0) {
      const frame = this.currentAnim.frames[this.currentFrame % this.currentAnim.frames.length];
      const dirKey = `clawd-${this.direction}`;
      const charImg = frame || this.images[dirKey];
      if (charImg) {
        const cx = this.currentPos.x * s - (96 * s / 2);
        const cy = this.currentPos.y * s - (96 * s / 2);
        ctx.drawImage(charImg, cx, cy, 96 * s, 96 * s);
      }
    }

    // Layer 4: Furniture in front of character
    for (const f of this.furniture) {
      if (f.zIndex >= 0 && f.y * s >= charY) {
        ctx.drawImage(f.img, f.x * s, f.y * s, f.img.width * s, f.img.height * s);
      }
    }

    // Layer 5: Effects (smoke, mood)
    if (this.onRenderEffects) {
      this.onRenderEffects(ctx, this.currentPos, s);
    }
  }
}

export { SceneEngine, STATIONS, SCENE_SIZE };
```

**Step 2: Run `npm start` to verify no import errors**

The engine won't render anything yet (no assets loaded) but should not crash.

**Step 3: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: add SceneEngine with layered rendering and station movement"
```

---

## Task 4: Build Smoke Effect System

**Files:**
- Create: `src/smoke-effect.js`

**Step 1: Create the smoke particle system**

```javascript
// src/smoke-effect.js
// Persistent chimney smoke effect — runs independently of character state

class SmokeEffect {
  constructor() {
    this.particles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 8;   // frames between spawns
    this.maxParticles = 15;
    this.intensity = 1.0;     // 1.0 = normal, 2.0 = frustrated, 0.3 = sleepy
  }

  setIntensity(val) {
    this.intensity = Math.max(0.1, Math.min(3.0, val));
    this.spawnInterval = Math.round(8 / this.intensity);
  }

  update(charX, charY) {
    // Spawn new particle from chimney position (offset above character center)
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval && this.particles.length < this.maxParticles) {
      this.spawnTimer = 0;
      this.particles.push({
        x: charX + (Math.random() - 0.5) * 4,
        y: charY - 48,  // chimney top offset
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.8 - Math.random() * 0.4,
        size: 3 + Math.random() * 4,
        alpha: 0.6 + Math.random() * 0.3,
        life: 0,
        maxLife: 40 + Math.random() * 20,
      });
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx += (Math.random() - 0.5) * 0.1; // drift
      p.size += 0.15;
      p.life++;
      p.alpha = Math.max(0, p.alpha - (0.6 / p.maxLife));
      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, scale) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#c8c0b0';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, p.size * scale, 0, Math.PI * 2);
      ctx.fill();
      // Inner lighter puff
      ctx.globalAlpha = p.alpha * 0.5;
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, p.size * scale * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export { SmokeEffect };
```

**Step 2: Commit**

```bash
git add src/smoke-effect.js
git commit -m "feat: add SmokeEffect particle system for chimney smoke"
```

---

## Task 5: Build Mood Effects System

**Files:**
- Create: `src/mood-effects.js`

**Step 1: Create the mood particle system**

```javascript
// src/mood-effects.js
// Mood-reactive particle effects (sparks, gears, zzz, steam bursts)

const MOOD_CONFIGS = {
  frustrated: {
    color: '#ff4422',
    secondary: '#cc3311',
    symbol: 'burst',
    spawnRate: 4,
    maxParticles: 12,
  },
  celebrating: {
    color: '#ffd700',
    secondary: '#ffaa00',
    symbol: 'spark',
    spawnRate: 3,
    maxParticles: 20,
  },
  confused: {
    color: '#aa88ff',
    secondary: '#8866dd',
    symbol: 'question',
    spawnRate: 10,
    maxParticles: 5,
  },
  excited: {
    color: '#ff8800',
    secondary: '#ffaa44',
    symbol: 'spark',
    spawnRate: 4,
    maxParticles: 15,
  },
  sleepy: {
    color: '#8888aa',
    secondary: '#aaaacc',
    symbol: 'zzz',
    spawnRate: 20,
    maxParticles: 4,
  },
};

class MoodEffects {
  constructor() {
    this.particles = [];
    this.currentMood = null;
    this.spawnTimer = 0;
    this.config = null;
  }

  setMood(mood) {
    this.currentMood = mood;
    this.config = MOOD_CONFIGS[mood] || null;
    if (!mood) this.particles = [];
    this.spawnTimer = 0;
  }

  update(charX, charY) {
    if (!this.config) return;

    this.spawnTimer++;
    if (this.spawnTimer >= this.config.spawnRate && this.particles.length < this.config.maxParticles) {
      this.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      this.particles.push({
        x: charX + (Math.random() - 0.5) * 40,
        y: charY - 20 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: -1 - Math.random() * speed,
        size: 2 + Math.random() * 3,
        alpha: 0.8,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        symbol: this.config.symbol,
        color: Math.random() > 0.5 ? this.config.color : this.config.secondary,
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.symbol === 'zzz') {
        p.vy = -0.3;
        p.vx = Math.sin(p.life * 0.1) * 0.3;
        p.size += 0.05;
      }
      p.life++;
      p.alpha = Math.max(0, 0.8 * (1 - p.life / p.maxLife));
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, scale) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.symbol === 'zzz') {
        ctx.font = `${Math.round(10 * scale)}px monospace`;
        ctx.fillText('z', p.x * scale, p.y * scale);
      } else if (p.symbol === 'question') {
        ctx.font = `${Math.round(8 * scale)}px monospace`;
        ctx.fillText('?', p.x * scale, p.y * scale);
      } else if (p.symbol === 'spark') {
        // Small diamond shape
        const s = p.size * scale;
        ctx.beginPath();
        ctx.moveTo(p.x * scale, (p.y - p.size) * scale);
        ctx.lineTo((p.x + p.size) * scale, p.y * scale);
        ctx.lineTo(p.x * scale, (p.y + p.size) * scale);
        ctx.lineTo((p.x - p.size) * scale, p.y * scale);
        ctx.closePath();
        ctx.fill();
      } else {
        // burst: small circles
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

export { MoodEffects };
```

**Step 2: Commit**

```bash
git add src/mood-effects.js
git commit -m "feat: add MoodEffects particle system for mood expressions"
```

---

## Task 6: Update Main Process

**Files:**
- Modify: `main.js`

**Step 1: Update window size from 160 to 480 base**

In `main.js`, change the window creation to use 480 as the base size:
- Lines 30-31: `Math.round(480 * prefs.scale)` instead of `Math.round(160 * prefs.scale)`
- Line 36-37: Position calculation using new size
- Add `showRoom` to default prefs (line 13)

**Step 2: Update set-scale IPC handler**

Line 119: Change `Math.round(160 * scale)` to `Math.round(480 * scale)` in both width and height.

**Step 3: Add show-room IPC handler**

```javascript
ipcMain.handle('set-show-room', (_, show) => {
  prefs.showRoom = show;
  savePrefs(prefs);
  mainWindow.webContents.send('show-room-changed', show);
});
```

**Step 4: Add showRoom to default prefs**

In `loadPrefs()` defaults, add `showRoom: true`.

**Step 5: Run `npm start` to verify window opens at new size**

Expected: larger window, content may be blank since engine isn't wired yet.

**Step 6: Commit**

```bash
git add main.js
git commit -m "feat: update window size to 480px base, add showRoom preference"
```

---

## Task 7: Update Preload Bridge

**Files:**
- Modify: `preload.js`

**Step 1: Add new IPC channels**

Add to the `window.claude` API:
```javascript
setShowRoom: (show) => ipcRenderer.invoke('set-show-room', show),
onShowRoomChanged: (callback) => {
  ipcRenderer.removeAllListeners('show-room-changed');
  ipcRenderer.on('show-room-changed', (_, show) => callback(show));
},
```

**Step 2: Commit**

```bash
git add preload.js
git commit -m "feat: add showRoom IPC channels to preload bridge"
```

---

## Task 8: Update Renderer & Wire Everything Together

**Files:**
- Modify: `src/renderer.js`
- Modify: `src/index.html`

**Step 1: Update index.html canvas size**

Change `<canvas id="buddy" width="480" height="480"></canvas>` (from 128×128).

**Step 2: Rewrite renderer.js to use SceneEngine**

Replace the AnimationEngine import and setup with SceneEngine. Key changes:
- Import `SceneEngine` instead of `AnimationEngine`
- Import `SmokeEffect` and `MoodEffects`
- On init: load all PNG assets via `engine.loadImage()`, register furniture positions, register animation pools
- Wire `onStateChange` IPC to `engine.setState()`
- Wire `onMoodChange` IPC to `moodEffects.setMood()` and smoke intensity
- Wire `onRenderEffects` callback to update and render smoke + mood particles
- Update scale handler: `engine.setScale(scale)` (no more `Math.round(4 * scale)`)
- Context menu: add "Show Room" toggle, keep existing scale/volume/mute/about/close
- Scroll resize: same logic but adjusted for new scale range

**Step 3: Create asset manifest**

Create a simple manifest object in renderer.js that lists all PNG paths to load:
```javascript
const ASSETS = {
  'clawd-sw': './sprites/clawd-sw.png',
  'clawd-se': './sprites/clawd-se.png',
  'floor': './scene/floor-tile.png',
  'wall': './scene/wall-background.png',
  'workbench': './scene/workbench.png',
  'bookshelf': './scene/bookshelf.png',
  'terminal': './scene/terminal.png',
  'armchair': './scene/armchair.png',
  'stool': './scene/stool.png',
  'hammock': './scene/hammock.png',
  // Animation sprite sheets loaded separately
};
```

**Step 4: Wire effects rendering**

```javascript
const smoke = new SmokeEffect();
const moodFx = new MoodEffects();

engine.onRenderEffects = (ctx, charPos, scale) => {
  smoke.update(charPos.x, charPos.y);
  smoke.render(ctx, scale);
  moodFx.update(charPos.x, charPos.y);
  moodFx.render(ctx, scale);
};
```

**Step 5: Run `npm start` to verify**

Expected: Window opens at 480px, scene renders with background (if assets present) or blank canvas (if assets pending). No crashes.

**Step 6: Commit**

```bash
git add src/renderer.js src/index.html
git commit -m "feat: wire SceneEngine, SmokeEffect, and MoodEffects into renderer"
```

---

## Task 9: Add Background Toggle to Context Menu

**Files:**
- Modify: `src/renderer.js` (context menu section)
- Modify: `src/styles.css` (if needed)

**Step 1: Add "Show Room" checkbox to context menu**

In the context menu HTML generation, add after the always-on-top toggle:
```html
<div class="ctx-item" data-action="toggle-room">
  Room Background: <span id="room-status">${prefs.showRoom ? 'ON' : 'OFF'}</span>
</div>
```

**Step 2: Handle the toggle action**

```javascript
case 'toggle-room':
  prefs.showRoom = !prefs.showRoom;
  engine.setShowRoom(prefs.showRoom);
  window.claude.setShowRoom(prefs.showRoom);
  break;
```

**Step 3: Run `npm start`, right-click, verify toggle**

Expected: "Room Background: ON/OFF" appears in context menu. Clicking toggles background layers.

**Step 4: Commit**

```bash
git add src/renderer.js
git commit -m "feat: add Show Room toggle to context menu"
```

---

## Task 10: Clean Up Old Animation System

**Files:**
- Delete: `src/animation-engine.js`
- Delete: `src/animations/idle.js`
- Delete: `src/animations/thinking.js`
- Delete: `src/animations/coding.js`
- Delete: `src/animations/researching.js`
- Delete: `src/animations/bash.js`
- Delete: `src/animations/listening.js`
- Delete: `src/sprites/palette.js`
- Delete: `src/sprites/mood-overlays.js`

**Step 1: Delete old files**

```bash
rm src/animation-engine.js
rm src/animations/*.js
rm src/sprites/palette.js src/sprites/mood-overlays.js
rmdir src/animations src/sprites
```

**Step 2: Run `npm start` to verify nothing breaks**

Expected: App runs with new SceneEngine, no references to deleted files.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old 32x32 hex-array animation system"
```

---

## Task 11: Integration Testing & Polish

**Files:**
- Possibly modify: `src/scene-engine.js`, `src/renderer.js`, `src/smoke-effect.js`

**Step 1: Full integration test**

Run `npm start` and verify:
- [ ] Window opens at 480×480 (or scaled)
- [ ] Steampunk office background visible
- [ ] CLAWD the crab renders at a station
- [ ] Smoke chimney animates continuously
- [ ] Right-click menu works (all options)
- [ ] Drag to move window works
- [ ] Scroll to resize works
- [ ] "Show Room" toggle hides/shows background
- [ ] Sound effects still play

**Step 2: Test state transitions**

Start a Claude Code session alongside the app and verify:
- [ ] Read/Grep/Glob → crab walks to bookshelf (researching)
- [ ] Edit/Write → crab walks to workbench (coding)
- [ ] Bash → crab walks to terminal
- [ ] Task → crab walks to armchair (thinking)
- [ ] AskUserQuestion → crab goes to stool (listening)
- [ ] 10s idle → crab picks random idle animation
- [ ] 30s disconnect → crab favors sleep animations
- [ ] Animation variants cycle (not always same loop)

**Step 3: Test mood effects**

Verify mood particles appear:
- [ ] Frustrated → red bursts, faster smoke
- [ ] Celebrating → gold sparks
- [ ] Confused → purple question marks
- [ ] Excited → orange sparks
- [ ] Sleepy → floating zzz, slow smoke

**Step 4: Tune station positions**

Adjust `STATIONS` coordinates in `scene-engine.js` so the crab lines up properly with furniture. This is visual tuning — run the app, check positioning, adjust numbers, repeat.

**Step 5: Tune movement speed**

Adjust `moveSpeed` in scene-engine.js so walking between stations looks natural (not too fast, not too slow).

**Step 6: Final commit**

```bash
git add -A
git commit -m "polish: tune station positions, movement speed, and integration"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Generate character assets via PixelLab | None |
| 2 | Generate scene assets via PixelLab | None |
| 3 | Build SceneEngine core | None |
| 4 | Build SmokeEffect system | None |
| 5 | Build MoodEffects system | None |
| 6 | Update main.js (window size, prefs) | None |
| 7 | Update preload.js (IPC channels) | None |
| 8 | Wire everything in renderer.js | 1, 2, 3, 4, 5, 6, 7 |
| 9 | Add background toggle to context menu | 8 |
| 10 | Clean up old animation system | 8 |
| 11 | Integration testing & polish | 9, 10 |

**Tasks 1-7 can be executed in parallel.** Task 8 integrates everything. Tasks 9-11 are sequential.
