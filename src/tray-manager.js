const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
  constructor(window) {
    this.window = window;
    this.tray = null;

    const assetsDir = path.join(__dirname, '..', 'assets', 'tray');
    this.connectedIcon = nativeImage.createFromPath(path.join(assetsDir, 'connected.png'));
    this.disconnectedIcon = nativeImage.createFromPath(path.join(assetsDir, 'disconnected.png'));

    this.connected = false;
    this._createTray();
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

  _updateMenu() {
    const statusLabel = this.connected ? 'Status: Connected' : 'Status: Disconnected';
    const toggleLabel = this.window.isVisible() ? 'Hide' : 'Show';

    const menu = Menu.buildFromTemplate([
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
      { label: 'Quit', click: () => {
        this.window._forceQuit = true;
        require('electron').app.quit();
      }},
    ]);

    this.tray.setContextMenu(menu);
  }

  updateIcon(connected) {
    this.connected = connected;
    this.tray.setImage(connected ? this.connectedIcon : this.disconnectedIcon);
    this.tray.setToolTip(`Claude Buddy - ${connected ? 'Connected' : 'Disconnected'}`);
    this._updateMenu();
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = { TrayManager };
