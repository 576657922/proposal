/**
 * Micro-interactions — card tilt, arrow bounce, magnetic buttons.
 * All effects guarded for pointer:fine devices only.
 */

import gsap from 'gsap';

/**
 * 3D tilt on .skill-cell elements following mouse position.
 */
export function initCardTilt() {
    if (!matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('.skill-cell').forEach(cell => {
        cell.addEventListener('mousemove', (e) => {
            const rect = cell.getBoundingClientRect();
            const deltaX = (e.clientX - rect.left) / rect.width - 0.5;
            const deltaY = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(cell, {
                rotateX: deltaY * -12,
                rotateY: deltaX * 12,
                duration: 0.4,
                ease: 'power2.out',
            });
        });

        cell.addEventListener('mouseleave', () => {
            gsap.to(cell, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.3)',
            });
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

    // Build a flat list of { el, threshold, strength }
    const items = [];
    magneticTargets.forEach(({ selector, threshold, strength }) => {
        document.querySelectorAll(selector).forEach(el => {
            items.push({ el, threshold, strength, active: false });
        });
    });

    document.addEventListener('mousemove', (e) => {
        items.forEach(item => {
            const rect = item.el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < item.threshold) {
                item.active = true;
                gsap.to(item.el, {
                    x: dx * item.strength,
                    y: dy * item.strength,
                    duration: 0.3,
                    ease: 'power3.out',
                });
            } else if (item.active) {
                item.active = false;
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
