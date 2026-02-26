# Claude Desktop Buddy - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a desktop companion app that displays an animated ASCII art Claude tamagotchi that reacts to Claude Code activity in real-time.

**Architecture:** Electron app with transparent frameless window. Three systems: state detector (watches Claude JSONL logs via chokidar), animation engine (frame-based ASCII cycling), and sound system (Web Audio API procedural sounds). Preferences persisted to JSON.

**Tech Stack:** Electron, chokidar, Web Audio API, plain HTML/CSS/JS

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `main.js`
- Create: `preload.js`
- Create: `src/index.html`
- Create: `src/styles.css`
- Create: `src/renderer.js`

**Step 1: Initialize project and install dependencies**

Run:
```bash
cd /c/Projects/claude-buddy
npm init -y
npm install electron --save-dev
npm install chokidar --save
```

**Step 2: Create package.json scripts**

Update `package.json` to add:
```json
{
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**Step 3: Create main.js — Electron main process**

```javascript
const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const PREFS_PATH = path.join(app.getPath('userData'), 'preferences.json');

function loadPrefs() {
  try {
    return JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8'));
  } catch {
    return { x: undefined, y: undefined, scale: 1.0, volume: 0.2, muted: false, alwaysOnTop: true };
  }
}

function savePrefs(prefs) {
  fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2));
}

let mainWindow;
let prefs;

function createWindow() {
  prefs = loadPrefs();

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const winW = Math.round(250 * prefs.scale);
  const winH = Math.round(300 * prefs.scale);

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: prefs.x ?? screenW - winW - 50,
    y: prefs.y ?? screenH - winH - 50,
    transparent: true,
    frame: false,
    alwaysOnTop: prefs.alwaysOnTop !== false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('src/index.html');
  mainWindow.setVisibleOnAllWorkspaces(true);

  // Make transparent areas click-through
  mainWindow.setIgnoreMouseEvents(false);

  // Save position on move
  mainWindow.on('moved', () => {
    const [x, y] = mainWindow.getPosition();
    prefs.x = x;
    prefs.y = y;
    savePrefs(prefs);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// IPC handlers
ipcMain.handle('get-prefs', () => prefs);

ipcMain.handle('save-prefs', (_, newPrefs) => {
  Object.assign(prefs, newPrefs);
  savePrefs(prefs);
  return prefs;
});

ipcMain.handle('set-always-on-top', (_, value) => {
  prefs.alwaysOnTop = value;
  mainWindow.setAlwaysOnTop(value);
  savePrefs(prefs);
});

ipcMain.handle('set-scale', (_, scale) => {
  prefs.scale = scale;
  const winW = Math.round(250 * scale);
  const winH = Math.round(300 * scale);
  mainWindow.setSize(winW, winH);
  savePrefs(prefs);
});

ipcMain.handle('close-app', () => {
  app.quit();
});

ipcMain.handle('get-claude-logs-path', () => {
  const home = require('os').homedir();
  return path.join(home, '.claude', 'projects');
});
```

**Step 4: Create preload.js**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claude', {
  getPrefs: () => ipcRenderer.invoke('get-prefs'),
  savePrefs: (prefs) => ipcRenderer.invoke('save-prefs', prefs),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('set-always-on-top', value),
  setScale: (scale) => ipcRenderer.invoke('set-scale', scale),
  closeApp: () => ipcRenderer.invoke('close-app'),
  getClaudeLogsPath: () => ipcRenderer.invoke('get-claude-logs-path'),
});
```

**Step 5: Create src/index.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="buddy-container">
    <pre id="buddy"></pre>
  </div>
  <script src="renderer.js" type="module"></script>
</body>
</html>
```

**Step 6: Create src/styles.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  overflow: hidden;
  background: transparent;
  user-select: none;
  -webkit-app-region: drag;
  width: 100%;
  height: 100%;
}

#buddy-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

#buddy {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.2;
  color: #e8a44a;
  text-align: center;
  white-space: pre;
  text-shadow: 0 0 8px rgba(232, 164, 74, 0.4);
}

/* Color classes for ASCII art */
.c-amber { color: #e8a44a; }
.c-orange { color: #d4762c; }
.c-gold { color: #f0c040; }
.c-white { color: #fff8e8; }
.c-glow { color: #ffd080; text-shadow: 0 0 6px rgba(255, 208, 128, 0.6); }
.c-dim { color: #a07030; }
.c-eye { color: #ffffff; text-shadow: 0 0 4px rgba(255, 255, 255, 0.8); }
.c-spark { color: #fff4d0; text-shadow: 0 0 8px rgba(255, 244, 208, 0.9); }
```

**Step 7: Create minimal src/renderer.js**

```javascript
// Minimal renderer — just display a static frame to verify the window works
const buddy = document.getElementById('buddy');
buddy.textContent = `    .oOo.
  oO    Oo
 oO  ◉ ◉  Oo
 Oo   __   oO
  oO      Oo
   'oOOOo'
    /| |\\
   / | | \\`;
```

**Step 8: Test the scaffolding**

Run: `cd /c/Projects/claude-buddy && npm start`
Expected: A transparent window appears with the static ASCII character in amber text.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Electron app with transparent frameless window"
```

---

### Task 2: ASCII Animation Frames

**Files:**
- Create: `src/animations/idle.js`
- Create: `src/animations/thinking.js`
- Create: `src/animations/coding.js`
- Create: `src/animations/researching.js`
- Create: `src/animations/bash.js`
- Create: `src/animations/listening.js`

Each animation module exports an array of frames. Each frame is an array of lines, where each line is either a plain string or an array of `[text, colorClass]` segments for coloring.

**Step 1: Create src/animations/idle.js — Wandering/curious idle**

```javascript
// Idle: the buddy looks around curiously, blinks, sways
// Each frame is an array of strings (plain amber) or arrays of [text, class] for color
export const idle = {
  fps: 3,
  frames: [
    // Frame 0: looking right
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ● ●  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    /| |\\    ",
      "   / | | \\   ",
    ],
    // Frame 1: looking left
    [
      "    .oOo.    ",
      "   oO    Oo  ",
      " oO ●  ●  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    /| |\\    ",
      "   / | | \\   ",
    ],
    // Frame 2: blink
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  - -  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    /| |\\    ",
      "   / | | \\   ",
    ],
    // Frame 3: looking up
    [
      "    .oOo.  * ",
      "  oO    Oo   ",
      " oO  ◦ ◦  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    /| |\\    ",
      "   / | | \\   ",
    ],
    // Frame 4: happy sway right
    [
      "     .oOo.   ",
      "   oO    Oo  ",
      "  oO  ● ●  Oo",
      "  Oo   ‿   oO",
      "   oO      Oo ",
      "    'oOOOo'  ",
      "     /| |\\   ",
      "    / | | \\  ",
    ],
    // Frame 5: happy sway left
    [
      "   .oOo.     ",
      "  oO    Oo   ",
      "oO  ● ●  Oo  ",
      "oO   ‿   Oo  ",
      " oO      Oo  ",
      "  'oOOOo'   ",
      "   /| |\\    ",
      "  / | | \\   ",
    ],
  ]
};
```

**Step 2: Create src/animations/thinking.js**

```javascript
export const thinking = {
  fps: 4,
  frames: [
    // Frame 0: pondering, sparkle 1
    [
      "  ✦ .oOo.    ",
      "  oO    Oo   ",
      " oO  ◉ ◉  Oo ",
      " Oo   ..   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|   |/   ",
      "    |   |    ",
    ],
    // Frame 1: pondering, sparkle 2
    [
      "    .oOo. ✧  ",
      "  oO    Oo   ",
      " oO  ◉  ◉ Oo ",
      " Oo   ..   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|   |/   ",
      "    |   |    ",
    ],
    // Frame 2: eyes up thinking
    [
      " ✧  .oOo.    ",
      "  oO    Oo   ",
      " oO  ◦ ◦  Oo ",
      " Oo   ..   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|   |    ",
      "    |   |    ",
    ],
    // Frame 3: sparkle burst
    [
      "  ✦ .oOo. ✦  ",
      "  oO    Oo   ",
      " oO  ◉ ◉  Oo ",
      " Oo   ~~   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    |   |/   ",
      "    |   |    ",
    ],
  ]
};
```

**Step 3: Create src/animations/coding.js**

```javascript
export const coding = {
  fps: 6,
  frames: [
    // Frame 0: typing left hand
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ▪ ▪  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|  |\\   ",
      "    ⌨~~|    ",
    ],
    // Frame 1: typing right hand
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ▪ ▪  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   /|  |/    ",
      "    |~~⌨    ",
    ],
    // Frame 2: focused
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ● ●  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|  |\\   ",
      "    ⌨~~⌨   ",
    ],
    // Frame 3: glance at work
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ▪ ▪  Oo ",
      " Oo   ‿   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   /|  |\\    ",
      "    ⌨~~|    ",
    ],
  ]
};
```

**Step 4: Create src/animations/researching.js**

```javascript
export const researching = {
  fps: 3,
  frames: [
    // Frame 0: reading, eyes scanning
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO ● ●   Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   /| |\\    ",
      "   📖 | |    ",
    ],
    // Frame 1: eyes scanning right
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ● ●  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   /| |\\    ",
      "   📖 | |    ",
    ],
    // Frame 2: eyes scanning left
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO   ● ● Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   /| |\\    ",
      "   📖 | |    ",
    ],
    // Frame 3: eureka moment
    [
      "  ! .oOo.    ",
      "  oO    Oo   ",
      " oO  ◉ ◉  Oo ",
      " Oo   oo   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   /| |\\    ",
      "   📖 | |    ",
    ],
  ]
};
```

**Step 5: Create src/animations/bash.js**

```javascript
export const bash = {
  fps: 5,
  frames: [
    // Frame 0: terminal mode
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ⊙ ⊙  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|  |/   ",
      "    >_  |    ",
    ],
    // Frame 1: executing
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ⊙ ⊙  Oo ",
      " Oo   ‿   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|  |/   ",
      "    >█  |    ",
    ],
    // Frame 2: watching output
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ● ●  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|  |/   ",
      "    >_█ |    ",
    ],
    // Frame 3: done!
    [
      "    .oOo.  ✓ ",
      "  oO    Oo   ",
      " oO  ● ●  Oo ",
      " Oo   ‿   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "   \\|  |/   ",
      "    >_  |    ",
    ],
  ]
};
```

**Step 6: Create src/animations/listening.js**

```javascript
export const listening = {
  fps: 3,
  frames: [
    // Frame 0: attentive
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ◉ ◉  Oo ",
      " Oo   __   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    /| |\\    ",
      "   / | | \\   ",
    ],
    // Frame 1: perked, leaning in
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ◉ ◉  Oo ",
      " Oo   ‿   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    /| |\\    ",
      "   / | | \\   ",
    ],
    // Frame 2: nod
    [
      "    .oOo.    ",
      "  oO    Oo   ",
      " oO  ● ●  Oo ",
      " Oo   ‿   oO ",
      "  oO      Oo  ",
      "   'oOOOo'   ",
      "    /| |\\    ",
      "   / | | \\   ",
    ],
  ]
};
```

**Step 7: Commit**

```bash
git add src/animations/
git commit -m "feat: add ASCII animation frames for all states"
```

---

### Task 3: Animation Engine & Renderer

**Files:**
- Create: `src/animation-engine.js`
- Modify: `src/renderer.js`

**Step 1: Create src/animation-engine.js**

```javascript
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
```

**Step 2: Rewrite src/renderer.js**

```javascript
import { AnimationEngine } from './animation-engine.js';

const buddyEl = document.getElementById('buddy');
const engine = new AnimationEngine(buddyEl);

// Start with idle animation
engine.start();

// Dragging support
let isDragging = false;
let dragStartX, dragStartY;

document.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isDragging = true;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.screenX - dragStartX;
    const dy = e.screenY - dragStartY;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    // Move window via main process
    window.moveBy(dx, dy);
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

// Right-click context menu
document.addEventListener('contextmenu', async (e) => {
  e.preventDefault();
  const prefs = await window.claude.getPrefs();
  showContextMenu(prefs);
});

function showContextMenu(prefs) {
  // Remove existing menu
  const existing = document.getElementById('ctx-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'ctx-menu';
  menu.innerHTML = `
    <div class="ctx-item" data-action="scale-up">Bigger</div>
    <div class="ctx-item" data-action="scale-down">Smaller</div>
    <div class="ctx-separator"></div>
    <div class="ctx-item" data-action="toggle-top">${prefs.alwaysOnTop ? '✓ ' : '  '}Always on Top</div>
    <div class="ctx-item" data-action="toggle-mute">${prefs.muted ? '✓ ' : '  '}Muted</div>
    <div class="ctx-item ctx-volume">
      <label>Vol</label>
      <input type="range" min="0" max="100" value="${Math.round((prefs.volume || 0.2) * 100)}" id="vol-slider">
    </div>
    <div class="ctx-separator"></div>
    <div class="ctx-item" data-action="close">Close</div>
  `;
  document.body.appendChild(menu);

  // Position menu
  menu.style.position = 'fixed';
  menu.style.left = '10px';
  menu.style.top = '10px';

  // Handlers
  menu.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    switch (action) {
      case 'scale-up':
        await window.claude.setScale(Math.min((prefs.scale || 1) + 0.2, 3.0));
        break;
      case 'scale-down':
        await window.claude.setScale(Math.max((prefs.scale || 1) - 0.2, 0.4));
        break;
      case 'toggle-top':
        await window.claude.setAlwaysOnTop(!prefs.alwaysOnTop);
        break;
      case 'toggle-mute':
        await window.claude.savePrefs({ muted: !prefs.muted });
        break;
      case 'close':
        await window.claude.closeApp();
        break;
    }
    menu.remove();
  });

  const slider = document.getElementById('vol-slider');
  if (slider) {
    slider.addEventListener('input', async (e) => {
      await window.claude.savePrefs({ volume: parseInt(e.target.value) / 100 });
    });
    // Stop drag when interacting with slider
    slider.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  // Close menu on click outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

// Scroll wheel to resize
document.addEventListener('wheel', async (e) => {
  const prefs = await window.claude.getPrefs();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.max(0.4, Math.min(3.0, (prefs.scale || 1) + delta));
  await window.claude.setScale(newScale);
});

// Export engine for detector to use
window._buddyEngine = engine;
```

**Step 3: Add context menu styles to src/styles.css**

Append to existing styles.css:

```css
#ctx-menu {
  background: rgba(30, 20, 10, 0.92);
  border: 1px solid #e8a44a;
  border-radius: 6px;
  padding: 4px 0;
  min-width: 150px;
  z-index: 1000;
  -webkit-app-region: no-drag;
}

.ctx-item {
  padding: 6px 14px;
  color: #e8a44a;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  cursor: pointer;
}

.ctx-item:hover {
  background: rgba(232, 164, 74, 0.2);
}

.ctx-separator {
  height: 1px;
  background: #e8a44a44;
  margin: 4px 0;
}

.ctx-volume {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctx-volume input[type="range"] {
  width: 80px;
  accent-color: #e8a44a;
}
```

**Step 4: Test animations**

Run: `cd /c/Projects/claude-buddy && npm start`
Expected: Character shows idle animation cycling through frames. Right-click shows context menu. Drag works. Scroll wheel resizes.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add animation engine, context menu, drag and resize"
```

---

### Task 4: Claude Code State Detector

**Files:**
- Create: `src/detector.js`
- Modify: `src/renderer.js`

**Step 1: Create src/detector.js**

```javascript
// Watches Claude Code JSONL logs and emits state changes
// Log format: each line is JSON with message.content array
// Tool calls have type:"tool_use" with name field

export class ClaudeDetector {
  constructor(logsPath) {
    this.logsPath = logsPath;
    this.watcher = null;
    this.onState = null;
    this.lastActivity = 0;
    this.idleTimeout = 10000; // 10s no activity = idle
    this.idleTimer = null;
    this.filePositions = new Map(); // track read position per file
  }

  // Tool name to animation state mapping
  static TOOL_MAP = {
    'Read': 'researching',
    'Grep': 'researching',
    'Glob': 'researching',
    'WebFetch': 'researching',
    'WebSearch': 'researching',
    'Edit': 'coding',
    'Write': 'coding',
    'NotebookEdit': 'coding',
    'Bash': 'bash',
    'Task': 'thinking',
    'AskUserQuestion': 'listening',
  };

  async start() {
    // Dynamic import for chokidar (CommonJS in Electron)
    const chokidar = require('chokidar');
    const path = require('path');
    const fs = require('fs');

    const globPattern = path.join(this.logsPath, '**', '*.jsonl');

    this.watcher = chokidar.watch(globPattern, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
    });

    // On new or changed JSONL files
    this.watcher.on('change', (filePath) => {
      this._readNewLines(filePath, fs);
    });

    this.watcher.on('add', (filePath) => {
      // New session started
      const stat = fs.statSync(filePath);
      this.filePositions.set(filePath, stat.size);
      this._emitState('listening');
    });

    // Start idle timer
    this._resetIdleTimer();
  }

  _readNewLines(filePath, fs) {
    const prevPos = this.filePositions.get(filePath) || 0;
    const stat = fs.statSync(filePath);
    if (stat.size <= prevPos) return;

    const stream = fs.createReadStream(filePath, {
      start: prevPos,
      encoding: 'utf8',
    });

    let buffer = '';
    stream.on('data', (chunk) => { buffer += chunk; });
    stream.on('end', () => {
      this.filePositions.set(filePath, stat.size);
      const lines = buffer.split('\n').filter(l => l.trim());
      for (const line of lines) {
        this._parseLine(line);
      }
    });
  }

  _parseLine(line) {
    try {
      const entry = JSON.parse(line);
      const content = entry?.message?.content;
      if (!Array.isArray(content)) return;

      for (const block of content) {
        if (block.type === 'tool_use') {
          const state = ClaudeDetector.TOOL_MAP[block.name];
          if (state) {
            this._emitState(state);
            return;
          }
        }
        if (block.type === 'text' && block.text) {
          // Claude is generating text = thinking
          this._emitState('thinking');
          return;
        }
      }

      // User message = listening
      if (entry?.type === 'human' || entry?.message?.role === 'user') {
        this._emitState('listening');
      }
    } catch {
      // Skip unparseable lines
    }
  }

  _emitState(state) {
    this.lastActivity = Date.now();
    this._resetIdleTimer();
    if (this.onState) this.onState(state);
  }

  _resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.onState) this.onState('idle');
    }, this.idleTimeout);
  }

  stop() {
    if (this.watcher) this.watcher.close();
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }
}
```

**Step 2: Wire detector into renderer.js**

Add to the end of `src/renderer.js`:

```javascript
// Initialize Claude Code detector
async function initDetector() {
  const logsPath = await window.claude.getClaudeLogsPath();
  const { ClaudeDetector } = await import('./detector.js');
  const detector = new ClaudeDetector(logsPath);

  detector.onState = (state) => {
    engine.setState(state);
  };

  await detector.start();
}

initDetector().catch(console.error);
```

**Step 3: Update preload.js to expose require for chokidar**

The detector needs `require` access for chokidar and fs. Update preload to expose these:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claude', {
  getPrefs: () => ipcRenderer.invoke('get-prefs'),
  savePrefs: (prefs) => ipcRenderer.invoke('save-prefs', prefs),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('set-always-on-top', value),
  setScale: (scale) => ipcRenderer.invoke('set-scale', scale),
  closeApp: () => ipcRenderer.invoke('close-app'),
  getClaudeLogsPath: () => ipcRenderer.invoke('get-claude-logs-path'),
});

// Expose Node modules needed by detector
contextBridge.exposeInMainWorld('nodeRequire', {
  chokidar: () => require('chokidar'),
  fs: () => require('fs'),
  path: () => require('path'),
});
```

Update detector.js to use `window.nodeRequire` instead of bare `require`.

**Step 4: Test detector**

Run: `cd /c/Projects/claude-buddy && npm start`
Then use Claude Code in another terminal — the buddy should change animations when you use different tools.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Claude Code log detector for real-time state changes"
```

---

### Task 5: Sound System

**Files:**
- Create: `src/sounds.js`
- Modify: `src/renderer.js`

**Step 1: Create src/sounds.js — Procedural sounds via Web Audio API**

```javascript
export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.volume = 0.2;
    this.muted = false;
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }
  setMuted(m) { this.muted = m; }

  _gain() {
    if (!this.ctx || this.muted) return null;
    const gain = this.ctx.createGain();
    gain.gain.value = this.volume;
    gain.connect(this.ctx.destination);
    return gain;
  }

  // Soft click for coding/typing
  playTyping() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800 + Math.random() * 400;
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  // Gentle blip for thinking
  playThinking() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.15);
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Whoosh for researching
  playResearching() {
    const g = this._gain(); if (!g) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    noise.connect(filter);
    filter.connect(g);
    noise.start();
  }

  // Terminal beep for bash
  playBash() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 440;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g2.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.08);
    osc.connect(g2);
    g2.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Gentle chime for listening
  playListening() {
    const g = this._gain(); if (!g) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.1);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.4, this.ctx.currentTime);
    env.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.25);
    osc.connect(env);
    env.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Play sound for state
  playForState(state) {
    if (!this.ctx) this.init();
    switch (state) {
      case 'coding': this.playTyping(); break;
      case 'thinking': this.playThinking(); break;
      case 'researching': this.playResearching(); break;
      case 'bash': this.playBash(); break;
      case 'listening': this.playListening(); break;
    }
  }
}
```

**Step 2: Wire sound system into renderer.js**

Add to renderer.js after engine creation:

```javascript
import { SoundSystem } from './sounds.js';

const sounds = new SoundSystem();

// Connect to animation engine state changes
engine.onStateChange = (state) => {
  sounds.playForState(state);
};

// Load sound prefs
window.claude.getPrefs().then(prefs => {
  sounds.setVolume(prefs.volume ?? 0.2);
  sounds.setMuted(prefs.muted ?? false);
});
```

Update context menu volume slider and mute toggle to also update `sounds`:

```javascript
// In toggle-mute handler:
sounds.setMuted(!prefs.muted);

// In vol-slider handler:
sounds.setVolume(parseInt(e.target.value) / 100);
```

**Step 3: Test sounds**

Run: `npm start` — right-click to adjust volume. Use Claude Code to trigger state changes and hear sounds.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add procedural sound effects via Web Audio API"
```

---

### Task 6: Polish & Final Integration

**Files:**
- Modify: `main.js`
- Modify: `src/renderer.js`
- Modify: `src/styles.css`

**Step 1: Add window bounce on state change**

In renderer.js, add a subtle CSS animation when state changes:

```javascript
engine.onStateChange = (state) => {
  sounds.playForState(state);
  buddyEl.classList.add('state-change');
  setTimeout(() => buddyEl.classList.remove('state-change'), 300);
};
```

In styles.css:
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.state-change {
  animation: bounce 0.3s ease;
}
```

**Step 2: Add app icon and About info**

In the right-click menu, add About showing:
```
Claude Buddy v1.0
Your desktop companion ♥
```

**Step 3: Ensure dragging doesn't interfere with transparent areas**

In main.js, set up proper mouse forwarding:
```javascript
mainWindow.setIgnoreMouseEvents(false);
```

The `-webkit-app-region: drag` in CSS handles the rest.

**Step 4: Final test**

Run: `npm start`
Verify:
- [x] Character animates in idle state
- [x] Drag works
- [x] Right-click menu works (close, resize, volume, mute, always-on-top)
- [x] Scroll wheel resizes
- [x] Claude Code detection triggers animation changes
- [x] Sounds play at set volume
- [x] Position saved between restarts
- [x] Transparent background

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish animations, add bounce transitions and about"
```

---

## Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | Project scaffolding + Electron window | Foundation |
| 2 | ASCII animation frames (6 states) | Art |
| 3 | Animation engine + renderer + context menu | Core |
| 4 | Claude Code log detector | Intelligence |
| 5 | Procedural sound system | Audio |
| 6 | Polish & integration | Final |
