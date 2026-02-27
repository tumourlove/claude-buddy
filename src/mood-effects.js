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
};

class MoodEffects {
  constructor() {
    this.particles = [];
    this.mood = null;
    this.config = null;
    this.frameCounter = 0;
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
   * Spawn new particles and advance existing ones.
   * @param {number} charX — character center X in scene coordinates
   * @param {number} charY — character center Y in scene coordinates
   */
  update(charX, charY) {
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
