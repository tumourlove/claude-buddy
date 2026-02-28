const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { ClaudeDetector } = require('./src/detector.js');
const { TrayManager } = require('./src/tray-manager.js');
const { StatsTracker } = require('./src/stats-tracker.js');
const { UpdateChecker } = require('./src/update-checker.js');

const PREFS_PATH = path.join(app.getPath('userData'), 'preferences.json');

function loadPrefs() {
  try {
    return JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8'));
  } catch {
    return { x: undefined, y: undefined, scale: 1.0, volume: 0.2, muted: false, alwaysOnTop: true, showRoom: true };
  }
}

function savePrefs(prefs) {
  fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2));
}

let mainWindow;
let prefs;
let detector;
let trayManager;
let stats;
let updateChecker;

function createWindow() {
  prefs = loadPrefs();

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const winW = Math.round(480 * prefs.scale);
  const winH = Math.round(480 * prefs.scale);

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: prefs.x ?? screenW - winW - 50,
    y: prefs.y ?? screenH - winH - 50,
    transparent: true,
    frame: false,
    alwaysOnTop: prefs.alwaysOnTop !== false,
    resizable: true,
    minimizable: false,
    maximizable: false,
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
  mainWindow.setIgnoreMouseEvents(false);

  // Start Claude Code log detector
  const home = require('os').homedir();
  const logsPath = path.join(home, '.claude', 'projects');
  stats = new StatsTracker();
  detector = new ClaudeDetector(logsPath);
  detector.onToolCall = (toolName) => {
    stats.recordToolCall(toolName);
  };
  detector.onState = (state) => {
    stats.recordStateChange(state);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('claude-state', state);
    }
  };
  detector.onConnected = (connected) => {
    if (trayManager) trayManager.updateIcon(connected);
  };
  detector.onMood = (mood) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('claude-mood', mood);
    }
  };
  detector.onFlow = (flowing) => {
    stats.recordFlowChange(flowing);
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
  detector.start();

  // Create system tray
  trayManager = new TrayManager(mainWindow, {
    getPrefs: () => prefs,
    savePrefs: (p) => { Object.assign(prefs, p); savePrefs(prefs); },
    getStats: () => stats,
    checkForUpdates: doUpdateCheck,
  });

  // Check for updates on startup
  updateChecker = new UpdateChecker(app.getVersion());
  const doUpdateCheck = () => updateChecker.check();
  doUpdateCheck().then((update) => {
    if (update && trayManager) {
      trayManager.setUpdate(update);
    }
  });

  mainWindow.on('moved', () => {
    const [x, y] = mainWindow.getPosition();
    prefs.x = x;
    prefs.y = y;
    savePrefs(prefs);
  });

  mainWindow.on('close', (e) => {
    if (!mainWindow._forceQuit) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    if (detector) detector.stop();
    if (trayManager) trayManager.destroy();
    mainWindow = null;
  });
}

// Suppress EPIPE errors from console.log when parent process stdout is closed
process.stdout?.on('error', () => {});
process.stderr?.on('error', () => {});

app.whenReady().then(createWindow);
app.on('window-all-closed', (e) => {
  // Don't quit when window is hidden — tray keeps app alive
});
app.on('before-quit', () => {
  if (mainWindow) mainWindow._forceQuit = true;
});

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
  const winW = Math.round(480 * scale);
  const winH = Math.round(480 * scale);
  mainWindow.setResizable(true);
  mainWindow.setSize(winW, winH);
  mainWindow.webContents.send('scale-changed', scale);
  savePrefs(prefs);
});
ipcMain.handle('set-show-room', (_, show) => {
  prefs.showRoom = show;
  savePrefs(prefs);
  mainWindow.webContents.send('show-room-changed', show);
});
ipcMain.handle('close-app', () => { app.quit(); });
ipcMain.handle('move-window', (_, x, y) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setPosition(Math.round(x), Math.round(y));
  }
});
ipcMain.handle('get-claude-logs-path', () => {
  const home = require('os').homedir();
  return path.join(home, '.claude', 'projects');
});
