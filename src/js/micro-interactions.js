/**
 * Micro-interactions — card tilt, arrow bounce, magnetic buttons.
 * All effects guarded for pointer:fine devices only.
 */

import gsap from 'gsap';

/**
 * 3D tilt on .skill-cell elements following mouse position.
 * RAF-loop spring physics + dynamic shine + dynamic shadow.
 */
export function initCardTilt() {
    if (!matchMedia('(pointer: fine)').matches) return;

    const TILT = {
        maxDeg: 18,
        shinePower: 0.45,
        springStiffness: 0.08,
        returnStiffness: 0.06,
    };

    document.querySelectorAll('.skill-cell').forEach(cell => {
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;
        let isHovering = false;
        let rafId = null;
        const shineEl = cell.querySelector('.card-shine');

        function loop() {
            rafId = requestAnimationFrame(loop);

            const stiffness = isHovering ? TILT.springStiffness : TILT.returnStiffness;
            currentX += (targetX - currentX) * stiffness;
            currentY += (targetY - currentY) * stiffness;

            if (Math.abs(currentX) < 0.01 && Math.abs(currentY) < 0.01 && !isHovering) {
                currentX = 0;
                currentY = 0;
                cancelAnimationFrame(rafId);
                rafId = null;
                cell.style.transform = '';
                if (shineEl) {
                    shineEl.style.setProperty('--shine-opacity', '0');
                }
                return;
            }

            cell.style.transform =
                `perspective(800px) rotateX(${currentX}deg) rotateY(${currentY}deg) translateZ(0)`;

            // Dynamic shine
            if (shineEl) {
                const shineX = 50 - currentY * 2.5;
                const shineY = 50 - currentX * 2.5;
                const intensity = Math.sqrt(currentX ** 2 + currentY ** 2) / TILT.maxDeg;
                shineEl.style.setProperty('--shine-x', shineX + '%');
                shineEl.style.setProperty('--shine-y', shineY + '%');
                shineEl.style.setProperty('--shine-opacity', (intensity * TILT.shinePower).toFixed(3));
            }

            // Dynamic shadow
            const shadowX = currentY * 1.2;
            const shadowY = -currentX * 1.2 + 8;
            const shadowBlur = 20 + Math.abs(currentX + currentY) * 0.8;
            const cardBack = cell.querySelector('.card-back') || cell.querySelector('.card-front');
            if (cardBack) {
                cardBack.style.boxShadow =
                    `inset 0 0 0 7px var(--bg-raised), inset 0 0 0 8px rgba(255,255,255,0.08), ${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.3)`;
            }
        }

        cell.addEventListener('mousemove', (e) => {
            const rect = cell.getBoundingClientRect();
            const dx = (e.clientX - rect.left) / rect.width - 0.5;
            const dy = (e.clientY - rect.top) / rect.height - 0.5;
            targetX = dy * -TILT.maxDeg;
            targetY = dx * TILT.maxDeg;
            isHovering = true;
            if (!rafId) loop();
        });

        cell.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
            isHovering = false;
            // Reset shadow
            const cardBack = cell.querySelector('.card-back') || cell.querySelector('.card-front');
            if (cardBack) {
                cardBack.style.boxShadow = '';
            }
        });
    });
}

/**
 * Bouncy arrow animation on project item hover.
 */
export function initArrowBounce() {
    if (!matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('.project-item').forEach(item => {
        const arrow = item.querySelector('.project-arrow');
        if (!arrow) return;

        item.addEventListener('mouseenter', () => {
            const tl = gsap.timeline();
            tl.to(arrow, { x: 14, rotation: -45, duration: 0.3, ease: 'power2.out' })
              .to(arrow, { x: 8, rotation: -45, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        });

        item.addEventListener('mouseleave', () => {
            gsap.to(arrow, { x: 0, rotation: 0, duration: 0.4, ease: 'power2.out' });
        });
    });
}

/**
 * Magnetic pull effect on buttons and nav links using a single
 * document-level mousemove listener for performance.
 */
export function initMagneticButtons() {
    if (!matchMedia('(pointer: fine)').matches) return;

    const magneticTargets = [
        { selector: '.contact-btn', threshold: 150, strength: 0.35 },
        { selector: '.nav-links a', threshold: 80, strength: 0.25 },
    ];

    // Build a flat list of { el, threshold, strength }.
    // quickTo setters reuse a single tween per element instead of spawning a new
    // gsap.to() on every mousemove, which avoids heavy per-frame tween churn.
    const items = [];
    magneticTargets.forEach(({ selector, threshold, strength }) => {
        document.querySelectorAll(selector).forEach(el => {
            items.push({
                el,
                threshold,
                strength,
                active: false,
                rect: el.getBoundingClientRect(),
                setX: gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' }),
                setY: gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' }),
            });
        });
    });

    // Refresh cached rects on scroll/resize
    const refreshRects = () => {
        items.forEach(item => { item.rect = item.el.getBoundingClientRect(); });
    };
    window.addEventListener('scroll', refreshRects, { passive: true });
    window.addEventListener('resize', refreshRects);

    document.addEventListener('mousemove', (e) => {
        const px = e.clientX;
        const py = e.clientY;
        items.forEach(item => {
            const rect = item.rect;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = px - cx;
            const dy = py - cy;
            const distSq = dx * dx + dy * dy;
            const threshSq = item.threshold * item.threshold;

            if (distSq < threshSq) {
                item.active = true;
                item.setX(dx * item.strength);
                item.setY(dy * item.strength);
            } else if (item.active) {
                item.active = false;
                // Spring back with a one-off elastic tween (overwrites quickTo).
                gsap.to(item.el, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)',
                });
            }
        });
    });
}
