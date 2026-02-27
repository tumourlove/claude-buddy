import { SceneEngine, STATIONS, SCENE_SIZE } from './scene-engine.js';
import { SmokeEffect } from './smoke-effect.js';
import { MoodEffects } from './mood-effects.js';
import { SoundSystem } from './sounds.js';

const buddyEl = document.getElementById('buddy');
const engine = new SceneEngine(buddyEl);
const smoke = new SmokeEffect();
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
    engine.loadImage('wall', '../assets/scene/wall-background.png'),
    engine.loadImage('workbench', '../assets/scene/workbench.png'),
    engine.loadImage('bookshelf', '../assets/scene/bookshelf.png'),
    engine.loadImage('terminal', '../assets/scene/terminal.png'),
    engine.loadImage('armchair', '../assets/scene/armchair.png'),
    engine.loadImage('stool', '../assets/scene/stool.png'),
    engine.loadImage('hammock', '../assets/scene/hammock.png'),
  ]);

  // Load animation frames
  const [
    pushingEastFrames,
    pickingUpWestFrames,
    breathingIdleWestFrames,
    breathingIdleEastFrames,
    walkingWestFrames,
    walkingEastFrames,
  ] = await Promise.all([
    loadAnimFrames(engine, 'pushing', 'east', 6),
    loadAnimFrames(engine, 'picking-up', 'west', 5),
    loadAnimFrames(engine, 'breathing-idle', 'west', 4),
    loadAnimFrames(engine, 'breathing-idle', 'east', 4),
    loadAnimFrames(engine, 'walking', 'west', 6),
    loadAnimFrames(engine, 'walking', 'east', 6),
  ]);

  // Register animation variants per state
  engine.registerAnimations('coding', [
    { frames: pushingEastFrames, fps: 6 },
  ]);
  engine.registerAnimations('researching', [
    { frames: pickingUpWestFrames, fps: 5 },
  ]);
  engine.registerAnimations('bash', [
    { frames: pushingEastFrames, fps: 6 },
  ]);
  engine.registerAnimations('thinking', [
    { frames: breathingIdleWestFrames, fps: 4 },
  ]);
  engine.registerAnimations('listening', [
    { frames: breathingIdleWestFrames, fps: 4 },
  ]);
  engine.registerAnimations('idle', [
    { frames: breathingIdleEastFrames, fps: 4 },
  ]);

  // Register furniture positions (name, x, y, zIndex)
  engine.addFurniture('bookshelf', 30, 40, 40);
  engine.addFurniture('terminal', 310, 30, 30);
  engine.addFurniture('armchair', 30, 180, 180);
  engine.addFurniture('workbench', 260, 160, 160);
  engine.addFurniture('stool', 80, 300, 300);
  engine.addFurniture('hammock', 280, 310, 310);

  // Set showRoom from preferences
  engine.setShowRoom(prefs.showRoom !== false);

  // Wire effects callback
  engine.onRenderEffects = (ctx, charPos, scale) => {
    smoke.update(charPos.x, charPos.y);
    smoke.render(ctx, scale);
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

  // Adjust smoke intensity based on mood
  if (mood === 'frustrated') {
    smoke.setIntensity(2.0);
  } else if (mood === 'excited') {
    smoke.setIntensity(1.5);
  } else if (mood === 'sleepy') {
    smoke.setIntensity(0.3);
  } else {
    smoke.setIntensity(1.0);
  }
});

window.claude.onScaleChanged((scale) => {
  engine.setScale(scale);
});

window.claude.onShowRoomChanged((show) => {
  engine.setShowRoom(show);
});

// ── Dragging support ──────────────────────────────────────────────────
// Uses IPC to move window via main process so it works across monitor boundaries

let isDragging = false;
let dragOffsetX, dragOffsetY;

document.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isDragging = true;
    dragOffsetX = e.clientX;
    dragOffsetY = e.clientY;
  }
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const newX = e.screenX - dragOffsetX;
    const newY = e.screenY - dragOffsetY;
    window.claude.moveWindow(newX, newY);
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('blur', () => {
  isDragging = false;
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
