# LED Ticker Tape Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a retro LED dot-matrix ticker tape display on the right wall that scrolls funny state-specific messages.

**Architecture:** All ticker logic lives in `src/scene-engine.js` — message pools as a static constant, ticker state (scroll position, current message, queue) as instance properties, rendering via a new `_drawTicker()` method called during `_drawProceduralRoom()` after the right wall is drawn. The ticker uses `ctx.setTransform()` to align text to the right wall's isometric angle, with clipping to keep text inside the panel bounds.

**Tech Stack:** Canvas 2D API (setTransform for isometric skew, clip for bounds, shadowBlur for LED glow)

---

### Task 1: Add ticker message pools

**Files:**
- Modify: `src/scene-engine.js`

**Step 1: Add static TICKER_MESSAGES constant after MOOD_EMOJIS (line ~318)**

```javascript
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
```

**Step 2: Add ticker state properties in the constructor (after `this.inFlow` around line 116)**

```javascript
// LED ticker tape
this.tickerMessage = '';        // current scrolling message
this.tickerScrollX = 0;        // current scroll position (pixels)
this.tickerQueue = [];          // upcoming messages
this.tickerUsed = new Map();    // track used messages per state to avoid repeats
this.tickerSpeed = 35;          // pixels per second
this.tickerWidth = 0;           // calculated text width (set during render)
this.tickerPanelWidth = 160;    // visual width of the ticker strip along the wall axis
```

**Step 3: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: add ticker message pools and state properties"
```

---

### Task 2: Add ticker message selection logic

**Files:**
- Modify: `src/scene-engine.js`

**Step 1: Add `_pickTickerMessage(state)` method after the `setFlow` method (~line 478)**

This picks a random message for the given state, avoiding repeats until the pool is exhausted:

```javascript
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
```

**Step 2: Hook into `setState()` — after the `this.currentState = state` line (around line 428), queue a new ticker message**

Add this after `this._showThoughtBubble(state);` (line 433):

```javascript
// Queue ticker message for new state
this.tickerQueue.push(this._pickTickerMessage(state));
```

**Step 3: Initialize ticker with idle message — at the end of the constructor, after `this._applyScale();` (line 123)**

```javascript
// Start ticker with idle message
this.tickerMessage = this._pickTickerMessage('idle');
this.tickerScrollX = 0;
```

**Step 4: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: add ticker message selection with no-repeat logic"
```

---

### Task 3: Add ticker scroll update logic

**Files:**
- Modify: `src/scene-engine.js`

**Step 1: Add `_updateTicker(dt)` method near the other update methods**

```javascript
_updateTicker(dt) {
  if (!this.tickerMessage) return;

  // Scroll left (increase scrollX, text moves left)
  this.tickerScrollX += this.tickerSpeed * (dt / 1000);

  // When current message has fully scrolled off the left edge, load next
  if (this.tickerScrollX > this.tickerWidth + this.tickerPanelWidth) {
    if (this.tickerQueue.length > 0) {
      this.tickerMessage = this.tickerQueue.shift();
    }
    // Reset scroll — text enters from the right
    this.tickerScrollX = 0;
  }
}
```

**Step 2: Call `_updateTicker(dt)` in the `_loop` method (line 576, after `_updateAnimation(dt)`)**

```javascript
this._updateTicker(dt);
```

**Step 3: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: add ticker scroll update logic"
```

---

### Task 4: Draw the LED ticker on the right wall

This is the main rendering task. The ticker is drawn as part of `_drawProceduralRoom()`, after the right wall fill but before the floor.

**Files:**
- Modify: `src/scene-engine.js`

**Step 1: Add `_drawTicker()` method**

The right wall goes from `top` (240,170) to `right` (440,270). The wall rises `wallH=130` pixels vertically. The wall's horizontal axis direction is `(200, 100)` — standard 2:1 isometric.

The ticker strip is positioned at about 55-65% from the bottom of the wall (so it's in the upper portion, visible above furniture).

```javascript
_drawTicker() {
  const ctx = this.ctx;
  const { cx, cy, halfW, halfH, wallH } = ROOM;

  const top   = { x: cx, y: cy - halfH };
  const right = { x: cx + halfW, y: cy };

  // Wall axis direction (isometric: dx=200, dy=100 for full wall width)
  const wallDx = right.x - top.x;  // 200
  const wallDy = right.y - top.y;  // 100
  const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy); // ~223.6

  // Ticker strip position on the wall
  // h = position along wall horizontal axis (0=left/top vertex, 1=right vertex)
  // v = position along wall vertical axis (0=top of wall, 1=bottom/floor)
  const h0 = 0.08, h1 = 0.92;  // horizontal extent (most of the wall)
  const vCenter = 0.38;         // vertical center (38% from top = upper area)
  const stripHeight = 14;       // pixel height of the ticker panel

  // Calculate the four corners of the ticker strip parallelogram
  // Wall top-left: (top.x, top.y - wallH), Wall top-right: (right.x, right.y - wallH)
  // Wall bot-left: (top.x, top.y), Wall bot-right: (right.x, right.y)
  // Point on wall at (h, v): x = topX + h*wallDx, y = (topY - wallH) + h*wallDy + v*wallH

  const panelLeft  = top.x + h0 * wallDx;
  const panelRight = top.x + h1 * wallDx;
  const panelTopY  = (top.y - wallH) + h0 * wallDy + (vCenter - 0.04) * wallH;
  const panelBotY  = (top.y - wallH) + h0 * wallDy + (vCenter + 0.04) * wallH;
  const panelTopYR = (top.y - wallH) + h1 * wallDy + (vCenter - 0.04) * wallH;
  const panelBotYR = (top.y - wallH) + h1 * wallDy + (vCenter + 0.04) * wallH;

  // Draw dark panel background
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(panelLeft, panelTopY);
  ctx.lineTo(panelRight, panelTopYR);
  ctx.lineTo(panelRight, panelBotYR);
  ctx.lineTo(panelLeft, panelBotY);
  ctx.closePath();

  ctx.fillStyle = '#0a0a14';
  ctx.fill();
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Clip to panel bounds
  ctx.clip();

  // Set up isometric transform for text along the wall axis
  // We want text x-axis to follow the wall direction (1, 0.5) normalized
  const ux = wallDx / wallLen;  // unit x along wall
  const uy = wallDy / wallLen;  // unit y along wall

  // Text origin: panel left edge, vertically centered
  const originX = panelLeft;
  const originY = (panelTopY + panelBotY) / 2;

  // Transform: x-axis along wall, y-axis perpendicular (straight down)
  ctx.setTransform(ux, uy, 0, 1, originX, originY);

  // LED text style
  ctx.font = 'bold 9px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff8c00';  // amber LED

  // Glow effect
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 4;

  // Measure text for scroll calculation
  const textWidth = ctx.measureText(this.tickerMessage).width;
  this.tickerWidth = textWidth;

  // The panel width in the transformed coordinate space
  const panelW = (h1 - h0) * wallLen;
  this.tickerPanelWidth = panelW;

  // Draw scrolling text: starts at right edge (panelW), scrolls left
  const textX = panelW - this.tickerScrollX;
  ctx.fillText(this.tickerMessage, textX, 0);

  ctx.restore();
}
```

**Step 2: Call `_drawTicker()` in `_drawProceduralRoom()` — after the right wall detail lines (line ~896) but before the wall top trim (line ~898)**

Insert between the right wall detail lines loop and the "Trim along wall top edges" comment:

```javascript
// ── LED ticker tape on right wall ──
this._drawTicker();
```

**Step 3: Run `npm start` and verify**

Expected: A dark strip on the right wall with amber text scrolling from right to left along the isometric angle. The text should be "ZZZ" or another idle message initially, and change when Claude Code activity is detected.

**Step 4: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: draw LED ticker tape on right wall with isometric transform"
```

---

### Task 5: Fine-tune visual appearance

**Files:**
- Modify: `src/scene-engine.js`

**Step 1: Run `npm start` and evaluate the ticker visually**

Check for:
- Text alignment with the wall angle — should follow the isometric slant perfectly
- Panel position — should be in the upper portion of the right wall, not obscured by furniture
- Text readability — font size, glow intensity, color contrast
- Scroll speed — should be readable but not too slow
- Panel size — should span most of the wall width

**Step 2: Adjust values as needed**

Likely tuning candidates:
- `vCenter` (vertical position on wall) — move up/down if furniture obscures it
- `stripHeight` and `vCenter ± offset` — adjust panel thickness
- `this.tickerSpeed` — adjust scroll speed (lower = slower, more readable)
- `ctx.font` size — try 8px or 10px if 9px doesn't look right
- `ctx.shadowBlur` — increase for more glow, decrease if too blurry
- LED color — try `#00ff88` (green) or `#ff4444` (red) for different vibes

**Step 3: Add subtle panel border/bevel for depth**

After the panel fill, optionally add a slight highlight on the top edge and shadow on the bottom to give it a 3D mounted look:

```javascript
// Subtle bevel on panel
ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
ctx.lineWidth = 0.5;
ctx.beginPath();
ctx.moveTo(panelLeft, panelTopY);
ctx.lineTo(panelRight, panelTopYR);
ctx.stroke();
```

**Step 4: Commit**

```bash
git add src/scene-engine.js
git commit -m "fix: tune LED ticker visual appearance and positioning"
```

---

### Task 6: Handle edge cases and demo mode

**Files:**
- Modify: `src/scene-engine.js`

**Step 1: Ensure ticker works in demo mode**

The demo mode (press `D`) cycles through states. Since ticker messages are queued in `setState()`, this should work automatically. Verify by pressing D and watching the ticker update.

**Step 2: Handle rapid state changes**

If states change faster than messages scroll, the queue could grow. Cap the queue:

In `setState()`, where we push to `tickerQueue`, add a cap:

```javascript
// Queue ticker message for new state
this.tickerQueue.push(this._pickTickerMessage(state));
// Cap queue to prevent buildup during rapid state changes
if (this.tickerQueue.length > 3) {
  this.tickerQueue = this.tickerQueue.slice(-2);
}
```

**Step 3: Handle room visibility**

The ticker is drawn inside `_drawProceduralRoom()` which is only called when `this.showRoom` is true. This means the ticker automatically hides when the room is hidden. No extra work needed.

**Step 4: Commit**

```bash
git add src/scene-engine.js
git commit -m "fix: cap ticker queue for rapid state changes"
```

---

### Task 7: Update CLAUDE.md documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add ticker to the Reactive Features table**

Add a row:
```
| **LED Ticker** | State changes | Scrolling dot-matrix text on right wall with funny messages | — |
```

**Step 2: Add brief ticker section to Scene System description**

Under the "Scene System (Isometric Room)" section, add:
```
- **LED ticker tape** on the right wall — retro dot-matrix display scrolling funny state-specific messages (e.g., coding → "HACKING THE MAINFRAME", researching → "PONTIFICATING"). Uses `ctx.setTransform()` to align text to the isometric wall angle.
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add LED ticker tape feature to CLAUDE.md"
```
