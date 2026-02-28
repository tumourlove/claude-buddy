class StatsTracker {
  constructor() {
    this.sessionStart = Date.now();
    this.toolCalls = 0;
    this.toolBreakdown = {};
    this.stateTime = {};
    this.currentState = 'idle';
    this.stateStartTime = Date.now();
    this.flowDuration = 0;
    this.flowStart = null;
  }

  recordToolCall(toolName) {
    this.toolCalls++;
    this.toolBreakdown[toolName] = (this.toolBreakdown[toolName] || 0) + 1;
  }

  recordStateChange(newState) {
    const now = Date.now();
    const elapsed = now - this.stateStartTime;
    this.stateTime[this.currentState] = (this.stateTime[this.currentState] || 0) + elapsed;
    this.currentState = newState;
    this.stateStartTime = now;
  }

  recordFlowChange(flowing) {
    if (flowing) {
      this.flowStart = Date.now();
    } else if (this.flowStart) {
      this.flowDuration += Date.now() - this.flowStart;
      this.flowStart = null;
    }
  }

  _finalizeFlowDuration() {
    if (this.flowStart) {
      return this.flowDuration + (Date.now() - this.flowStart);
    }
    return this.flowDuration;
  }

  _finalizeStateTime() {
    const times = { ...this.stateTime };
    const elapsed = Date.now() - this.stateStartTime;
    times[this.currentState] = (times[this.currentState] || 0) + elapsed;
    return times;
  }

  getSummary() {
    return {
      sessionDuration: Date.now() - this.sessionStart,
      toolCalls: this.toolCalls,
      toolBreakdown: { ...this.toolBreakdown },
      stateTime: this._finalizeStateTime(),
      flowDuration: this._finalizeFlowDuration(),
    };
  }

  getTopTools(n = 3) {
    return Object.entries(this.toolBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }

  getTooltipLine() {
    const mins = Math.floor((Date.now() - this.sessionStart) / 60000);
    return `${this.toolCalls} tools | ${mins}m session`;
  }
}

module.exports = { StatsTracker };
