/**
 * Blueprint: draggable 3D ID badge on a lanyard.
 * Verlet rope chain — 14 nodes hang from a fixed anchor above the viewport.
 * After the preloader exits the badge is *thrown* in from above the screen
 * top: a long, visible accelerating fall, then the rope snaps taut with a
 * 15–18% overshoot, yanks the card back and rebounds once or twice (rubber
 * band) before settling into a decaying side swing.
 * The strap renders as three co-located paths (edge / core / highlight) whose
 * shared `d` is a Catmull-Rom spline through the chain. DOM + CSS 3D only.
 */

export function initBadge() {
    const wrap = document.getElementById('badgeWrap');
    const card = document.getElementById('badgeCard');
    const strapLines = document.querySelectorAll('.badge-strap .strap-line');
    if (!wrap || !card || !strapLines.length) return;
    if (window.innerWidth <= 900) return; // hero is too crowded on small screens

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- rope chain ----
    const N = 14;                // nodes: 0 = anchor, N-1 = card hook
    const E = N - 1;
    const ROPE = 240;            // lanyard rest length (px) — card hangs at
                                 // y ≈ 170, safely below the ~70px nav
    const SEG = ROPE / E;        // per-segment rest length
    const ITER = 4;              // constraint relaxation passes
    const G = 0.9;               // gravity per frame²
    const CARD_G = 1.6;          // extra gravity factor on the hook (card mass)
    const FRICTION = 0.982;
    const MAX_SPEED = 38;        // per-node, per-frame — keeps verlet stable
                                 // at low frame rates and tames wild throws

    // entrance: thrown in from above the screen top
    const DROP_FROM = -260;      // hook start y — card fully offscreen
    const THROW_VY = 12;         // initial downward speed (px/sub-step)
    const THROW_VX = -5;         // slight sideways toss → first swing
    const FALL_MAX = 19;         // terminal velocity during the fall — keeps
                                 // the ~430px plunge readable (~0.4s)
    const OVERSHOOT = 0.16;      // rope stretch at the snap (15–18%)
    const SNAP_DECAY = 0.86;     // overshoot recovery per sub-step (slower →
                                 // the rubber-band contraction is visible)
    const SNAP_BOUNCE = 1.38;    // radial velocity removal at the hard stop:
                                 // 38% bounces back → 1–2 decaying re-stretches

    // inverse-mass weights: anchor pinned, hook node carries the card weight
    const W = new Float64Array(N);
    for (let i = 1; i < N; i++) W[i] = 1;
    W[E] = 0.35;

    // pre-allocated state: positions + previous positions (verlet)
    const x = new Float64Array(N), y = new Float64Array(N);
    const ox = new Float64Array(N), oy = new Float64Array(N);

    // Anchor sits above the viewport so the strap appears from offscreen
    let ax = 0;
    const ay = -70;
    function layout() {
        ax = Math.min(window.innerWidth * 0.80, window.innerWidth - 170);
    }
    layout();
    window.addEventListener('resize', layout);

    let active = false;
    let snapped = false;   // rope has gone taut once since the throw
    let stretch = 0;       // currently allowed overshoot fraction

    // parked offscreen above the anchor until the preloader lets go
    function park() {
        for (let i = 0; i < N; i++) {
            x[i] = ax; ox[i] = ax;
            y[i] = ay - 260 - i * 4; oy[i] = y[i];
        }
        y[0] = ay; oy[0] = ay;
    }
    park();

    // hurl the chain in from above the screen top: the card leads, the slack
    // rope folded over the anchor unspools and whips behind it
    function throwIn() {
        for (let i = 0; i < N; i++) {
            const t = i / E;
            // chain runs from the anchor *up* to the offscreen card, with a
            // small zigzag so the slack folds open naturally
            x[i] = ax + Math.sin(i * 1.7) * 6 * t;
            y[i] = ay + (DROP_FROM - ay) * t;
            ox[i] = x[i] - THROW_VX * t;
            oy[i] = y[i] - THROW_VY * t;
        }
        snapped = false;
        stretch = OVERSHOOT;
        active = true;
    }

    // static hang (reduced motion): straight down, at rest
    function rest() {
        for (let i = 0; i < N; i++) {
            x[i] = ax; ox[i] = ax;
            y[i] = ay + SEG * i; oy[i] = y[i];
        }
        snapped = true;
        stretch = 0;
        active = true;
    }

    // ---- drag ----
    let dragging = false, pointerId = null;
    let grabDx = 0, grabDy = 0, tx = 0, ty = 0;

    card.addEventListener('pointerdown', (e) => {
        if (!active) return;
        dragging = true;
        pointerId = e.pointerId;
        card.setPointerCapture(e.pointerId);
        const r = card.getBoundingClientRect();
        grabDx = e.clientX - (r.left + r.width / 2);
        grabDy = e.clientY - r.top;
        tx = e.clientX;
        ty = e.clientY;
        card.classList.add('grabbed');
        e.preventDefault();
    });
    card.addEventListener('pointermove', (e) => {
        if (dragging && e.pointerId === pointerId) {
            tx = e.clientX;
            ty = e.clientY;
        }
    });
    const release = (e) => {
        if (dragging && e.pointerId === pointerId) {
            dragging = false;
            card.classList.remove('grabbed');
        }
    };
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);

    // ---- physics ----
    function step() {
        x[0] = ax; y[0] = ay; ox[0] = ax; oy[0] = ay;

        // integrate free nodes — before the rope first snaps taut the fall
        // is capped at terminal velocity so the plunge stays readable
        const cap = snapped ? MAX_SPEED : FALL_MAX;
        for (let i = 1; i < N; i++) {
            if (dragging && i === E) continue;
            let vx = (x[i] - ox[i]) * FRICTION;
            let vy = (y[i] - oy[i]) * FRICTION;
            const sp = Math.hypot(vx, vy);
            if (sp > cap) {
                vx *= cap / sp;
                vy *= cap / sp;
            }
            ox[i] = x[i]; oy[i] = y[i];
            x[i] += vx;
            y[i] += vy + (i === E ? G * CARD_G : G);
        }

        if (dragging) {
            // critically-damped follow; verlet velocity falls out of (p - op)
            ox[E] = x[E]; oy[E] = y[E];
            x[E] += (tx - grabDx - x[E]) * 0.5;
            y[E] += (ty - grabDy - y[E]) * 0.5;
        }

        // segment constraints — pull only (a rope never pushes), so slack
        // sections fold and waves travel down the chain when it's whipped
        const seg = SEG * (1 + stretch);
        for (let k = 0; k < ITER; k++) {
            for (let i = 0; i < E; i++) {
                const j = i + 1;
                let dx = x[j] - x[i], dy = y[j] - y[i];
                const d = Math.hypot(dx, dy) || 1e-6;
                if (d <= seg) continue;
                const wi = W[i];
                const wj = (dragging && j === E) ? 0 : W[j];
                const ws = wi + wj;
                if (!ws) continue;
                const f = (d - seg) / d / ws;
                dx *= f; dy *= f;
                x[i] += dx * wi; y[i] += dy * wi;
                x[j] -= dx * wj; y[j] -= dy * wj;
            }
        }

        if (!dragging) {
            // global hard stop: the rope arrests the card with a jolt
            const dxE = x[E] - ax, dyE = y[E] - ay;
            const dE = Math.hypot(dxE, dyE) || 1e-6;
            const maxLen = ROPE * (1 + stretch);
            if (dE > maxLen) {
                const k = (dE - maxLen) / dE;
                x[E] -= dxE * k;
                y[E] -= dyE * k;
                // kill the outgoing radial velocity (and bounce a sliver of
                // it back) — turns the fall into tangential swing energy
                const nx = dxE / dE, ny = dyE / dE;
                let vx = x[E] - ox[E], vy = y[E] - oy[E];
                const vr = vx * nx + vy * ny;
                if (vr > 0) {
                    vx -= vr * nx * SNAP_BOUNCE;
                    vy -= vr * ny * SNAP_BOUNCE;
                    ox[E] = x[E] - vx;
                    oy[E] = y[E] - vy;
                }
            }
            if (!snapped && dE >= ROPE) snapped = true;
            if (snapped && stretch > 0) {
                stretch *= SNAP_DECAY;               // elastic snap-back
                if (stretch < 0.004) stretch = 0;
            }
            // never let the card fly above its anchor — but only once the
            // entrance fall is over (it legitimately starts up there)
            if (snapped && y[E] < ay + 60) y[E] = ay + 60;
        }
    }

    // ---- render ----
    let rotZ = 0, rotY = 0, rotX = 0;

    function render() {
        // shared strap path: Catmull-Rom → cubic bezier through the chain
        let d = 'M' + x[0].toFixed(1) + ' ' + y[0].toFixed(1);
        for (let i = 0; i < E; i++) {
            const p0 = i > 0 ? i - 1 : 0;
            const p3 = i < E - 1 ? i + 2 : E;
            d += 'C' + (x[i] + (x[i + 1] - x[p0]) / 6).toFixed(1)
               + ' ' + (y[i] + (y[i + 1] - y[p0]) / 6).toFixed(1)
               + ' ' + (x[i + 1] - (x[p3] - x[i]) / 6).toFixed(1)
               + ' ' + (y[i + 1] - (y[p3] - y[i]) / 6).toFixed(1)
               + ' ' + x[i + 1].toFixed(1) + ' ' + y[i + 1].toFixed(1);
        }
        for (let i = 0; i < strapLines.length; i++) {
            strapLines[i].setAttribute('d', d);
        }

        // card pose: hang along the last rope segments (smoothed)…
        const ddx = x[E] - x[E - 2];
        const ddy = Math.max(y[E] - y[E - 2], 8); // avoid spin when horizontal
        const tz = Math.max(-70, Math.min(70, Math.atan2(ddx, ddy) * (180 / Math.PI)));
        rotZ += (tz - rotZ) * 0.3;
        // …sideways speed twists it in 3D, vertical speed pitches it
        // (extra pitch headroom during the entrance fall: thrown, not placed)
        const vx = x[E] - ox[E], vy = y[E] - oy[E];
        const xLim = snapped ? 12 : 22;
        rotY += (Math.max(-40, Math.min(40, vx * 3.4)) - rotY) * 0.4;
        rotX += (Math.max(-xLim, Math.min(xLim, -vy * 1.3)) - rotX) * 0.4;

        card.style.transform =
            `translate(${x[E].toFixed(1)}px, ${y[E].toFixed(1)}px) translateX(-50%)` +
            ` rotateZ(${rotZ.toFixed(2)}deg)` +
            ` rotateY(${rotY.toFixed(2)}deg)` +
            ` rotateX(${rotX.toFixed(2)}deg)`;
        // bare number for the CSS gloss layer
        card.style.setProperty('--roty', rotY.toFixed(2));
    }

    // ---- loop ----
    // Fixed-timestep accumulator: the verlet constants are tuned for 60Hz
    // sub-steps, so the swing feels identical on a 30fps laptop, a 120Hz
    // display, or a throttled tab — frame time is converted into N sub-steps.
    let rafId = null;
    let lastT = 0;
    let acc = 0;
    const DT = 1000 / 60;
    const MAX_STEPS = 5;

    function tick(now) {
        rafId = requestAnimationFrame(tick);

        // fade out in sync with the hero zoom; skip physics when invisible
        const sp = window.scrollY / window.innerHeight;
        const o = Math.max(0, 1 - sp * 1.6);
        wrap.style.opacity = o.toFixed(3);
        if (o <= 0.01) {
            wrap.style.visibility = 'hidden';
            return;
        }
        wrap.style.visibility = 'visible';

        const t = now ?? performance.now();
        if (!lastT) lastT = t;
        let frame = t - lastT;
        lastT = t;
        if (frame > 200) frame = 200; // long stall: don't fast-forward the sim
        acc += frame;

        let steps = 0;
        while (acc >= DT && steps < MAX_STEPS) {
            if (active) step();
            acc -= DT;
            steps++;
        }
        if (steps === MAX_STEPS) acc = 0; // drop the remainder, stay realtime

        render();
    }

    function start() {
        if (reduced) rest();    // no drop-in: settle instantly at rest
        else throwIn();
    }

    // Drop in shortly after the preloader leaves
    if (document.body.classList.contains('is-loading')) {
        const mo = new MutationObserver(() => {
            if (!document.body.classList.contains('is-loading')) {
                mo.disconnect();
                setTimeout(start, 500);
            }
        });
        mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } else {
        setTimeout(start, 600);
    }

    // pause loop in hidden tabs
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (rafId !== null) cancelAnimationFrame(rafId);
            rafId = null;
        } else if (rafId === null) {
            lastT = 0; // don't integrate the hidden time
            tick();
        }
    });

    tick();
}
