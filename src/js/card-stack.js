/**
 * Card Stack — Lusion-style stacked card carousel with swipe gestures,
 * spring physics, and 3D tilt. Works with pointer events (mouse + touch).
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Spring-like ease (overshoot + damping) ──
const SPRING = 'elastic.out(1, 0.55)';
const SPRING_FAST = 'elastic.out(1, 0.65)';
const SPRING_SOFT = 'elastic.out(0.8, 0.4)';

// ── Stack layout constants ──
const STACK_OFFSET_Y = 12;      // px between stacked cards (vertical peek)
const STACK_OFFSET_X = 0;       // horizontal offset (0 = centered)
const STACK_SCALE_STEP = 0.05;  // scale decrease per depth layer
const STACK_Z_STEP = -30;       // translateZ decrease per layer
const FLY_DISTANCE = 600;       // how far the card flies out (px)
const TILT_MAX = 14;            // max tilt degrees on mouse follow

export function initCardStack() {
    const container = document.querySelector('.card-stack-container');
    if (!container) return;

    const cells = gsap.utils.toArray('.card-stack-container .skill-cell');
    const total = cells.length;
    if (total === 0) return;

    const indicator = container.querySelector('.stack-indicator');
    const dots = indicator ? gsap.utils.toArray(indicator.querySelectorAll('.stack-dot')) : [];

    let activeIndex = 0;
    let isAnimating = false;

    // Pointer / drag state
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentDragX = 0;
    let dragDelta = 0;

    // Flick velocity tracking
    const VELOCITY_THRESHOLD = 0.3; // px/ms
    const FLICK_DISTANCE = 40; // lowered distance threshold
    const velocityHistory = []; // { x, t } last 5 events

    // Tilt state
    let tiltX = 0;
    let tiltY = 0;
    let tiltRafId = null;

    // Flip state per card (for GSAP multi-phase flip)
    const flipStates = cells.map(() => ({ isFlipped: false, isFlipping: false }));

    // ── Arrange cards in the stack ──
    function layoutStack(skipActive) {
        cells.forEach((cell, i) => {
            const offset = ((i - activeIndex) + total) % total;
            const depth = offset === 0 ? 0 : Math.min(offset, 3); // max 3 layers deep

            const props = {
                x: 0,
                y: depth * STACK_OFFSET_Y,
                z: depth * STACK_Z_STEP,
                scale: 1 - depth * STACK_SCALE_STEP,
                rotation: 0,
                rotateX: 0,
                rotateY: 0,
                opacity: depth > 2 ? 0 : 1,
                zIndex: total - depth,
                duration: 0.8,
                ease: SPRING,
                overwrite: 'auto',
            };

            if (skipActive && offset === 0) return;

            gsap.to(cell, props);
        });
    }

    // ── Update indicator dots ──
    function updateIndicator() {
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
        });
    }

    // ── Navigate to next/prev card ──
    function goTo(direction) {
        // direction: 1 = next, -1 = prev
        if (isAnimating) return;
        isAnimating = true;

        // Stop breathing on leaving card
        const leavingCell = cells[activeIndex];
        if (leavingCell._breathTween) {
            leavingCell._breathTween.kill();
            leavingCell._breathTween = null;
        }

        // Reset flip state on leaving card
        const leavingInner = leavingCell.querySelector('.card-inner');
        if (flipStates && flipStates[activeIndex] && flipStates[activeIndex].isFlipped) {
            gsap.set(leavingInner, { rotateY: 0 });
            flipStates[activeIndex].isFlipped = false;
        }

        const flyX = direction > 0 ? -FLY_DISTANCE : FLY_DISTANCE;
        const flyRotation = direction > 0 ? -15 : 15;

        // Fly out the current card with arc trajectory + 3D deflection
        gsap.to(leavingCell, {
            x: flyX,
            y: -40,
            rotation: flyRotation,
            rotateY: direction * -8,
            opacity: 0,
            scale: 0.85,
            duration: 0.5,
            ease: 'power3.in',
            onComplete: () => {
                // Snap the leaving card behind the stack (no transition)
                gsap.set(leavingCell, {
                    x: 0,
                    y: 3 * STACK_OFFSET_Y,
                    rotation: 0,
                    rotateY: 0,
                    opacity: 0,
                    scale: 1 - 3 * STACK_SCALE_STEP,
                    z: 3 * STACK_Z_STEP,
                    zIndex: 0,
                });

                // Update index
                activeIndex = (activeIndex + direction + total) % total;

                // Animate the stack into new positions with depth-based stagger
                cells.forEach((cell, i) => {
                    const offset = ((i - activeIndex) + total) % total;
                    const depth = offset === 0 ? 0 : Math.min(offset, 3);

                    gsap.to(cell, {
                        x: 0,
                        y: depth * STACK_OFFSET_Y,
                        z: depth * STACK_Z_STEP,
                        scale: 1 - depth * STACK_SCALE_STEP,
                        rotation: 0,
                        rotateX: 0,
                        rotateY: 0,
                        opacity: depth > 2 ? 0 : 1,
                        zIndex: total - depth,
                        duration: 0.8,
                        delay: depth * 0.05,
                        ease: SPRING,
                        overwrite: 'auto',
                    });
                });

                updateIndicator();

                // Reset tilt on the new active card
                tiltX = 0;
                tiltY = 0;

                // Start breathing on new active card
                startBreathing(cells[activeIndex]);

                // Use onComplete-style timing instead of setTimeout
                gsap.delayedCall(0.5, () => {
                    isAnimating = false;
                });
            },
        });
    }

    // ── Idle breathing animation on active card ──
    function startBreathing(cell) {
        if (cell._breathTween) cell._breathTween.kill();
        cell._breathTween = gsap.to(cell, {
            y: '+=3',
            duration: 3,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
        });
    }

    // ── Pointer events for swipe ──
    const stackArea = container.querySelector('.card-stack-area');
    if (!stackArea) return;

    stackArea.addEventListener('pointerdown', (e) => {
        if (isAnimating) return;
        // Don't interfere with card flip clicks on the active card
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currentDragX = 0;
        dragDelta = 0;
        stackArea.setPointerCapture(e.pointerId);
    });

    stackArea.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        dragDelta = e.clientX - startX;
        currentDragX = dragDelta;

        // Record velocity history (keep last 5)
        velocityHistory.push({ x: e.clientX, t: e.timeStamp });
        if (velocityHistory.length > 5) velocityHistory.shift();

        // Visual feedback: drag the top card along with finger/mouse
        const activeCell = cells[activeIndex];
        const progress = Math.min(Math.abs(dragDelta) / FLY_DISTANCE, 1);
        const rotation = (dragDelta / FLY_DISTANCE) * -15;

        gsap.set(activeCell, {
            x: dragDelta * 0.8,
            rotation: rotation,
            scale: 1 - progress * 0.08,
        });

        // Cards behind slightly shift up as if being "revealed"
        cells.forEach((cell, i) => {
            const offset = ((i - activeIndex) + total) % total;
            if (offset === 0 || offset > 3) return;
            const depth = offset;
            const reveal = progress * 0.4; // partial reveal
            gsap.set(cell, {
                y: (depth - reveal) * STACK_OFFSET_Y,
                scale: 1 - (depth - reveal * 0.5) * STACK_SCALE_STEP,
            });
        });
    });

    stackArea.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;

        const totalDelta = e.clientX - startX;
        const verticalDelta = Math.abs(e.clientY - startY);

        // Check if it was a click (very small movement) — allow flip
        if (Math.abs(totalDelta) < 8 && verticalDelta < 8) {
            // Reset any minor visual drag
            layoutStack(false);
            return;
        }

        // Calculate flick velocity from history
        let velocity = 0;
        if (velocityHistory.length >= 2) {
            const first = velocityHistory[0];
            const last = velocityHistory[velocityHistory.length - 1];
            const dt = last.t - first.t;
            if (dt > 0) velocity = Math.abs(last.x - first.x) / dt;
        }
        velocityHistory.length = 0;

        // Trigger if distance OR velocity exceeds threshold
        if (Math.abs(totalDelta) > FLICK_DISTANCE || velocity > VELOCITY_THRESHOLD) {
            // Swipe detected
            const direction = totalDelta < 0 ? 1 : -1;
            goTo(direction);
        } else {
            // Snap back — spring return
            const activeCell = cells[activeIndex];
            gsap.to(activeCell, {
                x: 0,
                rotation: 0,
                scale: 1,
                duration: 0.8,
                ease: SPRING_SOFT,
            });
            layoutStack(true);
        }
    });

    stackArea.addEventListener('pointercancel', () => {
        if (!isDragging) return;
        isDragging = false;
        layoutStack(false);
    });

    // ── Mouse tilt on active card (pointer:fine only) ──
    if (matchMedia('(pointer: fine)').matches) {
        stackArea.addEventListener('mousemove', (e) => {
            if (isDragging || isAnimating) return;
            const activeCell = cells[activeIndex];
            const rect = activeCell.getBoundingClientRect();
            const dx = (e.clientX - rect.left) / rect.width - 0.5;
            const dy = (e.clientY - rect.top) / rect.height - 0.5;

            tiltX = dy * -TILT_MAX;
            tiltY = dx * TILT_MAX;

            gsap.to(activeCell, {
                rotateX: tiltX,
                rotateY: tiltY,
                duration: 0.4,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        });

        stackArea.addEventListener('mouseleave', () => {
            if (isAnimating) return;
            const activeCell = cells[activeIndex];
            gsap.to(activeCell, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.6,
                ease: SPRING_FAST,
                overwrite: 'auto',
            });
            tiltX = 0;
            tiltY = 0;
        });
    }

    // ── Navigation buttons ──
    const prevBtn = container.querySelector('.stack-nav-prev');
    const nextBtn = container.querySelector('.stack-nav-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goTo(-1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goTo(1);
        });
    }

    // ── Keyboard navigation ──
    document.addEventListener('keydown', (e) => {
        // Only react when skills section is in view
        const section = document.getElementById('skills');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(1);
        }
    });

    // ── Initial layout ──
    // Set initial positions immediately (no animation)
    cells.forEach((cell, i) => {
        const offset = ((i - activeIndex) + total) % total;
        const depth = offset === 0 ? 0 : Math.min(offset, 3);

        gsap.set(cell, {
            x: 0,
            y: depth * STACK_OFFSET_Y,
            z: depth * STACK_Z_STEP,
            scale: 1 - depth * STACK_SCALE_STEP,
            rotation: 0,
            opacity: depth > 2 ? 0 : 1,
            zIndex: total - depth,
        });

        // Remove reveal-scale so GSAP/ScrollTrigger controls visibility
        cell.classList.remove('reveal-scale');
    });

    updateIndicator();

    // Start breathing on the initial active card
    startBreathing(cells[activeIndex]);

    // ── Scroll-triggered entrance animation ──
    const stackWrapper = container.querySelector('.card-stack-area');

    // Start hidden
    gsap.set(stackWrapper, { opacity: 0, y: 60 });
    gsap.set(container.querySelector('.stack-controls'), { opacity: 0, y: 20 });

    ScrollTrigger.create({
        trigger: container,
        start: 'top 80%',
        once: true,
        onEnter: () => {
            // Cards fan in from behind and settle into stack
            const tl = gsap.timeline();

            // Fade in the stack area
            tl.to(stackWrapper, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            });

            // Animate each card from a scattered state to the stack
            cells.forEach((cell, i) => {
                const offset = ((i - activeIndex) + total) % total;
                const depth = offset === 0 ? 0 : Math.min(offset, 3);

                // Start from random-ish scattered positions
                gsap.set(cell, {
                    y: 120 + depth * 40,
                    scale: 0.7,
                    rotation: (i - 1.5) * 8,
                    opacity: 0,
                });

                tl.to(cell, {
                    y: depth * STACK_OFFSET_Y,
                    z: depth * STACK_Z_STEP,
                    scale: 1 - depth * STACK_SCALE_STEP,
                    rotation: 0,
                    opacity: depth > 2 ? 0 : 1,
                    zIndex: total - depth,
                    duration: 1,
                    ease: SPRING,
                }, 0.1 + i * 0.08);
            });

            // Show controls
            tl.to(container.querySelector('.stack-controls'), {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power3.out',
            }, 0.4);
        },
    });

    // ── Card flip — only on the active card, on click ──
    // `dragDelta` is reset on pointerdown and tracked during drag.
    // If abs(dragDelta) > 8 at click time, it was a swipe, not a tap.
    let lastDragDelta = 0;

    // Capture final dragDelta before click fires
    stackArea.addEventListener('pointerup', () => {
        lastDragDelta = dragDelta;
    }, true);

    cells.forEach((cell, i) => {
        cell.addEventListener('click', (e) => {
            if (i !== activeIndex) return;
            if (Math.abs(lastDragDelta) > 8) return;
            if (isAnimating) return;

            const state = flipStates[i];
            if (state.isFlipping) return;
            state.isFlipping = true;

            const inner = cell.querySelector('.card-inner');
            const targetRotY = state.isFlipped ? 0 : 180;
            const midRotY = 90;

            const tl = gsap.timeline({
                onComplete: () => {
                    state.isFlipped = !state.isFlipped;
                    state.isFlipping = false;
                }
            });

            // Phase 1: first half of flip + lift
            tl.to(inner, {
                rotateY: midRotY,
                z: 30,
                scale: 1.04,
                duration: 0.35,
                ease: 'power2.in',
            });

            // Phase 2: second half of flip + settle
            tl.to(inner, {
                rotateY: targetRotY,
                z: 0,
                scale: 1,
                duration: 0.45,
                ease: 'power2.out',
            });

            // Phase 3: landing squash
            tl.to(inner, {
                z: -5,
                scaleX: 1.02,
                scaleY: 0.98,
                duration: 0.1,
                ease: 'power1.in',
            });

            // Phase 4: elastic bounce back
            tl.to(inner, {
                z: 0,
                scaleX: 1,
                scaleY: 1,
                duration: 0.3,
                ease: 'elastic.out(1, 0.4)',
            });
        });
    });

    return {
        goTo,
        getActiveIndex: () => activeIndex,
    };
}
