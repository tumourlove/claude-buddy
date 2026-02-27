/**
 * SmokeEffect — Persistent chimney smoke particle system.
 *
 * Spawns wispy smoke particles from an offset above the character center
 * (the chimney pipe on CLAWD's back). Runs independently of character
 * animation state; intensity can be adjusted by mood.
 */

class SmokeEffect {
  constructor() {
    this.particles = [];
    this.maxParticles = 15;
    this.spawnInterval = 8;   // frames between spawns at intensity 1.0
    this.frameCounter = 0;
    this.intensity = 1.0;

    // Chimney offset relative to character center (scene pixels)
    this.chimneyOffsetX = 0;
    this.chimneyOffsetY = -48;
  }

  /**
   * Set smoke intensity. Affects spawn rate — higher values spawn faster
   * and allow more particles. Clamped to [0.1, 3.0].
   */
  setIntensity(val) {
    this.intensity = Math.max(0.1, Math.min(3.0, val));
    // Adjust spawn interval inversely with intensity
    this.spawnInterval = Math.max(1, Math.round(8 / this.intensity));
  }

  /**
   * Update all particles and conditionally spawn new ones.
   * @param {number} charX — character center X in scene coordinates
   * @param {number} charY — character center Y in scene coordinates
   */
  update(charX, charY) {
    this.frameCounter++;

    // Spawn new particle
    if (this.frameCounter >= this.spawnInterval && this.particles.length < this.maxParticles) {
      this.frameCounter = 0;
      this._spawn(charX, charY);
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      // Movement
      p.x += p.vx;
      p.y += p.vy;

      // Drift: small random horizontal perturbation
      p.vx += (Math.random() - 0.5) * 0.1;

      // Grow slightly
      p.size += 0.15;

      // Fade alpha linearly over lifetime
      p.alpha = Math.max(0, p.startAlpha * (1 - p.life / p.maxLife));

      // Remove dead particles
      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render all smoke particles to the canvas.
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
      ctx.globalAlpha = p.alpha;

      // Outer circle
      ctx.beginPath();
      ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
      ctx.fillStyle = '#c8c0b0';
      ctx.fill();

      // Inner circle — 50% size, 50% alpha
      ctx.globalAlpha = p.alpha * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sSize * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e8e0d0';
      ctx.fill();

      ctx.restore();
    }
  }

  // ── Private ───────────────────────────────────────────────────────

  _spawn(charX, charY) {
    this.particles.push({
      x: charX + this.chimneyOffsetX + (Math.random() * 4 - 2),  // ±2px
      y: charY + this.chimneyOffsetY,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.8 + Math.random() * 0.4),    // -0.8 to -1.2
      size: 3 + Math.random() * 4,          // 3–7px
      alpha: 0.6 + Math.random() * 0.3,     // 0.6–0.9
      startAlpha: 0,                         // set below
      life: 0,
      maxLife: 40 + Math.floor(Math.random() * 21),  // 40–60 frames
    });
    // Cache the initial alpha for linear fade calculation
    const p = this.particles[this.particles.length - 1];
    p.startAlpha = p.alpha;
  }
}

export { SmokeEffect };
