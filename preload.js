const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claude', {
  getPrefs: () => ipcRenderer.invoke('get-prefs'),
  savePrefs: (prefs) => ipcRenderer.invoke('save-prefs', prefs),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('set-always-on-top', value),
  setScale: (scale) => ipcRenderer.invoke('set-scale', scale),
  closeApp: () => ipcRenderer.invoke('close-app'),
  getClaudeLogsPath: () => ipcRenderer.invoke('get-claude-logs-path'),
  onStateChange: (callback) => {
    ipcRenderer.on('claude-state', (_, state) => callback(state));
  },
});
