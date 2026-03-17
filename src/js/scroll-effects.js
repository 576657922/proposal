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
                { opacity: 0.1, filter: 'blur(4px)' },
                {
                    opacity: 1,
                    filter: 'blur(0px)',
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
