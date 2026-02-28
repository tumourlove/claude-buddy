const { net, shell } = require('electron');

const REPO = 'tumourlove/claude-buddy';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;

class UpdateChecker {
  constructor(currentVersion) {
    this.currentVersion = currentVersion;
    this.latestVersion = null;
    this.downloadUrl = null;
  }

  check() {
    return new Promise((resolve) => {
      const request = net.request(API_URL);
      request.setHeader('User-Agent', 'claude-buddy');

      let body = '';
      request.on('response', (response) => {
        response.on('data', (chunk) => { body += chunk.toString(); });
        response.on('end', () => {
          try {
            const release = JSON.parse(body);
            const tag = release.tag_name; // e.g. "v1.2.0"
            if (!tag) return resolve(null);

            this.latestVersion = tag.replace(/^v/, '');
            this.downloadUrl = release.html_url;

            if (this._isNewer(this.latestVersion, this.currentVersion)) {
              resolve({ version: this.latestVersion, url: this.downloadUrl });
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      request.on('error', () => resolve(null));
      request.end();
    });
  }

  openDownloadPage() {
    if (this.downloadUrl) {
      shell.openExternal(this.downloadUrl);
    }
  }

  _isNewer(latest, current) {
    const a = latest.split('.').map(Number);
    const b = current.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((a[i] || 0) > (b[i] || 0)) return true;
      if ((a[i] || 0) < (b[i] || 0)) return false;
    }
    return false;
  }
}

module.exports = { UpdateChecker };
