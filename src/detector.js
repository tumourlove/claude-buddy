const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

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
    this.lastActivity = 0;
    this.idleTimeout = 10000; // 10s no activity = idle
    this.idleTimer = null;
    this.filePositions = new Map();
  }

  start() {
    const globPattern = path.join(this.logsPath, '**', '*.jsonl');

    this.watcher = chokidar.watch(globPattern, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
    });

    this.watcher.on('change', (filePath) => {
      this._readNewLines(filePath);
    });

    this.watcher.on('add', (filePath) => {
      try {
        const stat = fs.statSync(filePath);
        this.filePositions.set(filePath, stat.size);
      } catch {}
      this._emitState('listening');
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
    if (this.onState) this.onState(state);
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
  }
}

module.exports = { ClaudeDetector };
