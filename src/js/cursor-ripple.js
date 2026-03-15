/**
 * Cursor Glow Trail — visible energy trail on dark backgrounds.
 *
 * Renders a glowing cursor trail on a separate Canvas 2D overlay.
 * Does NOT touch the Three.js render pipeline — no scene distortion.
 *
 * Technique:
 *   - Track mouse position + velocity
 *   - Spawn trail points with velocity-based spread
 *   - Each point = radial gradient dot, additively composited
 *   - Fade with time → organic dissipating glow
 *   - Canvas overlay with pointer-events: none
 */

export class CursorRipple {
  /**
   * @param {HTMLElement} [container=document.body] - parent to append canvas
   * @param {Object} [opts]
   * @param {string} [opts.color='232,255,71']       - RGB string for glow (default: #e8ff47)
   * @param {number} [opts.trailLength=50]           - max trail points alive
   * @param {number} [opts.pointLife=800]             - point lifetime in ms
   * @param {number} [opts.baseRadius=60]             - base glow radius in px
   * @param {number} [opts.intensity=0.4]             - peak alpha (0-1)
   * @param {number} [opts.velocityScale=2.5]         - radius boost from speed
   * @param {number} [opts.spawnRate=3]               - points per mousemove
   */
  constructor(container, opts = {}) {
    // Allow (renderer, scene, camera, opts) signature for backwards compat
    if (container && container.domElement) {
      opts = arguments[3] || {};
      container = null;
    }

    this.disabled = false;

    this.color = opts.color || '232,255,71';
    this.trailLength = opts.trailLength || 50;
    this.pointLife = opts.pointLife || 800;
    this.baseRadius = opts.baseRadius || 60;
    this.intensity = opts.intensity || 0.4;
    this.velocityScale = opts.velocityScale || 2.5;
    this.spawnRate = opts.spawnRate || 3;

    // State
    this.points = [];
    this.mx = 0;
    this.my = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.vx = 0;
    this.vy = 0;
    this.active = false;

    if (this.disabled) return; // No canvas, no events on touch devices

    // Create overlay canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
    `;
    this.ctx = this.canvas.getContext('2d');

    const parent = container || document.body;
    parent.appendChild(this.canvas);

    this._resize();

    // Events
    this._onMove = this._handleMove.bind(this);
    this._onLeave = this._handleLeave.bind(this);
    this._onResize = this._resize.bind(this);

    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseleave', this._onLeave);
    window.addEventListener('resize', this._onResize);
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.dpr = dpr;
  }

  _handleMove(e) {
    this.prevX = this.mx;
    this.prevY = this.my;
    this.mx = e.clientX;
    this.my = e.clientY;
    this.vx = this.mx - this.prevX;
    this.vy = this.my - this.prevY;
    this.active = true;

    // Spawn trail points along the movement vector
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const count = Math.min(this.spawnRate, Math.ceil(speed / 4));

    for (let i = 0; i < count; i++) {
      const t = (i + 1) / count;
      const x = this.prevX + this.vx * t;
      const y = this.prevY + this.vy * t;

      // Add some randomness perpendicular to direction
      const angle = Math.atan2(this.vy, this.vx);
      const spread = Math.min(speed * 0.15, 8);
      const perpX = Math.cos(angle + Math.PI / 2) * (Math.random() - 0.5) * spread;
      const perpY = Math.sin(angle + Math.PI / 2) * (Math.random() - 0.5) * spread;

      this.points.push({
        x: x + perpX,
        y: y + perpY,
        born: performance.now(),
        speed: Math.min(speed, 80),
        vx: this.vx * 0.3,
        vy: this.vy * 0.3,
      });
    }

    // Trim old points
    while (this.points.length > this.trailLength) {
      this.points.shift();
    }
  }

  _handleLeave() {
    this.active = false;
  }

  /** Call once per rAF. Does NOT call renderer.render — call that yourself. */
  update() {
    if (this.disabled) return;
    const ctx = this.ctx;
    const dpr = this.dpr;
    const now = performance.now();

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.points.length === 0) return;

    // Use lighter composite for additive glow
    ctx.globalCompositeOperation = 'screen';

    // Draw each point as a radial gradient
    let alive = 0;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const age = now - p.born;
      if (age > this.pointLife) continue;

      const life = 1 - age / this.pointLife;

      // Ease out curve for fade
      const alpha = life * life * this.intensity;
      if (alpha < 0.001) continue;

      // Drift with initial velocity (decaying)
      const drift = Math.pow(0.96, age / 16);
      const px = (p.x + p.vx * (age / 16) * drift) * dpr;
      const py = (p.y + p.vy * (age / 16) * drift) * dpr;

      // Radius grows slightly with speed, shrinks with age
      const speedFactor = 1 + (p.speed / 80) * this.velocityScale;
      const r = this.baseRadius * dpr * speedFactor * (0.4 + life * 0.6);

      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, `rgba(${this.color}, ${alpha * 0.9})`);
      grad.addColorStop(0.3, `rgba(${this.color}, ${alpha * 0.4})`);
      grad.addColorStop(0.7, `rgba(${this.color}, ${alpha * 0.08})`);
      grad.addColorStop(1, `rgba(${this.color}, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
      alive++;
    }

    // Purge dead points periodically
    if (alive < this.points.length * 0.3) {
      this.points = this.points.filter(p => (now - p.born) < this.pointLife);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  resize() {
    if (this.disabled) return;
    this._resize();
  }

  dispose() {
    if (this.disabled) return;
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseleave', this._onLeave);
    window.removeEventListener('resize', this._onResize);
    this.canvas.remove();
  }
}
