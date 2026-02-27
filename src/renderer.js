import { SceneEngine, STATIONS, SCENE_SIZE } from './scene-engine.js';
// SmokeEffect removed — goblin has no chimney
import { MoodEffects } from './mood-effects.js';
import { SoundSystem } from './sounds.js';

const buddyEl = document.getElementById('buddy');
const engine = new SceneEngine(buddyEl);
// No smoke effect for cyberpunk goblin
const moodFx = new MoodEffects();
const sounds = new SoundSystem();

// ── Image loading helper ──────────────────────────────────────────────

async function loadAnimFrames(engine, anim, direction, frameCount) {
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    const name = `${anim}-${direction}-${i}`;
    const path = `../assets/sprites/animations/${anim}/${direction}/frame_${String(i).padStart(3, '0')}.png`;
    const img = await engine.loadImage(name, path);
    frames.push(img);
  }
  return frames;
}

// ── Initialization ────────────────────────────────────────────────────

async function init() {
  const prefs = await window.claude.getPrefs();

  // Load sound preferences
  sounds.setVolume(prefs.volume ?? 0.2);
  sounds.setMuted(prefs.muted ?? false);

  // Load scene images (paths relative to src/ where index.html lives)
  await Promise.all([
    engine.loadImage('clawd-sw', '../assets/sprites/clawd-sw.png'),
    engine.loadImage('clawd-se', '../assets/sprites/clawd-se.png'),
    engine.loadImage('floor', '../assets/scene/floor-tile.png'),
    engine.loadImage('workbench', '../assets/scene/workbench.png'),
    engine.loadImage('bookshelf', '../assets/scene/bookshelf.png'),
    engine.loadImage('terminal', '../assets/scene/terminal.png'),
    engine.loadImage('armchair', '../assets/scene/armchair.png'),
    engine.loadImage('stool', '../assets/scene/stool.png'),
    engine.loadImage('hammock', '../assets/scene/hammock.png'),
  ]);

  // Load animation frames — try each set, skip if not found yet
  async function tryLoadAnimFrames(engine, anim, direction, frameCount) {
    try {
      return await loadAnimFrames(engine, anim, direction, frameCount);
    } catch {
      console.warn(`Animation not ready: ${anim}/${direction}`);
      return null;
    }
  }

  // Load all 4 directions for both animations
  const [
    breathingIdleNorthFrames,
    breathingIdleSouthFrames,
    breathingIdleWestFrames,
    breathingIdleEastFrames,
    walkingNorthFrames,
    walkingSouthFrames,
    walkingWestFrames,
    walkingEastFrames,
  ] = await Promise.all([
    tryLoadAnimFrames(engine, 'breathing-idle', 'north', 4),
    tryLoadAnimFrames(engine, 'breathing-idle', 'south', 4),
    tryLoadAnimFrames(engine, 'breathing-idle', 'west', 4),
    tryLoadAnimFrames(engine, 'breathing-idle', 'east', 4),
    tryLoadAnimFrames(engine, 'walking', 'north', 6),
    tryLoadAnimFrames(engine, 'walking', 'south', 6),
    tryLoadAnimFrames(engine, 'walking', 'west', 6),
    tryLoadAnimFrames(engine, 'walking', 'east', 6),
  ]);

  // Helper to filter null entries
  const validVariants = (arr) => arr.filter(v => v.frames != null);

  // Register walking animations for all 4 directions (used automatically during movement)
  engine.registerAnimations('walking-n', validVariants([
    { frames: walkingNorthFrames, fps: 8 },
  ]));
  engine.registerAnimations('walking-s', validVariants([
    { frames: walkingSouthFrames, fps: 8 },
  ]));
  engine.registerAnimations('walking-se', validVariants([
    { frames: walkingEastFrames, fps: 8 },
  ]));
  engine.registerAnimations('walking-sw', validVariants([
    { frames: walkingWestFrames, fps: 8 },
  ]));

  // Each state faces a different direction for variety
  engine.registerAnimations('coding', validVariants([
    { frames: breathingIdleEastFrames, fps: 4 },
  ]));
  engine.registerAnimations('researching', validVariants([
    { frames: breathingIdleNorthFrames, fps: 4 },
  ]));
  engine.registerAnimations('bash', validVariants([
    { frames: breathingIdleSouthFrames, fps: 4 },
  ]));
  engine.registerAnimations('thinking', validVariants([
    { frames: breathingIdleWestFrames, fps: 4 },
  ]));
  engine.registerAnimations('listening', validVariants([
    { frames: breathingIdleSouthFrames, fps: 4 },
  ]));
  engine.registerAnimations('idle', validVariants([
    { frames: breathingIdleEastFrames, fps: 4 },
  ]));

  // Register furniture — default positions inside the diamond
  // Diamond center=(240,260), the floor area is roughly x:80-400, y:170-350
  // Shift+click to drag and rearrange! Positions auto-save.
  engine.addFurniture('bookshelf', 140, 170);   // back-left
  engine.addFurniture('terminal', 270, 165);    // back-right
  engine.addFurniture('workbench', 260, 220);   // mid-right (coding)
  engine.addFurniture('armchair', 140, 230);    // mid-left (thinking)
  engine.addFurniture('stool', 175, 280);       // front-left (listening)
  engine.addFurniture('hammock', 250, 275);     // front-right (idle)

  // Load saved furniture positions (overrides defaults)
  if (prefs.furniturePositions) {
    engine.loadFurniturePositions(prefs.furniturePositions);
  }

  // Set showRoom from preferences
  engine.setShowRoom(prefs.showRoom !== false);

  // Wire effects callback (mood particles only, no smoke)
  engine.onRenderEffects = (ctx, charPos, scale) => {
    moodFx.update(charPos.x, charPos.y);
    moodFx.render(ctx, scale);
  };

  // Apply initial scale
  engine.setScale(prefs.scale || 1);

  // Start the engine
  engine.start();
}

// ── State change sound callback ───────────────────────────────────────

engine.onStateChange = (state) => {
  sounds.playForState(state);
  buddyEl.classList.add('state-change');
  setTimeout(() => buddyEl.classList.remove('state-change'), 300);
};

// ── IPC Listeners ─────────────────────────────────────────────────────

window.claude.onStateChange((state) => {
  engine.setState(state);
});

window.claude.onMoodChange((mood) => {
  engine.setMood(mood);
  moodFx.setMood(mood);
  sounds.playForMood(mood);

});

window.claude.onScaleChanged((scale) => {
  engine.setScale(scale);
});

window.claude.onShowRoomChanged((show) => {
  engine.setShowRoom(show);
});

// ── Dragging support ──────────────────────────────────────────────────
// Left-click: drag window. Shift+left-click: drag furniture props.

let isDragging = false;
let dragOffsetX, dragOffsetY;
let draggingFurniture = null;
let furnitureDragOffsetX = 0;
let furnitureDragOffsetY = 0;

function canvasToScene(clientX, clientY) {
  const rect = buddyEl.getBoundingClientRect();
  const scale = engine.scale;
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top) / scale,
  };
}

document.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;

  if (e.shiftKey) {
    // Shift+click: try to grab a furniture piece
    const scene = canvasToScene(e.clientX, e.clientY);
    const hit = engine.furnitureAt(scene.x, scene.y);
    if (hit) {
      draggingFurniture = hit;
      furnitureDragOffsetX = scene.x - hit.x;
      furnitureDragOffsetY = scene.y - hit.y;
      e.preventDefault();
      return;
    }
  }

  // Normal click: drag window
  isDragging = true;
  dragOffsetX = e.clientX;
  dragOffsetY = e.clientY;
});

document.addEventListener('mousemove', (e) => {
  if (draggingFurniture) {
    const scene = canvasToScene(e.clientX, e.clientY);
    engine.moveFurniture(
      draggingFurniture,
      scene.x - furnitureDragOffsetX,
      scene.y - furnitureDragOffsetY,
    );
    return;
  }
  if (isDragging) {
    const newX = e.screenX - dragOffsetX;
    const newY = e.screenY - dragOffsetY;
    window.claude.moveWindow(newX, newY);
  }
  // Show grab cursor when hovering over furniture with shift held
  if (e.shiftKey) {
    const scene = canvasToScene(e.clientX, e.clientY);
    const hit = engine.furnitureAt(scene.x, scene.y);
    document.body.style.cursor = hit ? 'grab' : 'default';
  } else {
    document.body.style.cursor = 'default';
  }
});

document.addEventListener('mouseup', () => {
  if (draggingFurniture) {
    // Save furniture positions to prefs
    const positions = engine.getFurniturePositions();
    window.claude.savePrefs({ furniturePositions: positions });
    draggingFurniture = null;
    return;
  }
  isDragging = false;
});

window.addEventListener('blur', () => {
  isDragging = false;
  draggingFurniture = null;
});

// ── Right-click context menu ──────────────────────────────────────────

document.addEventListener('contextmenu', async (e) => {
  e.preventDefault();
  const prefs = await window.claude.getPrefs();
  showContextMenu(prefs);
});

function showContextMenu(prefs) {
  const existing = document.getElementById('ctx-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'ctx-menu';
  menu.innerHTML = `
    <div class="ctx-item" data-action="scale-up">Bigger</div>
    <div class="ctx-item" data-action="scale-down">Smaller</div>
    <div class="ctx-separator"></div>
    <div class="ctx-item" data-action="toggle-top">${prefs.alwaysOnTop ? '\u2713 ' : '  '}Always on Top</div>
    <div class="ctx-item" data-action="toggle-room">${prefs.showRoom !== false ? '\u2713 ' : '  '}Show Room</div>
    <div class="ctx-item" data-action="toggle-mute">${prefs.muted ? '\u2713 ' : '  '}Muted</div>
    <div class="ctx-item ctx-volume">
      <label>Vol</label>
      <input type="range" min="0" max="100" value="${Math.round((prefs.volume || 0.2) * 100)}" id="vol-slider">
    </div>
    <div class="ctx-separator"></div>
    <div class="ctx-item" data-action="about">About</div>
    <div class="ctx-item" data-action="close">Close</div>
  `;
  document.body.appendChild(menu);

  menu.style.position = 'fixed';
  menu.style.left = '10px';
  menu.style.top = '10px';

  const closeMenuHandler = () => {
    if (document.body.contains(menu)) menu.remove();
    document.removeEventListener('click', handleOutsideClick);
  };

  const handleOutsideClick = (e) => {
    if (!menu.contains(e.target)) closeMenuHandler();
  };

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
      case 'toggle-room': {
        const newShow = prefs.showRoom === false ? true : false;
        engine.setShowRoom(newShow);
        await window.claude.setShowRoom(newShow);
        break;
      }
      case 'toggle-mute':
        await window.claude.savePrefs({ muted: !prefs.muted });
        sounds.setMuted(!prefs.muted);
        break;
      case 'about': {
        const about = document.createElement('div');
        about.id = 'about-overlay';
        about.innerHTML = `
          <div class="about-box">
            <pre>Claude Buddy v1.0</pre>
            <p>Your desktop companion ♥</p>
            <p class="about-close">click to close</p>
          </div>
        `;
        about.addEventListener('click', () => about.remove());
        document.body.appendChild(about);
        break;
      }
      case 'close':
        await window.claude.closeApp();
        break;
    }
    closeMenuHandler();
  });

  const slider = document.getElementById('vol-slider');
  if (slider) {
    let volSaveTimeout;
    slider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value) / 100;
      sounds.setVolume(vol);
      clearTimeout(volSaveTimeout);
      volSaveTimeout = setTimeout(() => {
        window.claude.savePrefs({ volume: vol });
      }, 300);
    });
    slider.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  document.addEventListener('click', handleOutsideClick);
}

// ── Scroll wheel to resize ────────────────────────────────────────────

document.addEventListener('wheel', async (e) => {
  const prefs = await window.claude.getPrefs();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.max(0.4, Math.min(3.0, (prefs.scale || 1) + delta));
  await window.claude.setScale(newScale);
});

// ── Start ─────────────────────────────────────────────────────────────

init().catch((err) => {
  console.error('Failed to initialize Claude Buddy renderer:', err);
});
