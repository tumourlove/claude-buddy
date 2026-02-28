const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claude', {
  getPrefs: () => ipcRenderer.invoke('get-prefs'),
  savePrefs: (prefs) => ipcRenderer.invoke('save-prefs', prefs),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('set-always-on-top', value),
  setScale: (scale) => ipcRenderer.invoke('set-scale', scale),
  closeApp: () => ipcRenderer.invoke('close-app'),
  moveWindow: (x, y) => ipcRenderer.invoke('move-window', x, y),
  getClaudeLogsPath: () => ipcRenderer.invoke('get-claude-logs-path'),
  onStateChange: (callback) => {
    ipcRenderer.removeAllListeners('claude-state');
    ipcRenderer.on('claude-state', (_, state) => callback(state));
  },
  onScaleChanged: (callback) => {
    ipcRenderer.removeAllListeners('scale-changed');
    ipcRenderer.on('scale-changed', (_, scale) => callback(scale));
  },
  onMoodChange: (callback) => {
    ipcRenderer.removeAllListeners('claude-mood');
    ipcRenderer.on('claude-mood', (_, mood) => callback(mood));
  },
  setShowRoom: (show) => ipcRenderer.invoke('set-show-room', show),
  onShowRoomChanged: (callback) => {
    ipcRenderer.removeAllListeners('show-room-changed');
    ipcRenderer.on('show-room-changed', (_, show) => callback(show));
  },
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
});
