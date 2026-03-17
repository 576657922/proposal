/**
 * particles.js — Canvas 2D background effects for Skills & Contact sections.
 * Deliberately avoids Three.js / WebGL to prevent multi-context conflicts.
 */

// ─── helpers ────────────────────────────────────────────────────────
function getAccentColor() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    // Convert hex like #e8ff47 → "232,255,71"
    if (raw.startsWith('#')) {
        const hex = raw.slice(1);
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r},${g},${b}`;
    }
    return '232,255,71'; // fallback
}

// ─── Particle Field (Skills section) ────────────────────────────────
export class ParticleField {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.active = false;
        this.rafId = null;
        this.accentRGB = getAccentColor();
        this.PARTICLE_COUNT = 50;
        this.CONNECTION_DIST = 120;

        this._resize();
        this._initParticles();

        this._onResize = this._resize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    _resize() {
        const section = this.canvas.parentElement;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const w = section.offsetWidth;
        const h = section.offsetHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = w;
        this.h = h;
    }

    _initParticles() {
        this.particles = [];
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            this.particles.push({
                x: Math.random() * (this.w || 800),
                y: Math.random() * (this.h || 600),
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 1.8 + 0.8,
            });
        }
    }

    start() {
        if (this.active) return;
        this.active = true;
        this._resize();
        // Re-scatter particles on first activation if canvas size changed
        if (this.particles.length === 0 || this.particles[0].x > this.w * 1.5) {
            this._initParticles();
        }
        this._loop();
    }

    stop() {
        this.active = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    _loop() {
        if (!this.active) return;
        this.rafId = requestAnimationFrame(() => this._loop());
        this._update();
        this._draw();
    }

    _update() {
        const { particles, w, h } = this;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            // Wrap around edges
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            if (p.y < -10) p.y = h + 10;
            if (p.y > h + 10) p.y = -10;
        }
    }

    _draw() {
        const { ctx, particles, w, h, accentRGB, CONNECTION_DIST } = this;
        ctx.clearRect(0, 0, w, h);

        // Draw connections
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
                    ctx.strokeStyle = `rgba(${accentRGB},${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw particles (glowing dots)
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            // Outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentRGB},0.06)`;
            ctx.fill();
            // Core dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentRGB},0.45)`;
            ctx.fill();
        }
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this._onResize);
    }
}

// ─── Wave Mesh (Contact section) ────────────────────────────────────
export class WaveMesh {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.active = false;
        this.rafId = null;
        this.time = 0;
        this.accentRGB = getAccentColor();
        this.COLS = 20;
        this.ROWS = 10;

        this._resize();
        this._onResize = this._resize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    _resize() {
        const section = this.canvas.parentElement;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const w = section.offsetWidth;
        const h = section.offsetHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.w = w;
        this.h = h;
    }

    start() {
        if (this.active) return;
        this.active = true;
        this._resize();
        this._loop();
    }

    stop() {
        this.active = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    _loop() {
        if (!this.active) return;
        this.rafId = requestAnimationFrame(() => this._loop());
        this.time += 0.015;
        this._draw();
    }

    _draw() {
        const { ctx, w, h, COLS, ROWS, accentRGB, time } = this;
        ctx.clearRect(0, 0, w, h);

        const spacingX = w / (COLS - 1);
        const spacingY = h / (ROWS - 1);
        const dotRadius = 1.5;

        // Build grid positions with wave displacement
        const points = [];
        for (let r = 0; r < ROWS; r++) {
            points[r] = [];
            for (let c = 0; c < COLS; c++) {
                const baseX = c * spacingX;
                const baseY = r * spacingY;
                const wave = Math.sin(c * 0.4 + time + r * 0.3) * 12
                           + Math.sin(r * 0.5 + time * 0.7) * 6;
                points[r][c] = { x: baseX, y: baseY + wave };
            }
        }

        // Draw grid lines (horizontal)
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = `rgba(${accentRGB},0.08)`;
        for (let r = 0; r < ROWS; r++) {
            ctx.beginPath();
            for (let c = 0; c < COLS; c++) {
                const p = points[r][c];
                if (c === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Draw grid lines (vertical)
        for (let c = 0; c < COLS; c++) {
            ctx.beginPath();
            for (let r = 0; r < ROWS; r++) {
                const p = points[r][c];
                if (r === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
        }

        // Draw dots at intersections
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const p = points[r][c];
                ctx.beginPath();
                ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${accentRGB},0.2)`;
                ctx.fill();
            }
        }
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this._onResize);
    }
}
