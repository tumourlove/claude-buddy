const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { MoodDetector } = require('./mood-detector.js');

// Tool name to animation state mapping
const TOOL_MAP = {
  'Read': 'researching',
  'Grep': 'researching',
  'Glob': 'researching',
  'WebFetch': 'researching',
  'WebSearch': 'researching',
  'Edit': 'coding',
  'Write': 'coding',
  'NotebookEdit': 'coding',
  'Bash': 'bash',
  'Task': 'thinking',
  'AskUserQuestion': 'listening',
};

class ClaudeDetector {
  constructor(logsPath) {
    this.logsPath = logsPath;
    this.watcher = null;
    this.onState = null;
    this.onConnected = null;
    this.onMood = null;
    this.moodDetector = new MoodDetector();
    this.moodDetector.onMood = (mood) => {
      if (this.onMood) this.onMood(mood);
    };
    this.lastActivity = 0;
    this.idleTimeout = 10000; // 10s no activity = idle
    this.connectedTimeout = 30000; // 30s no activity = disconnected
    this.idleTimer = null;
    this.connectedTimer = null;
    this.isConnected = false;
    this.filePositions = new Map();
  }

  start() {
    if (!fs.existsSync(this.logsPath)) {
      console.warn(`[claude-buddy] Logs path not found: ${this.logsPath}`);
      this._resetIdleTimer();
      return;
    }

    console.log(`[claude-buddy] Watching logs at: ${this.logsPath}`);

    // Watch the directory itself — glob patterns with ** don't work
    // reliably on Windows with chokidar
    this.watcher = chokidar.watch(this.logsPath, {
      ignoreInitial: false,
      usePolling: true,
      interval: 500,
    });

    this.watcher.on('change', (filePath) => {
      if (!filePath.endsWith('.jsonl')) return;
      this._readNewLines(filePath);
    });

    this.watcher.on('add', (filePath) => {
      if (!filePath.endsWith('.jsonl')) return;
      console.log(`[claude-buddy] Tracking: ${filePath}`);
      try {
        const stat = fs.statSync(filePath);
        this.filePositions.set(filePath, stat.size);
      } catch {}
    });

    this.watcher.on('error', (err) => {
      console.error(`[claude-buddy] Watcher error:`, err);
    });

    this._resetIdleTimer();
  }

  _readNewLines(filePath) {
    try {
      const prevPos = this.filePositions.get(filePath) || 0;
      const stat = fs.statSync(filePath);
      if (stat.size <= prevPos) return;

      const buffer = Buffer.alloc(stat.size - prevPos);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, prevPos);
      fs.closeSync(fd);

      this.filePositions.set(filePath, stat.size);

      const text = buffer.toString('utf8');
      const lines = text.split('\n').filter(l => l.trim());
      for (const line of lines) {
        this._parseLine(line);
      }
    } catch {}
  }

  _parseLine(line) {
    try {
      const entry = JSON.parse(line);
      this.moodDetector.analyzeEntry(entry);
      const content = entry?.message?.content;
      if (!Array.isArray(content)) {
        // User message = listening
        if (entry?.type === 'human' || entry?.message?.role === 'user') {
          this._emitState('listening');
        }
        return;
      }

      for (const block of content) {
        if (block.type === 'tool_use') {
          const state = TOOL_MAP[block.name];
          if (state) {
            this._emitState(state);
            return;
          }
        }
        if (block.type === 'text' && block.text) {
          this._emitState('thinking');
          return;
        }
      }
    } catch {}
  }

  _emitState(state) {
    this.lastActivity = Date.now();
    this._resetIdleTimer();
    this._setConnected(true);
    if (this.onState) this.onState(state);
  }

  _setConnected(connected) {
    if (connected) {
      if (this.connectedTimer) clearTimeout(this.connectedTimer);
      this.connectedTimer = setTimeout(() => {
        this._setConnected(false);
      }, this.connectedTimeout);
    }
    if (connected !== this.isConnected) {
      this.isConnected = connected;
      if (this.onConnected) this.onConnected(connected);
    }
  }

  _resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.onState) this.onState('idle');
    }, this.idleTimeout);
  }

  stop() {
    if (this.watcher) this.watcher.close();
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.connectedTimer) clearTimeout(this.connectedTimer);
    if (this.moodDetector) this.moodDetector.stop();
  }
}

module.exports = { ClaudeDetector };
