const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

class TrayManager {
  constructor(window, { getPrefs, savePrefs, getStats, checkForUpdates, installUpdate }) {
    this.window = window;
    this.getPrefs = getPrefs;
    this.savePrefs = savePrefs;
    this.getStats = getStats;
    this.checkForUpdates = checkForUpdates;
    this.installUpdate = installUpdate;
    this.tray = null;

    const assetsDir = path.join(__dirname, '..', 'assets', 'tray');
    this.connectedIcon = nativeImage.createFromPath(path.join(assetsDir, 'clawd-face.png'));
    // Create a dimmed version for disconnected state
    const disconnectedImg = nativeImage.createFromPath(path.join(assetsDir, 'clawd-face.png'));
    const size = disconnectedImg.getSize();
    if (size.width > 0) {
      const buf = disconnectedImg.toBitmap();
      for (let i = 3; i < buf.length; i += 4) {
        buf[i] = Math.floor(buf[i] * 0.4); // reduce alpha to 40%
      }
      this.disconnectedIcon = nativeImage.createFromBitmap(buf, size);
    } else {
      this.disconnectedIcon = disconnectedImg;
    }

    this.connected = false;
    // Update states: null, 'downloading', 'ready', 'current', 'error'
    this.updateStatus = null;
    this.updateVersion = null;
    this.downloadPercent = 0;
    this._createTray();

    // Refresh menu every 30s to update stats
    this._refreshInterval = setInterval(() => this._updateMenu(), 30000);
  }

  _createTray() {
    this.tray = new Tray(this.disconnectedIcon);
    this.tray.setToolTip('Claude Buddy - Disconnected');
    this._updateMenu();

    this.tray.on('click', () => {
      if (this.window.isVisible()) {
        this.window.hide();
      } else {
        this.window.show();
      }
    });
  }

  _getUpdateMenuItem() {
    switch (this.updateStatus) {
      case 'downloading':
        return { label: `Downloading v${this.updateVersion}... ${this.downloadPercent}%`, enabled: false };
      case 'ready':
        return { label: `Restart to update to v${this.updateVersion}`, click: () => {
          this.installUpdate();
        }};
      case 'current':
        return { label: 'Up to date!', enabled: false };
      case 'error':
        return { label: 'Update failed — Check for Updates', click: () => {
          this.updateStatus = null;
          this.checkForUpdates();
        }};
      default:
        return { label: 'Check for Updates', click: () => {
          this.checkForUpdates();
        }};
    }
  }

  _updateMenu() {
    const prefs = this.getPrefs();
    const stats = this.getStats();
    const summary = stats.getSummary();
    const topTools = stats.getTopTools(5);

    const statusLabel = this.connected ? 'Status: Connected' : 'Status: Disconnected';
    const toggleLabel = this.window.isVisible() ? 'Hide' : 'Show';
    const loginSettings = app.getLoginItemSettings();

    const statsSubmenu = [
      { label: `Session: ${formatDuration(summary.sessionDuration)}`, enabled: false },
      { label: `Tool calls: ${summary.toolCalls}`, enabled: false },
      { label: `Flow time: ${formatDuration(summary.flowDuration)}`, enabled: false },
    ];

    if (topTools.length > 0) {
      statsSubmenu.push({ type: 'separator' });
      for (const [name, count] of topTools) {
        statsSubmenu.push({ label: `${name}: ${count}`, enabled: false });
      }
    }

    const menu = Menu.buildFromTemplate([
      this._getUpdateMenuItem(),
      { type: 'separator' },
      { label: toggleLabel, click: () => {
        if (this.window.isVisible()) {
          this.window.hide();
        } else {
          this.window.show();
        }
      }},
      { type: 'separator' },
      { label: statusLabel, enabled: false },
      { type: 'separator' },
      { label: 'Always on Top', type: 'checkbox', checked: prefs.alwaysOnTop !== false,
        click: (item) => {
          this.window.setAlwaysOnTop(item.checked);
          this.savePrefs({ alwaysOnTop: item.checked });
          this.window.webContents.send('setting-changed', { alwaysOnTop: item.checked });
        }},
      { label: 'Show Room', type: 'checkbox', checked: prefs.showRoom !== false,
        click: (item) => {
          this.savePrefs({ showRoom: item.checked });
          this.window.webContents.send('show-room-changed', item.checked);
        }},
      { label: 'Start with Windows', type: 'checkbox', checked: loginSettings.openAtLogin,
        click: (item) => {
          app.setLoginItemSettings({ openAtLogin: item.checked });
        }},
      { type: 'separator' },
      { label: 'Session Stats', submenu: statsSubmenu },
      { type: 'separator' },
      { label: 'Quit', click: () => {
        this.window._forceQuit = true;
        app.quit();
      }},
    ]);

    this.tray.setContextMenu(menu);
  }

  setUpdateStatus(status, version) {
    this.updateStatus = status;
    if (version) this.updateVersion = version;
    this._updateMenu();
  }

  setDownloadProgress(percent) {
    this.downloadPercent = percent;
    this._updateMenu();
  }

  updateIcon(connected) {
    this.connected = connected;
    this.tray.setImage(connected ? this.connectedIcon : this.disconnectedIcon);
    const stats = this.getStats();
    const statsLine = stats.getTooltipLine();
    this.tray.setToolTip(`Claude Buddy - ${connected ? 'Connected' : 'Disconnected'} | ${statsLine}`);
    this._updateMenu();
  }

  destroy() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = { TrayManager };
