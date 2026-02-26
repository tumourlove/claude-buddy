const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { ClaudeDetector } = require('./src/detector.js');

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
let detector;

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
  detector = new ClaudeDetector(logsPath);
  detector.onState = (state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('claude-state', state);
    }
  };
  detector.start();

  mainWindow.on('moved', () => {
    const [x, y] = mainWindow.getPosition();
    prefs.x = x;
    prefs.y = y;
    savePrefs(prefs);
  });

  mainWindow.on('closed', () => {
    if (detector) detector.stop();
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

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
  mainWindow.setResizable(true);
  mainWindow.setSize(winW, winH);
  mainWindow.webContents.send('scale-changed', scale);
  savePrefs(prefs);
});
ipcMain.handle('close-app', () => { app.quit(); });
ipcMain.handle('get-claude-logs-path', () => {
  const home = require('os').homedir();
  return path.join(home, '.claude', 'projects');
});
