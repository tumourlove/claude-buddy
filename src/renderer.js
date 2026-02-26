import { AnimationEngine } from './animation-engine.js';

const buddyEl = document.getElementById('buddy');
const engine = new AnimationEngine(buddyEl);
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
    window.moveBy(dx, dy);
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});

window.addEventListener('blur', () => {
  isDragging = false;
});

// Right-click context menu
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
    <div class="ctx-item" data-action="toggle-mute">${prefs.muted ? '\u2713 ' : '  '}Muted</div>
    <div class="ctx-item ctx-volume">
      <label>Vol</label>
      <input type="range" min="0" max="100" value="${Math.round((prefs.volume || 0.2) * 100)}" id="vol-slider">
    </div>
    <div class="ctx-separator"></div>
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
      case 'toggle-mute':
        await window.claude.savePrefs({ muted: !prefs.muted });
        break;
      case 'close':
        await window.claude.closeApp();
        break;
    }
    closeMenuHandler();
  });

  const slider = document.getElementById('vol-slider');
  if (slider) {
    slider.addEventListener('input', async (e) => {
      await window.claude.savePrefs({ volume: parseInt(e.target.value) / 100 });
    });
    slider.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  document.addEventListener('click', handleOutsideClick);
}

// Scroll wheel to resize
document.addEventListener('wheel', async (e) => {
  const prefs = await window.claude.getPrefs();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.max(0.4, Math.min(3.0, (prefs.scale || 1) + delta));
  await window.claude.setScale(newScale);
});

// Listen for Claude Code state changes from main process
window.claude.onStateChange((state) => {
  engine.setState(state);
});
