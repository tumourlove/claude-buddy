const MOOD_KEYWORDS = {
  frustrated: {
    patterns: [/let me try/i, /try again/i, /failed/i, /doesn't work/i,
               /not working/i, /unable to/i, /still not/i, /can't seem/i,
               /unfortunately/i, /issue persist/i],
    weight: 1.0,
  },
  celebrating: {
    patterns: [/success/i, /working!/i, /done!/i, /complete/i, /passed/i,
               /fixed/i, /solved/i, /works!/i, /excellent/i, /perfect/i,
               /all tests pass/i, /looks good/i],
    weight: 1.0,
  },
  confused: {
    patterns: [/unexpected/i, /hmm/i, /not sure/i, /strange/i, /odd/i,
               /unclear/i, /doesn't make sense/i, /puzzling/i, /curious/i],
    weight: 1.0,
  },
  excited: {
    patterns: [/great!/i, /awesome/i, /fantastic/i, /found it/i,
               /exactly/i, /brilliant/i, /wonderful/i, /impressive/i,
               /amazing/i, /eureka/i],
    weight: 1.0,
  },
  sleepy: {
    patterns: [],
    weight: 0,
  },
};

class MoodDetector {
  constructor() {
    this.scores = { frustrated: 0, celebrating: 0, confused: 0, excited: 0, sleepy: 0 };
    this.currentMood = null;
    this.history = [];
    this.historyLimit = 20;
    this.decayTimer = null;
    this.decayRate = 0.3;
    this.moodThreshold = 2.0;
    this.onMood = null;

    this._startDecay();
  }

  analyzeEntry(entry) {
    const now = Date.now();
    const content = entry?.message?.content;
    if (!Array.isArray(content)) return;

    for (const block of content) {
      if (block.type === 'text' && block.text) {
        this._scoreText(block.text);
      }

      if (block.type === 'tool_result') {
        if (block.is_error) {
          this.scores.frustrated += 2.0;
        }
        if (typeof block.content === 'string') {
          if (/FAIL|Error:|error:|failed|exception/i.test(block.content)) {
            this.scores.frustrated += 1.0;
          }
          if (/PASS|success|passed|All \d+ tests/i.test(block.content)) {
            this.scores.celebrating += 1.5;
          }
        }
      }

      if (block.type === 'tool_use') {
        this.history.push({ timestamp: now, toolName: block.name });
        if (this.history.length > this.historyLimit) this.history.shift();
      }
    }

    this._analyzePace(now);
    this._analyzeSleepy(now);
    this._evaluate();
  }

  _scoreText(text) {
    for (const [mood, config] of Object.entries(MOOD_KEYWORDS)) {
      for (const pattern of config.patterns) {
        if (pattern.test(text)) {
          this.scores[mood] += config.weight;
        }
      }
    }
  }

  _analyzePace(now) {
    const recent = this.history.filter(e => now - e.timestamp < 10000);
    if (recent.length >= 5) {
      const tools = new Set(recent.map(e => e.toolName));
      if (tools.size >= 4) {
        this.scores.confused += 0.5;
      }
      if (recent.length >= 8 && tools.size <= 2) {
        this.scores.excited += 0.5;
      }
    }
  }

  _analyzeSleepy(now) {
    const hour = new Date().getHours();
    const isLateNight = hour >= 23 || hour < 5;
    if (this.history.length > 0) {
      const lastEvent = this.history[this.history.length - 1];
      const gap = now - lastEvent.timestamp;
      if (gap > 30000 && isLateNight) {
        this.scores.sleepy += 1.0;
      } else if (gap > 60000) {
        this.scores.sleepy += 0.5;
      }
    }
  }

  _evaluate() {
    let bestMood = null;
    let bestScore = this.moodThreshold;
    for (const [mood, score] of Object.entries(this.scores)) {
      if (score > bestScore) {
        bestMood = mood;
        bestScore = score;
      }
    }
    if (bestMood !== this.currentMood) {
      this.currentMood = bestMood;
      if (this.onMood) this.onMood(bestMood);
    }
  }

  _startDecay() {
    this.decayTimer = setInterval(() => {
      for (const mood of Object.keys(this.scores)) {
        if (this.scores[mood] > 0) {
          this.scores[mood] = Math.max(0, this.scores[mood] - this.decayRate);
        }
      }
      this._evaluate();
    }, 1000);
  }

  stop() {
    if (this.decayTimer) clearInterval(this.decayTimer);
  }
}

module.exports = { MoodDetector };
