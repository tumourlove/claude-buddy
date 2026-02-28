const { autoUpdater } = require('electron-updater');
const { app } = require('electron');

class UpdateChecker {
  constructor() {
    this.onUpdateAvailable = null;
    this.onUpdateDownloaded = null;
    this.onNoUpdate = null;

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      if (this.onUpdateAvailable) {
        this.onUpdateAvailable(info.version);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      if (this.onUpdateDownloaded) {
        this.onUpdateDownloaded(info.version);
      }
    });

    autoUpdater.on('update-not-available', () => {
      if (this.onNoUpdate) this.onNoUpdate();
    });

    autoUpdater.on('error', (err) => {
      console.log('[claude-buddy] Auto-update error:', err.message);
    });
  }

  check() {
    autoUpdater.checkForUpdates().catch(() => {});
  }

  installAndRestart() {
    autoUpdater.quitAndInstall(false, true);
  }
}

module.exports = { UpdateChecker };
