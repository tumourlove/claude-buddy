/**
 * MoodEffects — Mood-reactive particle effects rendered on top of the character.
 *
 * Each mood type has a distinct visual style: color palette, symbol shape,
 * spawn rate, and max particle count. Particles spawn around the character
 * position with an upward bias, fade over their lifetime, and are removed
 * when expired.
 */

const MOOD_CONFIGS = {
  frustrated: {
    color: '#ff4422',
    secondary: '#cc3311',
    symbol: 'burst',
    spawnRate: 4,
    maxParticles: 12,
  },
  celebrating: {
    color: '#ffd700',
    secondary: '#ffaa00',
    symbol: 'spark',
    spawnRate: 3,
    maxParticles: 20,
  },
  confused: {
    color: '#aa88ff',
    secondary: '#8866dd',
    symbol: 'question',
    spawnRate: 10,
    maxParticles: 5,
  },
  excited: {
    color: '#ff8800',
    secondary: '#ffaa44',
    symbol: 'spark',
    spawnRate: 4,
    maxParticles: 15,
  },
  sleepy: {
    color: '#8888aa',
    secondary: '#aaaacc',
    symbol: 'zzz',
    spawnRate: 20,
    maxParticles: 4,
  },
  determined: {
    color: '#ff6600',
    secondary: '#ff8833',
    symbol: 'burst',
    spawnRate: 5,
    maxParticles: 10,
  },
  proud: {
    color: '#ffd700',
    secondary: '#ffee88',
    symbol: 'spark',
    spawnRate: 8,
    maxParticles: 8,
  },
  curious: {
    color: '#66aaff',
    secondary: '#88ccff',
    symbol: 'question',
    spawnRate: 12,
    maxParticles: 4,
  },
};

class MoodEffects {
  constructor() {
    this.particles = [];
    this.mood = null;
    this.config = null;
    this.frameCounter = 0;
    this.flowActive = false;
    this.flowPhase = 0;
    this.speedLines = [];
    this.charX = 0;
    this.charY = 0;
  }

  /**
   * Set the current mood. Pass null to clear all particles.
   * @param {string|null} mood
   */
  setMood(mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.config = mood ? MOOD_CONFIGS[mood] || null : null;
    if (!this.config) {
      this.particles = [];
    }
    this.frameCounter = 0;
  }

  /**
   * Toggle flow-state aura and speed lines around the character.
   * @param {boolean} active
   */
  setFlow(active) {
    this.flowActive = active;
    if (active && this.speedLines.length === 0) {
      for (let i = 0; i < 5; i++) {
        this.speedLines.push({
          angle: (i / 5) * Math.PI * 2,
          length: 20 + Math.random() * 15,
          speed: 0.02 + Math.random() * 0.01,
        });
      }
    } else if (!active) {
      this.speedLines = [];
    }
  }

  /**
   * Spawn a burst of golden sparks (eureka moment).
   * @param {number} charX
   * @param {number} charY
   */
  triggerEurekaBurst(charX, charY) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: charX + (Math.random() * 10 - 5),
        y: charY - 20 + (Math.random() * 10 - 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 3,
        alpha: 1.0,
        life: 0,
        maxLife: 20 + Math.floor(Math.random() * 15),
        symbol: 'spark',
        color: Math.random() > 0.3 ? '#ffd700' : '#ffffff',
      });
    }
  }

  /**
   * Launch a fountain of multi-colored confetti (victory/celebration).
   * @param {number} charX
   * @param {number} charY
   */
  triggerVictoryConfetti(charX, charY) {
    for (let i = 0; i < 25; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 1.5 + Math.random() * 2.5;
      const colors = ['#ffd700', '#ff8800', '#ff4444', '#44ff44', '#4488ff'];
      this.particles.push({
        x: charX + (Math.random() * 20 - 10),
        y: charY - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        alpha: 1.0,
        life: 0,
        maxLife: 50 + Math.floor(Math.random() * 30),
        symbol: 'spark',
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.05,
      });
    }
  }

  /**
   * Spawn new particles and advance existing ones.
   * @param {number} charX — character center X in scene coordinates
   * @param {number} charY — character center Y in scene coordinates
   */
  update(charX, charY) {
    this.charX = charX;
    this.charY = charY;

    if (!this.config) return;

    this.frameCounter++;

    // Spawn
    if (this.frameCounter >= this.config.spawnRate && this.particles.length < this.config.maxParticles) {
      this.frameCounter = 0;
      this._spawn(charX, charY);
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      if (p.symbol === 'zzz') {
        // Zzz particles drift in a sine wave and grow slowly
        p.x += Math.sin(p.life * 0.1) * 0.3;
        p.y += p.vy;
        p.size += 0.05;
      } else {
        p.x += p.vx;
        p.y += p.vy;
      }

      if (p.gravity) {
        p.vy += p.gravity;
      }

      // Linear alpha fade
      p.alpha = 0.8 * (1 - p.life / p.maxLife);

      // Remove dead particles
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw all mood particles to the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scale — multiply positions and sizes by this factor
   */
  render(ctx, scale) {
    this._renderFlow(ctx, scale);

    if (this.particles.length === 0) return;

    for (const p of this.particles) {
      const sx = p.x * scale;
      const sy = p.y * scale;
      const sSize = p.size * scale;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      switch (p.symbol) {
        case 'zzz':
          ctx.font = `${Math.round(10 * scale)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('z', sx, sy);
          break;

        case 'question':
          ctx.font = `${Math.round(8 * scale)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', sx, sy);
          break;

        case 'spark':
          // Diamond shape — 4-point polygon
          ctx.beginPath();
          ctx.moveTo(sx, sy - sSize);        // top
          ctx.lineTo(sx + sSize, sy);         // right
          ctx.lineTo(sx, sy + sSize);         // bottom
          ctx.lineTo(sx - sSize, sy);         // left
          ctx.closePath();
          ctx.fill();
          break;

        case 'burst':
          // Filled circle
          ctx.beginPath();
          ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    }
  }

  // ── Private ───────────────────────────────────────────────────────

  _renderFlow(ctx, scale) {
    if (!this.flowActive) return;

    this.flowPhase += 0.05;
    const alpha = 0.1 + Math.sin(this.flowPhase) * 0.1;

    const cx = this.charX * scale;
    const cy = this.charY * scale;
    const radius = 40 * scale;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
    grad.addColorStop(1, `rgba(255, 150, 0, 0)`);

    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 1.5})`;
    ctx.lineWidth = 1.5 * scale;
    for (const line of this.speedLines) {
      line.angle += line.speed;
      const innerR = 20 * scale;
      const outerR = (20 + line.length) * scale;
      const x1 = cx + Math.cos(line.angle) * innerR;
      const y1 = cy + Math.sin(line.angle) * innerR;
      const x2 = cx + Math.cos(line.angle) * outerR;
      const y2 = cy + Math.sin(line.angle) * outerR;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  _spawn(charX, charY) {
    const cfg = this.config;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    const useSecondary = Math.random() > 0.5;

    const particle = {
      x: charX + (Math.random() * 16 - 8),
      y: charY + (Math.random() * 8 - 16),
      vx: Math.cos(angle) * speed * 0.5,
      vy: -1 - Math.random() * speed,
      size: 2 + Math.random() * 3,
      alpha: 0.8,
      life: 0,
      maxLife: 30 + Math.floor(Math.random() * 21), // 30–50 frames
      symbol: cfg.symbol,
      color: useSecondary ? cfg.secondary : cfg.color,
    };

    // Zzz overrides: slow upward drift, no horizontal velocity
    if (cfg.symbol === 'zzz') {
      particle.vy = -0.3;
      particle.vx = 0;
    }

    this.particles.push(particle);
  }
}

export { MoodEffects };
