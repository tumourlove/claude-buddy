# Chalkboard Task List Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display Claude Code's task list on a green chalkboard rendered on the left wall of the isometric room, with strikethrough on completed tasks.

**Architecture:** Parse `TaskCreate`/`TaskUpdate` tool calls from JSONL logs in the detector, send task list via IPC to renderer, render a chalkboard panel on the left wall using the same isometric transform pattern as the existing LED ticker.

**Tech Stack:** Electron IPC, Canvas 2D API, existing JSONL parser

---

### Task 1: Parse TaskCreate/TaskUpdate in Detector

**Files:**
- Modify: `src/detector.js:21-53` (constructor), `src/detector.js:115-151` (_parseLine)

**Step 1: Add task tracking state to constructor**

In `src/detector.js`, add after line 46 (`this.onEureka = null;`):

```javascript
    // Task list tracking
    this.tasks = new Map();
    this.onTasks = null;
```

**Step 2: Parse TaskCreate/TaskUpdate in `_parseLine`**

In `src/detector.js`, inside the `for (const block of content)` loop, add after the `if (block.type === 'tool_use')` block (after line 136, before the `tool_result` check):

```javascript
        if (block.type === 'tool_use' && block.name === 'TaskCreate' && block.input) {
          const id = String(this.tasks.size + 1);
          this.tasks.set(id, {
            id,
            subject: block.input.subject || 'Untitled',
            status: 'pending',
          });
          this._emitTasks();
        }
        if (block.type === 'tool_use' && block.name === 'TaskUpdate' && block.input) {
          const id = String(block.input.taskId);
          const task = this.tasks.get(id);
          if (task) {
            if (block.input.status) task.status = block.input.status;
            if (block.input.subject) task.subject = block.input.subject;
            if (block.input.status === 'deleted') this.tasks.delete(id);
            this._emitTasks();
          }
        }
```

**Step 3: Add `_emitTasks` helper method**

Add before the `_emitState` method (before line 153):

```javascript
  _emitTasks() {
    if (this.onTasks) {
      this.onTasks([...this.tasks.values()]);
    }
  }
```

**Step 4: Clear tasks on new session (new JSONL file)**

In the `watcher.on('add')` handler (line 78), add task reset after the console.log:

```javascript
      // New file = new session, reset tasks
      this.tasks.clear();
      this._emitTasks();
```

**Step 5: Commit**

```bash
git add src/detector.js
git commit -m "feat: parse TaskCreate/TaskUpdate from JSONL for chalkboard display"
```

---

### Task 2: Wire IPC Channel for Tasks

**Files:**
- Modify: `main.js:94-98` (after onEureka)
- Modify: `preload.js:37-39` (after onEureka)

**Step 1: Send tasks from main process**

In `main.js`, add after the `detector.onEureka` block (after line 98):

```javascript
  detector.onTasks = (tasks) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('claude-tasks', tasks);
    }
  };
```

**Step 2: Expose in preload bridge**

In `preload.js`, add after the `onEureka` entry (after line 39, before the closing `});`):

```javascript
  onTasksChange: (callback) => {
    ipcRenderer.removeAllListeners('claude-tasks');
    ipcRenderer.on('claude-tasks', (_, tasks) => callback(tasks));
  },
```

**Step 3: Commit**

```bash
git add main.js preload.js
git commit -m "feat: add claude-tasks IPC channel for task list"
```

---

### Task 3: Add Chalkboard Panel Geometry Constants

**Files:**
- Modify: `src/scene-engine.js:30-51` (after TICKER_PANEL constants)

**Step 1: Add left wall constants and CHALK_PANEL**

In `src/scene-engine.js`, add after the `TICKER_PANEL` definition (after line 51):

```javascript
// Left wall direction vectors (top → left vertex)
const ROOM_LEFT = { x: ROOM.cx - ROOM.halfW, y: ROOM.cy };
const LWALL_DX = ROOM_LEFT.x - ROOM_TOP.x;   // -200
const LWALL_DY = ROOM_LEFT.y - ROOM_TOP.y;    // 100
const LWALL_LEN = Math.sqrt(LWALL_DX * LWALL_DX + LWALL_DY * LWALL_DY);

// Chalkboard panel geometry (parallelogram on left wall, left of window)
// Window occupies 30%-65% of wall; chalkboard at 5%-27%
const CHALK_H0 = 0.05, CHALK_H1 = 0.27;
const CHALK_V_TOP = 0.70, CHALK_V_BOT = 0.25; // same vertical range as window
const _cTlY = (ROOM_TOP.y + LWALL_DY * CHALK_H0) - ROOM.wallH * CHALK_V_TOP;
const _cBlY = (ROOM_TOP.y + LWALL_DY * CHALK_H0) - ROOM.wallH * CHALK_V_BOT;
const _cTrY = (ROOM_TOP.y + LWALL_DY * CHALK_H1) - ROOM.wallH * CHALK_V_TOP;
const _cBrY = (ROOM_TOP.y + LWALL_DY * CHALK_H1) - ROOM.wallH * CHALK_V_BOT;
const CHALK_PANEL = Object.freeze({
  TL: { x: ROOM_TOP.x + LWALL_DX * CHALK_H0, y: _cTlY },
  TR: { x: ROOM_TOP.x + LWALL_DX * CHALK_H1, y: _cTrY },
  BR: { x: ROOM_TOP.x + LWALL_DX * CHALK_H1, y: _cBrY },
  BL: { x: ROOM_TOP.x + LWALL_DX * CHALK_H0, y: _cBlY },
  width: (CHALK_H1 - CHALK_H0) * LWALL_LEN,
  height: (CHALK_V_TOP - CHALK_V_BOT) * ROOM.wallH,
  ux: LWALL_DX / LWALL_LEN,  // unit x along left wall (negative x, positive y)
  uy: LWALL_DY / LWALL_LEN,
});
```

**Step 2: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: add CHALK_PANEL geometry constants for left wall chalkboard"
```

---

### Task 4: Add `setTasks()` and `_drawChalkboard()` to SceneEngine

**Files:**
- Modify: `src/scene-engine.js` (constructor, render loop, new methods)

**Step 1: Add tasks state to constructor**

Find the constructor in SceneEngine (look for `this.tickerMessage`). Add nearby:

```javascript
    // Chalkboard task list
    this.tasks = [];
```

**Step 2: Add `setTasks()` method**

Add near other setter methods (near `setState`, `setMood`, etc.):

```javascript
  setTasks(tasks) {
    this.tasks = tasks || [];
  }
```

**Step 3: Add `_drawChalkboard()` method**

Add after `_drawTicker()` (after line 1212):

```javascript
  _drawChalkboard() {
    if (!this.tasks.length) return;

    const ctx = this.ctx;
    const { TL, TR, BR, BL, width: panelW, height: panelH, ux, uy } = CHALK_PANEL;

    ctx.save();

    // Green chalkboard background
    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y); ctx.lineTo(BL.x, BL.y);
    ctx.closePath();
    ctx.fillStyle = '#2a4a2a';
    ctx.fill();

    // Wooden frame
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Clip to panel
    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y); ctx.lineTo(BL.x, BL.y);
    ctx.closePath();
    ctx.clip();

    // Isometric transform: text follows left wall direction
    ctx.translate(TL.x, TL.y);
    ctx.transform(ux, uy, 0, 1, 0, 0);

    // Chalk text style
    const fontSize = 7;
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    // Sort: pending/in_progress first, then completed
    const sorted = [...this.tasks].sort((a, b) => {
      const aComplete = a.status === 'completed' ? 1 : 0;
      const bComplete = b.status === 'completed' ? 1 : 0;
      return aComplete - bComplete;
    });

    const lineHeight = fontSize + 3;
    const maxLines = Math.floor(panelH / lineHeight);
    const padding = 4;
    const maxTextW = panelW - padding * 2;

    for (let i = 0; i < Math.min(sorted.length, maxLines); i++) {
      const task = sorted[i];
      const done = task.status === 'completed';
      const y = padding + i * lineHeight;

      // Checkbox
      const checkbox = done ? '\u2611 ' : '\u2610 ';
      // Truncate subject to fit
      let subject = task.subject;
      ctx.fillStyle = done ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.85)';
      const fullText = checkbox + subject;
      // Measure and truncate
      let displayText = fullText;
      while (ctx.measureText(displayText).width > maxTextW && displayText.length > 5) {
        subject = subject.slice(0, -1);
        displayText = checkbox + subject + '\u2026';
      }

      ctx.fillText(displayText, padding, y);

      // Strikethrough for completed tasks
      if (done) {
        const textWidth = ctx.measureText(displayText).width;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const strikeY = y + fontSize / 2;
        ctx.moveTo(padding, strikeY);
        ctx.lineTo(padding + textWidth, strikeY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
```

**Step 4: Call `_drawChalkboard()` in the render loop**

In `_drawProceduralRoom()`, after the left wall window is drawn and before the right wall is drawn. Find line 1017 (the warm light glow `ctx.fill()` at the end of the window section). Add after it:

```javascript
    // ── Chalkboard on left wall ──
    this._drawChalkboard();
```

**Step 5: Commit**

```bash
git add src/scene-engine.js
git commit -m "feat: render chalkboard task list on left wall"
```

---

### Task 5: Wire Renderer to Engine

**Files:**
- Modify: `src/renderer.js:268` (after onEureka listener)

**Step 1: Add tasks IPC listener**

In `src/renderer.js`, add after the `window.claude.onEureka` block (after line 268):

```javascript
// Task list updates
window.claude.onTasksChange((tasks) => {
  engine.setTasks(tasks);
});
```

**Step 2: Commit**

```bash
git add src/renderer.js
git commit -m "feat: wire task list IPC to scene engine"
```

---

### Task 6: Manual Test and Final Commit

**Step 1: Run the app**

```bash
npm start
```

**Step 2: Verify chalkboard renders**

- Press `D` for demo mode to confirm room renders without errors
- The chalkboard should appear as a green rectangle on the left wall, to the left of the starry window
- If no tasks exist yet, chalkboard should be hidden (empty tasks array)

**Step 3: Test with real task data**

- Start a Claude Code session that uses TaskCreate/TaskUpdate
- Verify tasks appear on the chalkboard
- Verify completed tasks show strikethrough and sort to bottom

**Step 4: Adjust geometry if needed**

If the chalkboard position or size needs tweaking, adjust `CHALK_H0`, `CHALK_H1`, `CHALK_V_TOP`, `CHALK_V_BOT` constants.

**Step 5: Final commit if adjustments made**

```bash
git add -A
git commit -m "fix: tune chalkboard geometry after visual testing"
```
