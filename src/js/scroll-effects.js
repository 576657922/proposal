/**
 * Scroll-driven effects — stagger reveals, parallax, color transitions,
 * and paragraph word-blur reveals.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP ScrollTrigger.batch reveals for project items and skill cells.
 * Removes CSS .reveal / .reveal-scale classes so GSAP takes over.
 */
export function initStaggerReveals() {
    // --- Project items: remove .reveal so IntersectionObserver ignores them ---
    const projectItems = gsap.utils.toArray('.project-item');
    projectItems.forEach(el => el.classList.remove('reveal'));

    // --- Skill cells on mobile: remove .reveal-scale so GSAP handles them ---
    const isMobile = window.innerWidth <= 900;
    const skillCells = gsap.utils.toArray('.skill-cell');
    if (isMobile) {
        skillCells.forEach(el => el.classList.remove('reveal-scale'));
    }

    // Timeline nodes (about stats, etc.) — generic .reveal-left and .reveal
    // are still handled by the existing IntersectionObserver, but we add
    // batch reveals for the two main groups:

    // Project items batch
    if (projectItems.length) {
        gsap.set(projectItems, { y: 60, opacity: 0, skewY: 4 });
        ScrollTrigger.batch(projectItems, {
            onEnter: (batch) => {
                gsap.to(batch, {
                    y: 0,
                    opacity: 1,
                    skewY: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: 'power2.out',
                });
            },
            start: 'top 88%',
            once: true,
        });
    }

    // Skill cells batch (mobile only — desktop uses fan animation)
    if (isMobile && skillCells.length) {
        gsap.set(skillCells, { y: 60, opacity: 0, scale: 0.92 });
        ScrollTrigger.batch(skillCells, {
            onEnter: (batch) => {
                gsap.to(batch, {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    stagger: 0.15,
                    duration: 0.8,
                    ease: 'back.out(1.4)',
                });
            },
            start: 'top 88%',
            once: true,
        });
    }
}

/**
 * Word-by-word blur reveal on paragraphs using SplitType + scrub ScrollTrigger.
 */
export function initParagraphReveals() {
    const targets = document.querySelectorAll('.trait-text p, .timeline-desc, .contact-desc');
    if (!targets.length) return;

    targets.forEach(el => {
        const split = new SplitType(el, { types: 'words', wordClass: 'split-word' });

        if (split.words && split.words.length > 0) {
            gsap.fromTo(split.words,
                { opacity: 0.1 },
                {
                    opacity: 1,
                    stagger: 0.02,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        end: 'top 40%',
                        scrub: 1,
                    },
                }
            );
        }
    });
}

/**
 * Subtle parallax shifts on section labels, about columns, and stat numbers.
 */
export function initParallax() {
    // Section labels
    gsap.utils.toArray('.section-label').forEach(el => {
        gsap.to(el, {
            y: -30,
            scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
        });
    });

    // About traits (desktop only)
    if (window.innerWidth > 900) {
        gsap.utils.toArray('.about-trait').forEach((col, i) => {
            gsap.to(col, {
                y: -20 * (i + 1),
                scrollTrigger: {
                    trigger: col,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1,
                },
            });
        });
    }

    // Stat numbers
    gsap.utils.toArray('.stat-number').forEach(el => {
        gsap.to(el, {
            y: -15,
            scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
        });
    });
}

/**
 * Animate section dividers into view on scroll.
 */
/**
 * Wall tunnel + scatter — two-phase sticky hero.
 *   Phase A: SVG type wall rotates/scales/translates outward then fades.
 *   Phase B: artwork cards appear in a ring, then fling outward one-by-one.
 * Inspired by leonardo.ai's hero.
 */
const SCATTER_CARDS = [
    { n: 5,  x: -44, y: -28, w: 11, rot: -4 },
    { n: 6,  x: -28, y: -36, w: 12, rot: 2 },
    { n: 7,  x: -10, y: -40, w: 10, rot: -3 },
    { n: 8,  x: 8,   y: -36, w: 11, rot: 4 },
    { n: 10, x: 26,  y: -30, w: 13, rot: -2 },
    { n: 11, x: 42,  y: -18, w: 10, rot: 5 },
    { n: 12, x: -46, y: -8,  w: 12, rot: 3 },
    { n: 13, x: -30, y: -6,  w: 10, rot: -5 },
    { n: 17, x: 30,  y: -6,  w: 10, rot: 4 },
    { n: 18, x: 46,  y: 2,   w: 11, rot: -3 },
    { n: 19, x: -44, y: 14,  w: 11, rot: 2 },
    { n: 20, x: -28, y: 22,  w: 13, rot: -4 },
    { n: 21, x: -10, y: 28,  w: 10, rot: 3 },
    { n: 22, x: 10,  y: 30,  w: 12, rot: -2 },
    { n: 23, x: 28,  y: 22,  w: 11, rot: 4 },
    { n: 24, x: 44,  y: 18,  w: 10, rot: -5 },
    { n: 25, x: -50, y: 34,  w: 12, rot: 3 },
    { n: 26, x: -18, y: 40,  w: 10, rot: -3 },
    { n: 27, x: 18,  y: 42,  w: 11, rot: 2 },
    { n: 28, x: 48,  y: 34,  w: 12, rot: -4 },
];

function buildScatterDom(container) {
    const frag = document.createDocumentFragment();
    const vectors = [];
    const elements = [];
    SCATTER_CARDS.forEach((c) => {
        const m = Math.max(0.001, Math.hypot(c.x, c.y));
        vectors.push({ nx: c.x / m, ny: c.y / m });
        const card = document.createElement('div');
        card.className = 'scatter-card';
        const h = c.w * 1.25;
        card.style.width = `${c.w}vmin`;
        card.style.height = `${h}vmin`;
        card.style.marginLeft = `calc(${c.x}vmin - ${c.w / 2}vmin)`;
        card.style.marginTop = `calc(${c.y}vmin - ${h / 2}vmin)`;
        const img = document.createElement('img');
        img.src = `/leonardo/scatter/scatter-${c.n}.jpg`;
        img.alt = '';
        img.loading = 'eager';
        img.decoding = 'async';
        card.appendChild(img);
        frag.appendChild(card);
        elements.push(card);
    });
    container.appendChild(frag);
    // Golden-ratio shuffled fling queue so throws don't sweep one direction.
    const order = SCATTER_CARDS.map((_, i) => i);
    order.sort((a, b) => ((a * 0.6180339887) % 1) - ((b * 0.6180339887) % 1));
    const flyPos = new Array(SCATTER_CARDS.length);
    order.forEach((idx, p) => (flyPos[idx] = p));
    return { vectors, elements, flyPos };
}

export function initWallTunnel() {
    const section = document.getElementById('wallSection');
    const layer = document.getElementById('wallLayer');
    const scatter = document.getElementById('wallScatter');
    if (!section || !layer) return;

    let state = null;
    if (scatter) state = buildScatterDom(scatter);

    const N = SCATTER_CARDS.length;
    const ARRIVE = 0.12;
    const FLY_WIN = 0.08;
    const FLY_START = 0.45;
    const FLY_END = 0.92;
    const DIST = 90; // vmin

    const update = () => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const total = section.offsetHeight - vh;
        const scrolled = Math.min(total, Math.max(0, -rect.top));
        const t = total > 0 ? scrolled / total : 0; // 0..1 global

        // Phase A (t 0..0.45): warped type wall outward + fade.
        const a = Math.min(1, Math.max(0, t / 0.45));
        const aRot = a * 45;
        const aScale = 1 + a * 1.5;
        const aTy = a * 500;
        const aOpacity = 1 - Math.min(1, Math.max(0, (t - 0.35) / 0.1));
        layer.style.transform = `translateY(${aTy}px) rotate(${aRot}deg) scale(${aScale})`;
        layer.style.opacity = String(aOpacity);

        if (!state || !scatter) return;

        // Phase B (t 0.4..1): scatter cards appear then sequentially fly out.
        const b = Math.min(1, Math.max(0, (t - 0.4) / 0.6));
        scatter.style.opacity = String(Math.min(1, b * 1.4));

        for (let i = 0; i < N; i++) {
            const c = SCATTER_CARDS[i];
            const { nx, ny } = state.vectors[i];
            const el = state.elements[i];
            // appear/settle — lightly staggered, fade in + scale from 1.6 to 1
            const aStart = (i / N) * 0.06;
            const aK = Math.min(1, Math.max(0, (b - aStart) / ARRIVE));
            // sequential fling driven by shuffled queue position
            const pos = state.flyPos[i];
            const fStart = FLY_START + (pos / Math.max(1, N - 1)) * (FLY_END - FLY_START);
            const fK = Math.min(1, Math.max(0, (b - fStart) / FLY_WIN));

            const appearDx = nx * -8 * (1 - aK);
            const appearDy = ny * -8 * (1 - aK);
            const appearS = 1.6 - 0.6 * aK;
            const flyDx = nx * DIST * fK;
            const flyDy = ny * DIST * fK;
            const flyR = (c.x > 0 ? 20 : -20) * fK;

            const dx = appearDx + flyDx;
            const dy = appearDy + flyDy;
            const s = appearS - 0.1 * fK;
            const r = c.rot + flyR;

            el.style.transform = `translate(${dx}vmin, ${dy}vmin) scale(${s}) rotate(${r}deg)`;
            el.style.opacity = String(aK * (1 - Math.max(0, fK - 0.85) / 0.15));
        }
    };

    update();
    ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: update,
    });
    window.addEventListener('resize', update);
}

export function initSectionDividers() {
    gsap.utils.toArray('.section-divider').forEach(div => {
        gsap.to(div, {
            scaleX: 1, duration: 1.2, ease: 'power2.inOut',
            scrollTrigger: { trigger: div, start: 'top 85%', toggleActions: 'play none none none' },
        });
    });
}

/**
 * Footer inner content + social links reveal on scroll.
 */
export function initFooterReveal() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;
    const inner = footer.querySelector('.footer-inner');
    if (inner) {
        gsap.fromTo(inner, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: footer, start: 'top 95%', toggleActions: 'play none none none' } });
    }
    // Social links bounce stagger
    const socialLinks = gsap.utils.toArray('.social-links a');
    if (socialLinks.length) {
        gsap.set(socialLinks, { y: 30, opacity: 0 });
        ScrollTrigger.batch(socialLinks, {
            onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'back.out(1.7)' }),
            start: 'top 90%', once: true,
        });
    }
}

/**
 * Accent color transitions as user scrolls between sections.
 * Updates --accent CSS variable and cursorRipple color if provided.
 *
 * @param {import('./cursor-ripple.js').CursorRipple|null} cursorRipple
 * @param {Object} refs - optional scene refs { globePoints, atmosMesh }
 */
export function initColorTransitions(cursorRipple, refs = {}) {
    const defaultColor = '#e8ff47';

    const colorMap = [
        { trigger: '#about',   color: '#47ffe8' },  // teal/green
        { trigger: '#work',    color: '#ff6b47' },  // warm orange
        { trigger: '#skills',  color: '#a78bfa' },  // purple
        { trigger: '#contact', color: '#e8ff47' },  // back to default yellow-green
    ];

    colorMap.forEach(({ trigger: selector, color }, index) => {
        const section = document.querySelector(selector);
        if (!section) return;

        // Determine the color of the previous section (or default)
        const prevColor = index > 0 ? colorMap[index - 1].color : defaultColor;

        ScrollTrigger.create({
            trigger: section,
            start: 'top 60%',
            end: 'top 20%',
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                const interpolated = gsap.utils.interpolate(prevColor, color, progress);
                document.documentElement.style.setProperty('--accent', interpolated);
                if (cursorRipple) {
                    cursorRipple.color = colorToRgb(interpolated);
                }
                if (refs.globePoints) refs.globePoints.material.uniforms.uColor.value.setStyle(interpolated);
                if (refs.atmosMesh) refs.atmosMesh.material.uniforms.uColor.value.setStyle(interpolated);
            },
            onLeaveBack: () => {
                // Reset to previous section's color (or default) when scrolling back up
                document.documentElement.style.setProperty('--accent', prevColor);
                if (cursorRipple) {
                    cursorRipple.color = colorToRgb(prevColor);
                }
                if (refs.globePoints) refs.globePoints.material.uniforms.uColor.value.setStyle(prevColor);
                if (refs.atmosMesh) refs.atmosMesh.material.uniforms.uColor.value.setStyle(prevColor);
            },
        });
    });
}

/**
 * Convert a color string (hex or rgb()) to an RGB tuple string for CursorRipple.
 * @param {string} color - e.g. '#47ffe8' or 'rgb(71, 255, 232)'
 * @returns {string} - e.g. '71,255,232'
 */
function colorToRgb(color) {
    // Handle rgb(r, g, b) format (returned by gsap.utils.interpolate)
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return `${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]}`;
    }
    // Handle hex format
    const h = color.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r},${g},${b}`;
}
