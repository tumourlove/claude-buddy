# CLAWD Personality Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make CLAWD feel alive with flow state effects, error flinch, eureka moments, lo-fi coding music, idle wandering, victory celebrations, extended states/moods, and new sounds.

**Architecture:** Event-driven: detector.js emits new IPC events (flow, flinch, eureka) alongside existing state/mood. SceneEngine gets a one-shot animation system and idle wander loop. SoundSystem gets a procedural music loop and new jingles. MoodDetector gets 3 new moods. All wired through preload.js IPC bridge.

**Tech Stack:** Electron, Web Audio API (procedural synthesis), Canvas 2D, chokidar file watcher.

**No test suite** — manual testing via `npm start` and D-key demo mode.

---

### Task 1: Extend detector.js — new tool mappings, flow/flinch/eureka events

**Files:**
- Modify: `src/detector.js`

**Step 1: Update TOOL_MAP with new state mappings**

Add `browsing`, `building`, `delegating` states. Change these tool entries:

```javascript
const TOOL_MAP = {
  'Read': 'researching',
  'Grep': 'researching',
  'Glob': 'researching',
  'WebFetch': 'browsing',       // was: researching
  'WebSearch': 'browsing',      // was: researching
  'Edit': 'coding',
  'Write': 'building',          // was: coding
  'NotebookEdit': 'coding',
  'Bash': 'bash',
  'Task': 'delegating',         // was: thinking
  'AskUserQuestion': 'listening',
};
```

**Step 2: Add flow detection state**

Add these properties to the constructor:

```javascript
// Flow state detection
this.toolTimestamps = [];       // timestamps of recent tool calls
this.flowActive = false;
this.flowDecayTimer = null;
this.onFlow = null;             // callback: (isFlowing: boolean) => void

// Flinch detection
this.onFlinch = null;           // callback: () => void

// Eureka detection
this.stateHistory = [];         // last N states for pattern matching
this.onEureka = null;           // callback: () => void
```

**Step 3: Add flow detection logic**

Add a new method `_checkFlow()` called from `_emitState()`:

```javascript
_checkFlow() {
  const now = Date.now();
  this.toolTimestamps.push(now);
  // Keep only last 15 seconds
  this.toolTimestamps = this.toolTimestamps.filter(t => now - t < 15000);

  if (this.toolTimestamps.length >= 5 && !this.flowActive) {
    this.flowActive = true;
    if (this.onFlow) this.onFlow(true);
  }

  // Reset decay timer
  if (this.flowDecayTimer) clearTimeout(this.flowDecayTimer);
  this.flowDecayTimer = setTimeout(() => {
    if (this.flowActive) {
      this.flowActive = false;
      if (this.onFlow) this.onFlow(false);
    }
  }, 10000);
}
```

Call `this._checkFlow()` at the top of `_emitState()`.

**Step 4: Add flinch detection in `_parseLine()`**

Inside the `for (const block of content)` loop, after the existing `tool_use` check, add:

```javascript
if (block.type === 'tool_result') {
  const isError = block.is_error ||
    (typeof block.content === 'string' &&
      /Error|FAIL|error|exception|EPERM|ENOENT/i.test(block.content));
  if (isError && this.onFlinch) {
    this.onFlinch();
  }
}
```

**Step 5: Add eureka detection in `_emitState()`**

After the `if (this.onState)` call in `_emitState()`, add:

```javascript
// Track state history for eureka detection
this.stateHistory.push(state);
if (this.stateHistory.length > 10) this.stateHistory.shift();

// Eureka: 3+ researching/browsing states then coding/building/bash
if ((state === 'coding' || state === 'building' || state === 'bash') &&
    this.stateHistory.length >= 4) {
  const prev = this.stateHistory.slice(-4, -1); // last 3 before current
  const allResearch = prev.every(s => s === 'researching' || s === 'browsing');
  if (allResearch && this.onEureka) {
    this.onEureka();
  }
}
```

**Step 6: Clean up flow timer in `stop()`**

Add to `stop()`:
```javascript
if (this.flowDecayTimer) clearTimeout(this.flowDecayTimer);
```

**Step 7: Commit**

```bash
git add src/detector.js
git commit -m "feat: extend detector with flow/flinch/eureka events and new state mappings"
```

---

### Task 2: Extend mood-detector.js — add determined, proud, curious moods

**Files:**
- Modify: `src/mood-detector.js`

**Step 1: Add new mood keywords**

Add to `MOOD_KEYWORDS` object:

```javascript
determined: {
  patterns: [/let me try a different/i, /I'll retry/i, /trying again/i,
             /another approach/i, /let me fix/i, /I can fix/i],
  weight: 1.0,
},
proud: {
  patterns: [/all done/i, /everything.*(works|working|complete)/i,
             /successfully/i, /implemented/i, /that completes/i,
             /all.*changes/i],
  weight: 1.0,
},
curious: {
  patterns: [/interesting/i, /let me (look|explore|investigate|check|examine)/i,
             /I wonder/i, /let's see/i, /looking (at|into|for)/i],
  weight: 0.8,
},
```

**Step 2: Add new mood scores to constructor**

Change the `this.scores` initialization to include the new moods:

```javascript
this.scores = {
  frustrated: 0, celebrating: 0, confused: 0, excited: 0, sleepy: 0,
  determined: 0, proud: 0, curious: 0,
};
```

**Step 3: Add determined detection (error → immediate retry)**

Add a new method `_analyzeDetermined()` and call it from `analyzeEntry()`. Track last error time and check for quick retries:

Add to constructor:
```javascript
this.lastErrorTime = 0;
this.lastErrorTool = null;
this.sessionToolCount = 0;
```

In `analyzeEntry()`, after the `tool_result` block handling, add:

```javascript
// Track errors for determined detection
if (block.type === 'tool_result' && (block.is_error ||
    (typeof block.content === 'string' && /Error|FAIL|error|exception/i.test(block.content)))) {
  this.lastErrorTime = now;
  // Find the tool name from recent history
  if (this.history.length > 0) {
    this.lastErrorTool = this.history[this.history.length - 1].toolName;
  }
}

// Determined: same tool used within 5s of error
if (block.type === 'tool_use' && this.lastErrorTool &&
    block.name === this.lastErrorTool && now - this.lastErrorTime < 5000) {
  this.scores.determined += 2.0;
  this.lastErrorTool = null;
}
```

Also increment `this.sessionToolCount++` in the `tool_use` block handler.

**Step 4: Add proud detection (many tools then idle)**

Add a new method. Call it from `_analyzeSleepy()` (which already runs on each entry), adding:

```javascript
// Proud: lots of work then a gap (settling down)
if (this.sessionToolCount >= 10 && this.history.length > 0) {
  const lastEvent = this.history[this.history.length - 1];
  const gap = now - lastEvent.timestamp;
  if (gap > 15000 && gap < 60000) {
    this.scores.proud += 0.5;
  }
}
```

**Step 5: Add curious detection (sustained research)**

Add to `_analyzePace()`:

```javascript
// Curious: 5+ recent research tools with no edits
if (recent.length >= 5) {
  const researchTools = new Set(['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']);
  const editTools = new Set(['Edit', 'Write', 'NotebookEdit']);
  const allResearch = recent.every(e => researchTools.has(e.toolName));
  const anyEdits = recent.some(e => editTools.has(e.toolName));
  if (allResearch && !anyEdits) {
    this.scores.curious += 0.5;
  }
}
```

**Step 6: Commit**

```bash
git add src/mood-detector.js
git commit -m "feat: add determined, proud, curious moods to mood detector"
```

---

### Task 3: Extend scene-engine.js — one-shot system, idle wandering, new states/emojis

**Files:**
- Modify: `src/scene-engine.js`

**Step 1: Add new states to STATION_CONFIG and STATIONS**

Add entries to both `STATION_CONFIG` and `STATIONS`:

```javascript
// Add to STATION_CONFIG:
browsing:   { furniture: 'terminal',   direction: 's',  offsetX: -30, offsetY: 40 },
building:   { furniture: 'workbench',  direction: 'se', offsetX: -30, offsetY: 40 },
delegating: { furniture: 'armchair',   direction: 'sw', offsetX: 30,  offsetY: 40 },

// Add to STATIONS:
browsing:   { x: 310, y: 205, direction: 's' },
building:   { x: 280, y: 270, direction: 'se' },
delegating: { x: 180, y: 270, direction: 'sw' },
```

**Step 2: Add new emojis to THOUGHT_EMOJIS and MOOD_EMOJIS**

```javascript
// Add to THOUGHT_EMOJIS:
browsing:    '🌐',
building:    '🏗️',
delegating:  '🫡',

// Add to MOOD_EMOJIS:
determined:  '💪',
proud:       '🌟',
curious:     '🔎',
```

**Step 3: Add one-shot animation system**

Add new properties to constructor:

```javascript
// One-shot animation (flinch, eureka, victory)
this.oneShotAnim = null;     // { variant, frameIdx, emoji, onComplete }
this.oneShotPrevEmoji = null; // to restore after one-shot
```

Add `playOneShot()` method:

```javascript
/**
 * Play a one-shot animation, then revert to current state animation.
 * @param {string} animKey — key registered in animationPool (e.g. 'flinch-s')
 * @param {object} opts
 * @param {string} opts.emoji — override thought bubble emoji during one-shot
 * @param {function} opts.onComplete — called when one-shot finishes
 */
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
```

**Step 4: Modify `_currentVariant()` to check one-shot first**

At the top of `_currentVariant()`, add:

```javascript
if (this.oneShotAnim) {
  return this.oneShotAnim.variant;
}
```

**Step 5: Modify `_updateAnimation()` to handle one-shot frame advancement**

Replace the `_updateAnimation` method to handle one-shots:

```javascript
_updateAnimation(dt) {
  const variant = this._currentVariant();
  if (!variant || variant.frames.length === 0) return;

  const frameDuration = 1000 / variant.fps;
  this.animAccum += dt;

  while (this.animAccum >= frameDuration) {
    this.animAccum -= frameDuration;

    if (this.oneShotAnim) {
      // One-shot: advance frame, end at last frame
      this.oneShotAnim.frameIdx++;
      this.animFrame = this.oneShotAnim.frameIdx;
      if (this.oneShotAnim.frameIdx >= variant.frames.length) {
        // One-shot complete — revert
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
      // Normal looping animation
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
```

**Step 6: Add idle wandering system**

Add to constructor:

```javascript
// Idle wandering
this.wanderTimer = null;
this.wanderState = 'idle';  // 'idle' | 'walking' | 'interacting' | 'pausing'
this.wanderTarget = null;
this.isWandering = false;
this.wanderEmojis = ['🤔', '🔧', '📦', '✨', '🔍', '🎵'];
```

Add wander methods:

```javascript
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

  // Pick random furniture different from current position
  const candidates = this.furniture.filter(f => {
    const dx = f.x + 32 - this.charX;
    const dy = f.y + 32 - this.charY;
    return Math.sqrt(dx * dx + dy * dy) > 40; // not already there
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
    // Arrived at furniture — play interaction animation
    this.wanderState = 'interacting';
    const dir = this.charDirection === 'n' ? 'north' :
                this.charDirection === 's' ? 'south' :
                this.charDirection === 'sw' ? 'west' : 'east';
    const animType = Math.random() > 0.5 ? 'pushing' : 'picking-up';
    const animKey = `${animType}-${dir}`;

    // Show curiosity emoji
    const emoji = this.wanderEmojis[Math.floor(Math.random() * this.wanderEmojis.length)];

    this.playOneShot(animKey, {
      emoji,
      onComplete: () => {
        if (!this.isWandering) return;
        this.wanderState = 'pausing';
        // Pause 4-8 seconds before next wander
        const delay = 4000 + Math.random() * 4000;
        this.wanderTimer = setTimeout(() => {
          if (this.isWandering) this._wanderNext();
        }, delay);
      },
    });
  }
}
```

Call `this._updateWander()` in `_loop()` after `_updateTween()`.

**Step 7: Cancel wandering on setState**

At the start of `setState()`, add:

```javascript
this.stopWandering();
// Also cancel any one-shot
if (this.oneShotAnim) {
  this.oneShotAnim = null;
  this.oneShotPrevEmoji = null;
}
```

**Step 8: Add flow state flag**

Add to constructor:
```javascript
this.inFlow = false;
```

Add method:
```javascript
setFlow(flowing) {
  this.inFlow = flowing;
}
```

**Step 9: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: one-shot animations, idle wandering, new states/emojis, flow flag"
```

---

### Task 4: Extend mood-effects.js — flow aura, eureka burst, victory confetti, new mood particles

**Files:**
- Modify: `src/mood-effects.js`

**Step 1: Add new mood configs**

Add to `MOOD_CONFIGS`:

```javascript
determined: {
  color: '#ff6600',
  secondary: '#ff8833',
  symbol: 'burst',
  spawnRate: 5,
  maxParticles: 10,
},
proud: {
  color: '#ffd700',
  secondary: '#ffee88',
  symbol: 'spark',
  spawnRate: 8,
  maxParticles: 8,
},
curious: {
  color: '#66aaff',
  secondary: '#88ccff',
  symbol: 'question',
  spawnRate: 12,
  maxParticles: 4,
},
```

**Step 2: Add flow aura rendering**

Add new properties to constructor:

```javascript
this.flowActive = false;
this.flowPhase = 0;        // oscillation phase for aura pulse
this.speedLines = [];       // rotating speed lines
```

Add `setFlow()`:

```javascript
setFlow(active) {
  this.flowActive = active;
  if (active && this.speedLines.length === 0) {
    // Create 5 speed lines at evenly spaced angles
    for (let i = 0; i < 5; i++) {
      this.speedLines.push({
        angle: (i / 5) * Math.PI * 2,
        length: 20 + Math.random() * 15,
        speed: 0.02 + Math.random() * 0.01,
      });
    }
  } else if (!active) {
    this.speedLines = [];
  }
}
```

Add flow rendering in `render()` — call before particle rendering:

```javascript
_renderFlow(ctx, charX, charY, scale) {
  if (!this.flowActive) return;

  this.flowPhase += 0.05;
  const alpha = 0.1 + Math.sin(this.flowPhase) * 0.1; // 0.0 to 0.2

  // Warm gold aura
  const cx = charX * scale;
  const cy = charY * scale;
  const radius = 40 * scale;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
  grad.addColorStop(1, `rgba(255, 150, 0, 0)`);

  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Speed lines
  ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 1.5})`;
  ctx.lineWidth = 1.5 * scale;
  for (const line of this.speedLines) {
    line.angle += line.speed;
    const innerR = 20 * scale;
    const outerR = (20 + line.length) * scale;
    const x1 = cx + Math.cos(line.angle) * innerR;
    const y1 = cy + Math.sin(line.angle) * innerR;
    const x2 = cx + Math.cos(line.angle) * outerR;
    const y2 = cy + Math.sin(line.angle) * outerR;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}
```

**Step 3: Add eureka burst effect**

Add a one-shot burst method:

```javascript
triggerEurekaBurst(charX, charY) {
  // Spawn 15 gold/white sparkle particles at once
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    this.particles.push({
      x: charX + (Math.random() * 10 - 5),
      y: charY - 20 + (Math.random() * 10 - 5),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 3,
      alpha: 1.0,
      life: 0,
      maxLife: 20 + Math.floor(Math.random() * 15),
      symbol: 'spark',
      color: Math.random() > 0.3 ? '#ffd700' : '#ffffff',
    });
  }
}
```

**Step 4: Add victory confetti effect**

```javascript
triggerVictoryConfetti(charX, charY) {
  // Spawn 25 confetti particles with gravity
  for (let i = 0; i < 25; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // upward spread
    const speed = 1.5 + Math.random() * 2.5;
    const colors = ['#ffd700', '#ff8800', '#ff4444', '#44ff44', '#4488ff'];
    this.particles.push({
      x: charX + (Math.random() * 20 - 10),
      y: charY - 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 2,
      alpha: 1.0,
      life: 0,
      maxLife: 50 + Math.floor(Math.random() * 30),
      symbol: 'spark',
      color: colors[Math.floor(Math.random() * colors.length)],
      gravity: 0.05, // new field — confetti falls
    });
  }
}
```

**Step 5: Update `update()` to handle gravity**

In the particle update loop, after `p.y += p.vy;`, add:

```javascript
if (p.gravity) {
  p.vy += p.gravity;
}
```

**Step 6: Update `render()` to call `_renderFlow()`**

Change `render()`:

```javascript
render(ctx, scale, charX, charY) {
  // Pass charX/charY for flow effect positioning
  this._renderFlow(ctx, charX || 0, charY || 0, scale);
  // ... existing particle rendering unchanged
}
```

Wait — the current `render()` signature is `render(ctx, scale)` and charX/charY come from the `update()` call. We need to either:
- Store charX/charY from update and use in render, or
- Change render signature

Store them. Add to constructor:
```javascript
this.charX = 0;
this.charY = 0;
```

In `update()`, save: `this.charX = charX; this.charY = charY;`

In `render()`, use `this.charX` and `this.charY` for flow:
```javascript
render(ctx, scale) {
  this._renderFlow(ctx, this.charX, this.charY, scale);
  // ... existing particle code
}
```

**Step 7: Commit**

```bash
git add src/mood-effects.js
git commit -m "feat: flow aura/speed lines, eureka burst, victory confetti, new mood particles"
```

---

### Task 5: Extend sounds.js — coding music loop, eureka jingle, new mood sounds

**Files:**
- Modify: `src/sounds.js`

**Step 1: Add coding music state**

Add to constructor:

```javascript
this.musicPlaying = false;
this.musicStartTimer = null;
this.musicGainNode = null;
this.musicScheduler = null;
this.musicNextBeat = 0;
```

**Step 2: Add the Chrono Trigger-style lo-fi music loop**

```javascript
// ── Lo-fi SNES coding music ──────────────────────────────────────

startCodingMusic() {
  if (this.musicPlaying) return;
  if (!this.ctx) this.init();
  this.musicPlaying = true;

  // Master gain for the music (fades in)
  this.musicGainNode = this.ctx.createGain();
  this.musicGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
  this.musicGainNode.gain.linearRampToValueAtTime(this.volume * 0.5, this.ctx.currentTime + 2);
  this.musicGainNode.connect(this.ctx.destination);

  // Reduce coding click volume during music
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

  // Pentatonic melody: C4 D4 E4 G4 A4 (262, 294, 330, 392, 440)
  const scale = [262, 294, 330, 392, 440, 523, 587, 659];

  // 8-bar melodic pattern (each bar = 4 beats)
  const melodyPattern = [
    // Bar 1-2: gentle opening
    [0, 2, 4, 5],  [4, 2, 0, -1],
    // Bar 3-4: ascending
    [2, 4, 5, 7],  [5, 4, 2, 0],
    // Bar 5-6: variation
    [0, 4, 2, 5],  [7, 5, 4, 2],
    // Bar 7-8: resolve
    [4, 2, 5, 4],  [2, 0, -1, 0],
  ];

  // Chord progression: I - IV - V - I (C, F, G, C)
  const chordBass = [
    262, 262,  // I  (C)
    349, 349,  // IV (F)
    392, 392,  // V  (G)
    262, 262,  // I  (C)
  ];

  const totalDuration = bar * 8;

  melodyPattern.forEach((barNotes, barIdx) => {
    barNotes.forEach((noteIdx, beatIdx) => {
      if (noteIdx < 0) return; // rest
      const noteTime = t + barIdx * bar + beatIdx * beat;
      const freq = scale[noteIdx];

      // Melody: triangle wave, gentle
      this._musicVoice(freq, {
        type: 'triangle', startTime: noteTime - t,
        duration: beat * 0.8, attack: 0.02, decay: 0.05,
        sustain: 0.4, release: beat * 0.2, vol: 0.25,
      });
    });

    // Bass: root note on beats 1 and 3
    const bassFreq = chordBass[barIdx] / 2; // one octave down
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

    // Pad chord: very soft square wave whole note
    if (barIdx % 2 === 0) {
      const chordFreq = chordBass[barIdx];
      this._musicVoice(chordFreq, {
        type: 'square', startTime: barIdx * bar,
        duration: bar * 2 * 0.9, attack: 0.1, decay: 0.2,
        sustain: 0.3, release: 0.5, vol: 0.06,
      });
      // Add a fifth for fullness
      this._musicVoice(chordFreq * 1.5, {
        type: 'square', startTime: barIdx * bar,
        duration: bar * 2 * 0.9, attack: 0.1, decay: 0.2,
        sustain: 0.3, release: 0.5, vol: 0.04,
      });
    }
  });

  // Schedule next loop
  this.musicScheduler = setTimeout(() => {
    this._scheduleMusicLoop();
  }, totalDuration * 1000 - 100); // slight overlap for seamless loop
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
```

**Step 3: Hook music start/stop into state changes**

Modify `playForState()` — add music timer management:

```javascript
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
      // Start music after 10s of sustained coding
      if (!this.musicStartTimer && !this.musicPlaying) {
        this.musicStartTimer = setTimeout(() => {
          this.startCodingMusic();
          this.musicStartTimer = null;
        }, 10000);
      }
      break;
    case 'thinking': this.playThinking(); break;
    case 'delegating': this.playThinking(); break; // reuse thinking sound
    case 'researching': this.playResearching(); break;
    case 'browsing': this.playResearching(); break; // reuse research sound
    case 'bash': this.playBash(); break;
    case 'listening': this.playListening(); break;
  }
}
```

**Step 4: Use `_codingClickVolume` in `playClawClick()`**

Change the click volume line:

```javascript
playClawClick() {
  const freq = 800 + Math.random() * 400;
  this._snesVoice(freq, {
    type: 'square', duration: 0.03, attack: 0.002, decay: 0.01,
    sustain: 0.2, release: 0.01, vol: this._codingClickVolume || 0.3,
  });
```

**Step 5: Add eureka jingle**

```javascript
// Eureka: SNES "item found" jingle
playEureka() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    this._snesVoice(freq, {
      type: 'triangle', duration: 0.12, attack: 0.005, decay: 0.02,
      sustain: 0.6, release: 0.05, startTime: i * 0.08, vol: 0.35,
    });
  });
  // Sparkle on top
  this._snesNoise(0.05, { startTime: 0.3, filter: 8000, vol: 0.12 });
}

// Flinch: immediate short damage hit (reuses frustrated sound but shorter)
playFlinch() {
  this._snesVoice(350, {
    type: 'square', duration: 0.1, attack: 0.003, decay: 0.03,
    sustain: 0.4, release: 0.04, vol: 0.35, detune: -15,
  });
  this._snesNoise(0.08, { filter: 2000, vol: 0.25 });
}
```

**Step 6: Add new mood sounds**

```javascript
// Determined: resolute punchy ascending
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

// Proud: warm major chord resolve
playProud() {
  const notes = [262, 330, 392]; // C4 E4 G4 — major chord
  notes.forEach((freq) => {
    this._snesVoice(freq, {
      type: 'triangle', duration: 0.6, attack: 0.03, decay: 0.1,
      sustain: 0.4, release: 0.2, vol: 0.2,
      vibRate: 4, vibDepth: 5,
    });
  });
}

// Curious: soft mystery minor 7th chime
playCurious() {
  this._snesVoice(440, {
    type: 'triangle', duration: 0.25, attack: 0.01, decay: 0.05,
    sustain: 0.4, release: 0.1, vol: 0.25,
  });
  this._snesVoice(523, {
    type: 'triangle', duration: 0.2, attack: 0.01, decay: 0.05,
    sustain: 0.35, release: 0.08, startTime: 0.12, vol: 0.2,
  });
  this._snesVoice(415, {  // Ab — minor 7th flavor
    type: 'square', duration: 0.3, attack: 0.02, decay: 0.05,
    sustain: 0.3, release: 0.1, startTime: 0.2, vol: 0.12,
  });
}
```

**Step 7: Update playForMood dispatch**

```javascript
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
```

**Step 8: Commit**

```bash
git add src/sounds.js
git commit -m "feat: lo-fi SNES coding music loop, eureka jingle, flinch sound, new mood sounds"
```

---

### Task 6: Extend preload.js and main.js — new IPC channels

**Files:**
- Modify: `preload.js`
- Modify: `main.js`

**Step 1: Add new IPC listeners in preload.js**

Add to the `contextBridge.exposeInMainWorld('claude', { ... })` object:

```javascript
onFlowChange: (callback) => {
  ipcRenderer.removeAllListeners('claude-flow');
  ipcRenderer.on('claude-flow', (_, flowing) => callback(flowing));
},
onFlinch: (callback) => {
  ipcRenderer.removeAllListeners('claude-flinch');
  ipcRenderer.on('claude-flinch', () => callback());
},
onEureka: (callback) => {
  ipcRenderer.removeAllListeners('claude-eureka');
  ipcRenderer.on('claude-eureka', () => callback());
},
```

**Step 2: Wire up detector events in main.js**

After `detector.onMood = ...` (line ~73), add:

```javascript
detector.onFlow = (flowing) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('claude-flow', flowing);
  }
};
detector.onFlinch = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('claude-flinch');
  }
};
detector.onEureka = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('claude-eureka');
  }
};
```

**Step 3: Commit**

```bash
git add preload.js main.js
git commit -m "feat: add IPC channels for flow, flinch, eureka events"
```

---

### Task 7: Wire everything up in renderer.js

**Files:**
- Modify: `src/renderer.js`

**Step 1: Load new animation frames**

In the `init()` function, after the existing `Promise.all` for breathing-idle and walking, add another block to load the 4 new animations:

```javascript
// Load new animation frames (4 new types × 4 directions)
const [
  flinchN, flinchS, flinchW, flinchE,
  eurekaN, eurekaS, eurekaW, eurekaE,
  flowN, flowS, flowW, flowE,
  victoryN, victoryS, victoryW, victoryE,
  pushingN, pushingS, pushingW, pushingE,
  pickingUpN, pickingUpS, pickingUpW, pickingUpE,
] = await Promise.all([
  tryLoadAnimFrames(engine, 'falling-back-death', 'north', 7),
  tryLoadAnimFrames(engine, 'falling-back-death', 'south', 7),
  tryLoadAnimFrames(engine, 'falling-back-death', 'west', 7),
  tryLoadAnimFrames(engine, 'falling-back-death', 'east', 7),
  tryLoadAnimFrames(engine, 'fireball', 'north', 6),
  tryLoadAnimFrames(engine, 'fireball', 'south', 6),
  tryLoadAnimFrames(engine, 'fireball', 'west', 6),
  tryLoadAnimFrames(engine, 'fireball', 'east', 6),
  tryLoadAnimFrames(engine, 'fight-stance-idle-8-frames', 'north', 8),
  tryLoadAnimFrames(engine, 'fight-stance-idle-8-frames', 'south', 8),
  tryLoadAnimFrames(engine, 'fight-stance-idle-8-frames', 'west', 8),
  tryLoadAnimFrames(engine, 'fight-stance-idle-8-frames', 'east', 8),
  tryLoadAnimFrames(engine, 'front-flip', 'north', 6),
  tryLoadAnimFrames(engine, 'front-flip', 'south', 6),
  tryLoadAnimFrames(engine, 'front-flip', 'west', 6),
  tryLoadAnimFrames(engine, 'front-flip', 'east', 6),
  tryLoadAnimFrames(engine, 'pushing', 'north', 6),
  tryLoadAnimFrames(engine, 'pushing', 'south', 6),
  tryLoadAnimFrames(engine, 'pushing', 'west', 6),
  tryLoadAnimFrames(engine, 'pushing', 'east', 6),
  tryLoadAnimFrames(engine, 'picking-up', 'north', 5),
  tryLoadAnimFrames(engine, 'picking-up', 'south', 5),
  tryLoadAnimFrames(engine, 'picking-up', 'west', 5),
  tryLoadAnimFrames(engine, 'picking-up', 'east', 5),
]);
```

**Step 2: Register new animations**

After existing animation registrations, add:

```javascript
// Register directional one-shot animations (for flinch, eureka, victory, idle interactions)
const dirs = ['north', 'south', 'west', 'east'];
const flinchFrames = [flinchN, flinchS, flinchW, flinchE];
const eurekaFrames = [eurekaN, eurekaS, eurekaW, eurekaE];
const flowFrames = [flowN, flowS, flowW, flowE];
const victoryFrames = [victoryN, victoryS, victoryW, victoryE];
const pushingFrames = [pushingN, pushingS, pushingW, pushingE];
const pickingUpFrames = [pickingUpN, pickingUpS, pickingUpW, pickingUpE];

dirs.forEach((dir, i) => {
  if (flinchFrames[i]) engine.registerAnimations(`flinch-${dir}`, [{ frames: flinchFrames[i], fps: 10 }]);
  if (eurekaFrames[i]) engine.registerAnimations(`eureka-${dir}`, [{ frames: eurekaFrames[i], fps: 10 }]);
  if (flowFrames[i]) engine.registerAnimations(`flow-${dir}`, [{ frames: flowFrames[i], fps: 8 }]);
  if (victoryFrames[i]) engine.registerAnimations(`victory-${dir}`, [{ frames: victoryFrames[i], fps: 10 }]);
  if (pushingFrames[i]) engine.registerAnimations(`pushing-${dir}`, [{ frames: pushingFrames[i], fps: 6 }]);
  if (pickingUpFrames[i]) engine.registerAnimations(`picking-up-${dir}`, [{ frames: pickingUpFrames[i], fps: 6 }]);
});

// Register new states with their animations (reuse breathing-idle directions)
engine.registerAnimations('browsing', validVariants([
  { frames: breathingIdleSouthFrames, fps: 4 },
]));
engine.registerAnimations('building', validVariants([
  { frames: breathingIdleEastFrames, fps: 4 },
]));
engine.registerAnimations('delegating', validVariants([
  { frames: breathingIdleWestFrames, fps: 4 },
]));
```

**Step 3: Wire up new IPC events**

After the existing IPC listeners, add:

```javascript
// Flow state
window.claude.onFlowChange((flowing) => {
  engine.setFlow(flowing);
  moodFx.setFlow(flowing);
});

// Flinch on error
window.claude.onFlinch(() => {
  const dir = engine.charDirection === 'n' ? 'north' :
              engine.charDirection === 's' ? 'south' :
              engine.charDirection === 'sw' ? 'west' : 'east';
  engine.playOneShot(`flinch-${dir}`, { emoji: '💥' });
  sounds.playFlinch();
});

// Eureka moment
window.claude.onEureka(() => {
  const dir = engine.charDirection === 'n' ? 'north' :
              engine.charDirection === 's' ? 'south' :
              engine.charDirection === 'sw' ? 'west' : 'east';
  engine.playOneShot(`eureka-${dir}`, { emoji: '💡' });
  sounds.playEureka();
  moodFx.triggerEurekaBurst(engine.charX, engine.charY);
});
```

**Step 4: Wire mood change to trigger victory animation**

Modify the `onMoodChange` handler:

```javascript
window.claude.onMoodChange((mood) => {
  engine.setMood(mood);
  moodFx.setMood(mood);
  sounds.playForMood(mood);

  // Victory celebration animation on celebrating mood
  if (mood === 'celebrating') {
    const dir = engine.charDirection === 'n' ? 'north' :
                engine.charDirection === 's' ? 'south' :
                engine.charDirection === 'sw' ? 'west' : 'east';
    engine.playOneShot(`victory-${dir}`, { emoji: '🎉' });
    moodFx.triggerVictoryConfetti(engine.charX, engine.charY);
  }
});
```

**Step 5: Wire idle wandering**

Modify the `onStateChange` IPC handler:

```javascript
window.claude.onStateChange((state) => {
  engine.setState(state);

  // Start idle wandering after 15 seconds of idle
  if (state === 'idle') {
    if (!engine._wanderStartTimer) {
      engine._wanderStartTimer = setTimeout(() => {
        if (engine.currentState === 'idle') {
          engine.startWandering();
        }
        engine._wanderStartTimer = null;
      }, 15000);
    }
  } else {
    if (engine._wanderStartTimer) {
      clearTimeout(engine._wanderStartTimer);
      engine._wanderStartTimer = null;
    }
  }
});
```

**Step 6: Update the demo mode to include new states and moods**

```javascript
const states = ['coding', 'researching', 'bash', 'thinking', 'listening',
                'browsing', 'building', 'delegating', 'idle'];
const moods = [null, 'frustrated', 'celebrating', 'confused', 'excited',
               'sleepy', 'determined', 'proud', 'curious', null];
```

**Step 7: Commit**

```bash
git add src/renderer.js
git commit -m "feat: wire up all new animations, IPC events, idle wander, and demo mode"
```

---

### Task 8: Manual test and verify

**Step 1: Run the app**

```bash
npm start
```

**Step 2: Test demo mode**

Press `D` to cycle through all states and moods. Verify:
- All 9 states show correct thought bubble emoji
- All 8 moods show correct mood bubble emoji + particles + sounds
- Character walks between stations for new states (browsing, building, delegating)
- Victory fanfare plays with confetti on celebrating mood

**Step 3: Test one-shot animations**

In demo mode, observe that the flinch/eureka/victory animations play as one-shots and revert to normal breathing-idle.

**Step 4: Test coding music**

Set state to coding and wait 10+ seconds. Music should fade in. Change state — music should fade out.

**Step 5: Test idle wandering**

Let CLAWD go idle for 15+ seconds. Verify:
- CLAWD walks to random furniture
- Plays pushing or picking-up animation
- Shows random curiosity emoji
- Pauses, then walks to another piece
- Immediately stops and transitions when a real state change comes in

**Step 6: Commit final verification**

```bash
git add -A
git commit -m "feat: CLAWD personality upgrade — flow state, flinch, eureka, music, wandering, victory"
```

---

### Task 9: Update CLAUDE.md with new states, moods, and animation docs

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the documentation**

Update the CLAUDE.md file to document:
- New states: browsing, building, delegating (tool mappings)
- New moods: determined, proud, curious (detection patterns)
- New animations: fight-stance-idle-8-frames, fireball, falling-back-death, front-flip, pushing, picking-up
- One-shot animation system
- Idle wandering behavior
- Lo-fi coding music loop
- Flow/flinch/eureka IPC events
- Demo mode key: D (now shows all 9 states and 8 moods)

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with personality upgrade features"
```
