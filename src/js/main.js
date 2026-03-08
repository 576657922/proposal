import { Quaternion, Vector3, TextureLoader, Clock } from 'three';
import '../styles/main.css';
import { CONFIG, ZOOM_FAR, ZOOM_CLOSE, japanQuaternion } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';
import { createGlobe } from './globe.js';
import { createAtmosphere } from './atmosphere.js';
import { createAvatarMarker } from './marker.js';
import { getScrollProgress, initScrollControls } from './controls.js';
import { textScramble } from './text-scramble.js';
import { toggleLang, getCurrentLang } from './i18n.js';
import { CursorRipple } from './cursor-ripple.js';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

// ===== Lenis smooth scroll =====
const lenis = new Lenis({
    lerp: 0.07,
    wheelMultiplier: 0.8,
    smoothTouch: false,
});

// Sync Lenis with ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

// Smooth scroll for anchor links via Lenis
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            lenis.scrollTo(target);
        }
    });
});

// Initialize scroll-driven zoom
initScrollControls();

// ===== Cursor glow trail (Lusion-style) =====
const cursorRipple = new CursorRipple(null, {
    color: '232,255,71',   // accent #e8ff47
    trailLength: 50,       // max trail points
    pointLife: 800,         // ms per point
    baseRadius: 60,         // glow radius px
    intensity: 0.4,         // peak alpha
    velocityScale: 2.5,     // radius boost from speed
});

let globePoints = null;
let markerGroup = null;
let heroSplitTl = null;
let currentSpinAngle = 0;

// Pre-allocated objects for animation loop (avoid per-frame GC)
const _spinQuat = new Quaternion();
const _finalQuat = new Quaternion();
const _yAxis = new Vector3(0, 1, 0);
const _worldPos = new Vector3();

// ===== Preloader =====
const preloader = document.getElementById('preloader');
const preloaderCounter = document.getElementById('preloaderCounter');
const preloaderLine = document.getElementById('preloaderLine');
const logoPaths = document.querySelectorAll('.logo-path');

document.body.classList.add('is-loading');

let textureReady = false;
let fontsReady = false;
let loadProgress = 0;
let displayedProgress = 0;
const MIN_DISPLAY_TIME = 2200;
const preloaderStart = performance.now();

// Measure each path and set up stroke-dash animation
const drawTimings = [0, 0.12, 0.24, 0.5, 0.8, 1.0]; // stagger delays (seconds)
const drawDurations = [0.5, 0.35, 0.35, 0.7, 0.4, 0.7]; // per-path duration

logoPaths.forEach((path, i) => {
    const len = path.getTotalLength();
    path.style.setProperty('--path-len', len);
    path.style.setProperty('--draw-delay', drawTimings[i] + 's');
    path.style.setProperty('--draw-dur', drawDurations[i] + 's');
});

// Start drawing after a brief pause
setTimeout(() => {
    logoPaths.forEach(p => p.classList.add('draw'));
    // Show counter after logo starts drawing
    setTimeout(() => {
        preloaderCounter.classList.add('visible');
    }, 600);
}, 200);

function updateCounter(value) {
    displayedProgress = value;
    const str = String(Math.floor(value)).padStart(3, '0');
    preloaderCounter.textContent = str;
    preloaderLine.style.width = value + '%';
}

function checkReady() {
    if (!textureReady || !fontsReady) return;

    const elapsed = performance.now() - preloaderStart;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    // Animate counter to 100
    const startVal = displayedProgress;
    const counterDuration = Math.max(remaining, 400);
    const counterStart = performance.now();

    function tickCounter() {
        const t = Math.min(1, (performance.now() - counterStart) / counterDuration);
        const eased = 1 - Math.pow(1 - t, 3);
        updateCounter(startVal + (100 - startVal) * eased);

        if (t < 1) {
            requestAnimationFrame(tickCounter);
        } else {
            setTimeout(exitPreloader, 200);
        }
    }
    requestAnimationFrame(tickCounter);
}

function exitPreloader() {
    preloader.classList.add('exit');
    document.body.classList.remove('is-loading');

    setTimeout(() => {
        if (heroSplitTl) heroSplitTl.play();
    }, 300);

    preloader.addEventListener('transitionend', () => {
        preloader.remove();
    }, { once: true });
}

// Font loading gate
document.fonts.ready.then(() => {
    fontsReady = true;
    checkReady();
});

// Load earth specular texture (local)
const textureLoader = new TextureLoader();

textureLoader.load(
    '/textures/earth_specular.jpg',
    (texture) => {
        globePoints = createGlobe(texture);
        createAtmosphere();
        markerGroup = createAvatarMarker(globePoints);
        textureReady = true;
        checkReady();
    },
    (xhr) => {
        if (xhr.lengthComputable) {
            loadProgress = (xhr.loaded / xhr.total) * 90;
            updateCounter(loadProgress);
        }
    },
    () => {
        console.warn('Texture load failed, rendering without texture');
        globePoints = createGlobe(null);
        createAtmosphere();
        markerGroup = createAvatarMarker(globePoints);
        textureReady = true;
        checkReady();
    }
);

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cursorRipple.resize(window.innerWidth, window.innerHeight);
});

// ===== Language toggle =====
const langToggle = document.getElementById('langToggle');
langToggle.addEventListener('click', () => {
    const newLang = toggleLang();
    langToggle.textContent = newLang === 'ja' ? 'English' : '日本語';

    // Re-run SplitType on hero title after innerHTML change
    const heroTitleEl = document.querySelector('.hero-title');
    if (heroTitleEl) {
        heroTitleEl.querySelectorAll('.line span').forEach(span => {
            span.style.opacity = '1';
            span.style.transform = 'none';
            span.style.animation = 'none';
        });
    }
});

// ===== Custom cursor — crosshair + corner brackets =====
const isPointerDevice = matchMedia('(pointer: fine)').matches;
const cross = document.getElementById('cursorCross');
const bracket = document.getElementById('cursorBracket');
const cursorLabel = document.getElementById('cursorLabel');
let mx = 0, my = 0, bx = 0, by = 0;
let cursorState = 'default'; // 'default' | 'hover' | 'view' | 'cta'

if (!isPointerDevice) {
    cross.style.display = 'none';
    bracket.style.display = 'none';
}

function setCursorState(state) {
    if (cursorState === state) return;
    bracket.classList.remove('hovered', 'cursor-view', 'cursor-cta');
    cross.classList.remove('hidden');
    cursorLabel.textContent = '';

    if (state === 'hover') {
        bracket.classList.add('hovered');
    } else if (state === 'view') {
        bracket.classList.add('cursor-view');
        cursorLabel.textContent = 'View';
        cross.classList.add('hidden');
    } else if (state === 'cta') {
        bracket.classList.add('cursor-cta');
        cursorLabel.textContent = 'Say hi';
        cross.classList.add('hidden');
    }
    cursorState = state;
}

if (isPointerDevice) {
    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        cross.style.setProperty('--cx', mx + 'px');
        cross.style.setProperty('--cy', my + 'px');
    });

    // Hover links — brackets expand + accent
    document.querySelectorAll('a:not(.project-item):not(.contact-btn), button, .skill-cell').forEach(el => {
        el.addEventListener('mouseenter', () => setCursorState('hover'));
        el.addEventListener('mouseleave', () => setCursorState('default'));
    });

    // Contact button — filled circle + "Say hi"
    document.querySelectorAll('.contact-btn').forEach(el => {
        el.addEventListener('mouseenter', () => setCursorState('cta'));
        el.addEventListener('mouseleave', () => setCursorState('default'));
    });
}

// ===== Project hover image preview =====
const projectPreview = document.getElementById('projectPreview');
const previewImgs = document.querySelectorAll('.preview-img');
const projectItems = document.querySelectorAll('.project-item');

let previewX = 0, previewY = 0, previewTargetX = 0, previewTargetY = 0;
let previewActive = false;

projectItems.forEach((item, index) => {
    item.addEventListener('mouseenter', () => {
        setCursorState('view');
        previewActive = true;
        projectPreview.classList.add('active');
        previewImgs.forEach(img => img.classList.remove('active'));
        if (previewImgs[index]) previewImgs[index].classList.add('active');
    });

    item.addEventListener('mouseleave', () => {
        setCursorState('default');
        previewActive = false;
        projectPreview.classList.remove('active');
    });

    item.addEventListener('mousemove', (e) => {
        previewTargetX = e.clientX + 24;
        previewTargetY = e.clientY - 220;
    });
});

// ===== Magnetic buttons =====
const magneticEls = document.querySelectorAll('.contact-btn, .nav-links a');

magneticEls.forEach(el => {
    let cachedRect = null;

    el.addEventListener('mouseenter', () => {
        cachedRect = el.getBoundingClientRect();
    });

    el.addEventListener('mousemove', (e) => {
        if (!cachedRect) return;
        const cx = cachedRect.left + cachedRect.width / 2;
        const cy = cachedRect.top + cachedRect.height / 2;
        const deltaX = (e.clientX - cx) * 0.3;
        const deltaY = (e.clientY - cy) * 0.3;
        gsap.to(el, { x: deltaX, y: deltaY, duration: 0.3, ease: 'power3.out' });
    });

    el.addEventListener('mouseleave', () => {
        cachedRect = null;
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    });
});

// ===== Card flip on click =====
document.querySelectorAll('.skill-cell').forEach(cell => {
    cell.addEventListener('click', () => {
        cell.classList.toggle('flipped');
    });
});

// ===== 1. Skills card fan → spread on scroll =====
const skillCells = gsap.utils.toArray('.skill-cell');
if (skillCells.length === 4 && window.innerWidth > 900) {
    const skillsGrid = document.querySelector('.skills-grid');

    // Remove IntersectionObserver reveal — GSAP handles entrance
    skillCells.forEach(cell => {
        cell.classList.remove('reveal-scale');
        cell.style.opacity = '1';
        cell.style.filter = 'none';
    });

    // Measure each card's center relative to the row center
    const gr = skillsGrid.getBoundingClientRect();
    const gcx = gr.width / 2;

    // Fan rotations — like a hand of playing cards held from bottom
    const fanRotations = [-20, -7, 7, 20];

    const fanTl = gsap.timeline({
        scrollTrigger: {
            trigger: skillsGrid,
            start: 'top 90%',
            end: 'top 10%',
            scrub: 1,
        }
    });

    skillCells.forEach((cell, i) => {
        const cr = cell.getBoundingClientRect();
        const ccx = cr.left - gr.left + cr.width / 2;

        // Stack all cards in center, fan from bottom pivot
        fanTl.from(cell, {
            x: gcx - ccx,
            rotation: fanRotations[i],
            transformOrigin: '50% 140%',
            scale: 0.92,
            zIndex: 4 - Math.abs(i - 1.5),
            duration: 1,
        }, 0);
    });
}

// ===== 2. Section headings — scroll-scrubbed character reveal =====
document.querySelectorAll('#about h2, #work h2, #skills h2, #contact h2').forEach(heading => {
    // Wait for scramble to complete before splitting
    const scrambleText = heading.getAttribute('data-scramble');
    if (scrambleText) {
        heading.textContent = scrambleText;
    }

    const split = new SplitType(heading, { types: 'chars', charClass: 'heading-char' });

    if (split.chars && split.chars.length > 0) {
        gsap.fromTo(split.chars,
            { opacity: 0.12, color: 'var(--muted)' },
            {
                opacity: 1,
                color: 'var(--fg)',
                stagger: 0.03,
                scrollTrigger: {
                    trigger: heading,
                    start: 'top 85%',
                    end: 'top 45%',
                    scrub: 1,
                },
            }
        );
    }
});

// ===== 3. (Glow effects removed — cards use 3D flip now) =====

// ===== 4. Scroll-velocity skew on project items =====
let skewTarget = 0;
let currentSkew = 0;

lenis.on('scroll', ({ velocity }) => {
    skewTarget = Math.max(-6, Math.min(6, velocity * 0.25));
});

// ===== 5. Marquee scroll-responsive speed =====
const marqueeTrack = document.querySelector('.marquee-track');
let baseMarqueeDuration = 30;

lenis.on('scroll', ({ velocity }) => {
    if (marqueeTrack) {
        const speed = 1 + Math.abs(velocity) * 0.003;
        marqueeTrack.style.animationDuration = (baseMarqueeDuration / speed) + 's';
    }
});

// ===== Scroll-triggered reveal (IntersectionObserver with stagger) =====
const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            const delay = i * 80;
            setTimeout(() => {
                entry.target.classList.add('visible');

                // Trigger scramble on the element itself
                if (entry.target.hasAttribute('data-scramble')) {
                    textScramble(entry.target, entry.target.getAttribute('data-scramble'), 900);
                }

                // Also trigger scramble on child elements with data-scramble
                entry.target.querySelectorAll('[data-scramble]').forEach((child, ci) => {
                    setTimeout(() => {
                        textScramble(child, child.getAttribute('data-scramble'), 800);
                    }, ci * 120);
                });
            }, delay);

            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-scale, .reveal-clip, .reveal-left').forEach(el => observer.observe(el));

// ===== Stats count-up animation =====
const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'));
            const suffix = el.getAttribute('data-suffix') || '';
            const duration = 2000;
            const startTime = performance.now();

            function update(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(target * eased) + suffix;
                if (progress < 1) requestAnimationFrame(update);
            }

            requestAnimationFrame(update);
            countObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-count]').forEach(el => countObserver.observe(el));

// ===== Hero SplitText animation (paused — triggered after preloader) =====
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    heroTitle.querySelectorAll('.line span').forEach(span => {
        span.style.opacity = '0';
        span.style.transform = 'translateY(100%)';
        span.style.animation = 'none';
    });

    const split = new SplitType(heroTitle, {
        types: 'lines, words, chars',
        lineClass: 'split-line',
        wordClass: 'split-word',
        charClass: 'split-char',
    });

    heroTitle.querySelectorAll('.line span').forEach(span => {
        span.style.opacity = '1';
        span.style.transform = 'none';
    });

    gsap.set(split.chars, { y: '110%', opacity: 0, rotateX: -80 });

    heroSplitTl = gsap.to(split.chars, {
        y: '0%',
        opacity: 1,
        rotateX: 0,
        stagger: 0.035,
        duration: 1.2,
        ease: 'power4.out',
        paused: true,
    });
}

// ===== Scroll-driven elements =====
const heroMain = document.querySelector('.ui-layer main');
const heroAction = document.querySelector('.action-area');
const orb1 = document.querySelector('.orb-1');
const orb2 = document.querySelector('.orb-2');
const timeline = document.getElementById('timeline');
const timelineProgress = document.getElementById('timelineProgress');
const timelineDots = document.querySelectorAll('.timeline-dot');
const STEP_COUNT = timelineDots.length;

// Unified scroll handler via Lenis
lenis.on('scroll', () => {
    const scrollProgress = getScrollProgress();
    const s = window.scrollY;

    // Hero text parallax
    if (heroMain) {
        const y = scrollProgress * -120;
        const opacity = Math.max(0, 1 - scrollProgress * 1.5);
        const scale = 1 - scrollProgress * 0.1;
        heroMain.style.transform = `translateY(${y}px) scale(${scale})`;
        heroMain.style.opacity = opacity;
    }
    if (heroAction) {
        heroAction.style.opacity = Math.max(0, 1 - scrollProgress * 3);
    }

    // Parallax orbs
    if (orb1 && orb2) {
        orb1.style.transform = `translate(${s * 0.03}px, ${s * -0.05}px)`;
        orb2.style.transform = `translate(${s * -0.02}px, ${s * 0.04}px)`;
    }

    // Timeline progress
    if (timeline && timelineProgress) {
        const rect = timeline.getBoundingClientRect();
        const viewH = window.innerHeight;
        const start = viewH * 0.6;
        const end = viewH * 0.4;
        const totalTravel = (rect.height + start - end);
        const traveled = start - rect.top;
        const p = Math.max(0, Math.min(1, traveled / totalTravel));

        timelineProgress.style.height = (p * 100) + '%';

        timelineDots.forEach((dot, i) => {
            const threshold = (i + 1) / (STEP_COUNT + 0.5);
            if (p >= threshold) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
});

// ===== Unified animation loop =====
const clock = new Clock();

function animate(time) {
    requestAnimationFrame(animate);

    // Lenis
    lenis.raf(time);

    // Cursor bracket follow (only pointer devices)
    if (isPointerDevice) {
        bx += (mx - bx) * 0.12;
        by += (my - by) * 0.12;
        bracket.style.setProperty('--bx', bx + 'px');
        bracket.style.setProperty('--by', by + 'px');

        // Preview follow (only when active)
        if (previewActive) {
            previewX += (previewTargetX - previewX) * 0.1;
            previewY += (previewTargetY - previewY) * 0.1;
            projectPreview.style.transform = `translate(${previewX}px, ${previewY}px)`;
        }
    }

    // Scroll-velocity skew on project items
    currentSkew += (skewTarget - currentSkew) * 0.1;
    skewTarget *= 0.95; // decay
    if (Math.abs(currentSkew) > 0.01) {
        projectItems.forEach(item => {
            item.style.transform = `skewY(${currentSkew}deg)`;
        });
    }

    // Three.js
    const elapsedTime = clock.getElapsedTime();
    const scrollProgress = getScrollProgress();

    if (globePoints) {
        // Spin speed decreases with scroll
        currentSpinAngle += CONFIG.rotationSpeed * (1 - scrollProgress);
        globePoints.material.uniforms.uTime.value = elapsedTime;

        // Quaternion interpolation: spin -> Japan close-up
        _spinQuat.setFromAxisAngle(_yAxis, currentSpinAngle);
        _finalQuat.copy(_spinQuat).slerp(japanQuaternion, scrollProgress);
        globePoints.quaternion.copy(_finalQuat);
    }

    // Marker: avatar fades in, ring/line fade out with scroll
    if (markerGroup) {
        const markerRing = markerGroup.children[0];
        if (markerRing) {
            const breathe = 1 - scrollProgress * 0.8;
            const scale = (1.0 + Math.sin(elapsedTime * 3) * 0.2) * breathe;
            markerRing.scale.set(scale, scale, 1);
        }

        markerGroup.getWorldPosition(_worldPos);
        const backfaceAlpha = Math.max(0, Math.min(1, (_worldPos.z + 1.0) / 3.0));

        // Ring & line fade out as we scroll; avatar fades in
        const ringFade = Math.max(0, 1 - Math.max(0, scrollProgress - 0.3) * 2.5);
        const avatarReveal = Math.min(1, scrollProgress * 1.5);

        markerGroup.children.forEach(child => {
            if (child.material) {
                if (child.isSprite) {
                    // Avatar: starts dim, becomes fully visible on scroll
                    child.material.opacity = backfaceAlpha * (0.15 + 0.85 * avatarReveal);
                } else {
                    // Ring & line: fade out on scroll
                    const baseOpacity = (child.isLine || child.geometry?.type === 'RingGeometry') ? 0.6 : 1.0;
                    child.material.opacity = backfaceAlpha * baseOpacity * ringFade;
                }
            }
        });
    }

    // Disable OrbitControls when scroll zoom is active
    controls.enabled = scrollProgress <= 0.01;

    if (controls.enabled) {
        controls.update();
    }

    // Camera zoom driven by scroll
    if (globePoints) {
        const targetZ = ZOOM_FAR + (ZOOM_CLOSE - ZOOM_FAR) * scrollProgress;
        camera.position.z += (targetZ - camera.position.z) * 0.12;
    }

    renderer.render(scene, camera);

    // Draw cursor glow trail overlay (separate Canvas 2D layer)
    cursorRipple.update();
}

// Pause animation when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clock.stop();
    } else {
        clock.start();
    }
});

window.onload = function () {
    animate(performance.now());
};
