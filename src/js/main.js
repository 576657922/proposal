import { Quaternion, Vector3, TextureLoader, Clock } from 'three';
import '../styles/main.css';
import { CONFIG, ZOOM_FAR, ZOOM_CLOSE, japanQuaternion } from './config.js';
import { scene, camera, renderer, controls, composer } from './scene.js';
import { createGlobe } from './globe.js';
import { createAtmosphere } from './atmosphere.js';
import { createAvatarMarker } from './marker.js';
import { getScrollProgress, initScrollControls } from './controls.js';
import { textScramble } from './text-scramble.js';
import { toggleLang, getCurrentLang } from './i18n.js';
// import { CursorRipple } from './cursor-ripple.js';
import { initAnimatedGrain } from './grain.js';
import { ParticleField } from './particles.js';
import { initCardTilt, initArrowBounce, initMagneticButtons } from './micro-interactions.js';
import { initStaggerReveals, initParallax, initParagraphReveals, initColorTransitions, initSectionDividers, initFooterReveal, initWallTunnel } from './scroll-effects.js';
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

// ===== Cursor glow trail (disabled — too AI-template-like) =====
// const cursorRipple = new CursorRipple(null, {
//     color: '232,255,71',
//     trailLength: 50,
//     pointLife: 800,
//     baseRadius: 60,
//     intensity: 0.4,
//     velocityScale: 2.5,
// });

initAnimatedGrain();

// ===== Hover Letters (Contact lusion effect) =====
function initHoverLetters() {
    const lang = getCurrentLang();
    document.querySelectorAll('.hover-letters-line').forEach(el => {
        const text = lang === 'ja'
            ? (el.dataset.textJa || el.dataset.textEn)
            : el.dataset.textEn;
        el.innerHTML = '';
        text.split('').forEach(c => {
            const span = document.createElement('span');
            span.className = 'hover-letter';
            span.textContent = c === ' ' ? '\u00A0' : c;
            el.appendChild(span);
        });
    });
}
initHoverLetters();

// JS-driven hover for contact headline letters
{
    let hovered = null;
    document.addEventListener('mousemove', (e) => {
        // elementFromPoint ignores pointer-events:none layers automatically
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const hit = el && el.classList.contains('hover-letter') ? el : null;
        if (hit !== hovered) {
            if (hovered) hovered.style.color = '';
            hovered = hit;
            if (hovered) hovered.style.color = 'rgba(255,255,255,0.35)';
        }
    });
}

// ===== Canvas 2D background effects (Skills particles + Contact wave mesh) =====
const skillsCanvas = document.getElementById('skillsCanvas');
const particleField = skillsCanvas ? new ParticleField(skillsCanvas) : null;

// Intersection Observer to activate/pause background effects
const bgEffectObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target.id === 'skills' && particleField) {
            entry.isIntersecting ? particleField.start() : particleField.stop();
        }
    });
}, { threshold: 0.05 });

if (skillsCanvas) bgEffectObserver.observe(document.getElementById('skills'));

let globePoints = null;
let markerGroup = null;
let heroSplitTl = null;
let heroSubTl = null;
let currentSpinAngle = 0;
let normalizedMx = 0, normalizedMy = 0;

const sceneRefs = { globePoints: null, atmosMesh: null };

// Pre-allocated objects for animation loop (avoid per-frame GC)
const _spinQuat = new Quaternion();
const _finalQuat = new Quaternion();
const _yAxis = new Vector3(0, 1, 0);
const _worldPos = new Vector3();
const _mouseTiltQuat = new Quaternion();
const _tempQuat = new Quaternion();
const _xAxis = new Vector3(1, 0, 0);

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
    // 2a: Accent flash on preloader line before exit
    gsap.to(preloaderLine, {
        boxShadow: '0 0 20px rgba(232,255,71,0.8), 0 0 40px rgba(232,255,71,0.4)',
        duration: 0.3, yoyo: true, repeat: 1,
    });

    preloader.classList.add('exit');
    document.body.classList.remove('is-loading');

    setTimeout(() => {
        if (heroSplitTl) heroSplitTl.play();
    }, 300);

    // Feature 1: Hero subtitle word cascade after delay
    setTimeout(() => { if (heroSubTl) heroSubTl.play(); }, 2000);

    if (globePoints) {
        gsap.to(globePoints.material.uniforms.uBrightness, {
            value: 1.0, duration: 1.8, ease: 'power2.out'
        });

        // 2b: Globe bloom scale pulse
        gsap.fromTo(globePoints.scale,
            { x: 0.95, y: 0.95, z: 0.95 },
            { x: 1.0, y: 1.0, z: 1.0, duration: 1.5, ease: 'elastic.out(1, 0.4)' }
        );
    }

    // 2c: Atmosphere intensity bloom
    if (sceneRefs.atmosMesh) {
        gsap.fromTo(sceneRefs.atmosMesh.material.uniforms.uIntensity,
            { value: 2.5 },
            { value: 1.0, duration: 2.0, ease: 'power2.out' }
        );
    }

    // 2d: Hero label letter-spacing animation
    const heroLabel = document.querySelector('.hero-label');
    if (heroLabel) {
        gsap.fromTo(heroLabel,
            { opacity: 0, letterSpacing: '0.6em' },
            { opacity: 1, letterSpacing: '0.15em', duration: 1.2, ease: 'power3.out', delay: 0.5 }
        );
    }

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
        const atmosMesh = createAtmosphere();
        markerGroup = createAvatarMarker(globePoints);
        sceneRefs.globePoints = globePoints;
        sceneRefs.atmosMesh = atmosMesh;
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
        const atmosMesh = createAtmosphere();
        markerGroup = createAvatarMarker(globePoints);
        sceneRefs.globePoints = globePoints;
        sceneRefs.atmosMesh = atmosMesh;
        textureReady = true;
        checkReady();
    }
);

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    // cursorRipple.resize();
});

// ===== Language toggle =====
const langToggle = document.getElementById('langToggle');
langToggle.addEventListener('click', () => {
    const newLang = toggleLang();
    langToggle.textContent = newLang === 'ja' ? 'English' : '日本語';

    // Re-render hover letters for new language
    initHoverLetters();

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
        // Normalized mouse coords for parallax (-1 to 1)
        normalizedMx = (mx / window.innerWidth) * 2 - 1;
        normalizedMy = (my / window.innerHeight) * 2 - 1;
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
initMagneticButtons();

// ===== Card flip on click — GSAP multi-phase =====
document.querySelectorAll('.skill-cell').forEach(cell => {
    let isFlipped = false;
    let isFlipping = false;

    cell.addEventListener('click', () => {
        if (isFlipping) return;
        isFlipping = true;

        const inner = cell.querySelector('.card-inner');
        const targetRotY = isFlipped ? 0 : 180;
        const midRotY = 90;

        const tl = gsap.timeline({
            onComplete: () => {
                isFlipped = !isFlipped;
                isFlipping = false;
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

initCardTilt();
initArrowBounce();

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

initStaggerReveals();

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
            { opacity: 0.12, color: 'var(--muted)', y: 20, filter: 'blur(4px)' },
            {
                opacity: 1,
                color: 'var(--fg)',
                y: 0,
                filter: 'blur(0px)',
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

initParagraphReveals();
initParallax();
initColorTransitions(null, sceneRefs);
initSectionDividers();
initFooterReveal();
initWallTunnel();

// ===== 3. (Glow effects removed — cards use 3D flip now) =====

// ===== 4. Scroll-velocity skew on project items =====
let skewTarget = 0;
let currentSkew = 0;

// ===== 5. Marquee scroll-responsive speed =====
const marqueeTrack = document.querySelector('.marquee-track');
const marqueeAnimations = marqueeTrack ? marqueeTrack.getAnimations() : [];
let marqueeRate = 1;

// Consolidated velocity-driven scroll handler
lenis.on('scroll', ({ velocity }) => {
    skewTarget = Math.max(-6, Math.min(6, velocity * 0.25));
    if (marqueeAnimations.length) {
        const target = 1 + Math.abs(velocity) * 0.15;
        marqueeRate += (target - marqueeRate) * 0.1;
        marqueeAnimations.forEach(a => { a.playbackRate = marqueeRate; });
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

// Hero subtitle word cascade
const heroSub = document.querySelector('.hero-sub');
if (heroSub) {
    heroSub.style.animation = 'none';
    const subSplit = new SplitType(heroSub, { types: 'words', wordClass: 'split-word' });
    gsap.set(subSplit.words, { y: 20, opacity: 0, filter: 'blur(3px)' });
    heroSubTl = gsap.to(subSplit.words, {
        y: 0, opacity: 1, filter: 'blur(0px)',
        stagger: 0.04, duration: 0.8, ease: 'power3.out', paused: true,
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

    // Hero text parallax (non-pointer devices only; pointer devices handled in animation loop)
    const heroZoom = Math.min(1, scrollProgress);
    if (!isPointerDevice && heroMain) {
        const y = heroZoom * -120;
        const opacity = Math.max(0, 1 - heroZoom * 1.5);
        const scale = 1 - heroZoom * 0.1;
        heroMain.style.transform = `translateY(${y}px) scale(${scale})`;
        heroMain.style.opacity = opacity;
    }
    if (heroAction) {
        heroAction.style.opacity = Math.max(0, 1 - heroZoom * 3);
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
    // Clamp zoom/rotation progress to 0–1; morph uses the 1–2 range
    const zoomProgress = Math.min(1, scrollProgress);
    // morphProgress: 0 when scrollProgress <= 1, ramps to 1 when scrollProgress reaches 2
    const morphProgress = Math.max(0, Math.min(1, scrollProgress - 1));

    if (globePoints) {
        // Spin speed decreases with scroll
        currentSpinAngle += CONFIG.rotationSpeed * (1 - zoomProgress);
        globePoints.material.uniforms.uTime.value = elapsedTime;

        // Quaternion interpolation: spin -> Japan close-up (clamp at 1)
        _spinQuat.setFromAxisAngle(_yAxis, currentSpinAngle);
        _finalQuat.copy(_spinQuat).slerp(japanQuaternion, zoomProgress);
        globePoints.quaternion.copy(_finalQuat);

        // Feature 7: Ambient mouse tilt on globe
        if (isPointerDevice && zoomProgress < 0.5) {
            const fadeout = Math.max(0, 1 - zoomProgress * 2);
            _mouseTiltQuat.setFromAxisAngle(_xAxis, normalizedMy * 0.04 * fadeout);
            _tempQuat.setFromAxisAngle(_yAxis, normalizedMx * 0.04 * fadeout);
            _mouseTiltQuat.multiply(_tempQuat);
            globePoints.quaternion.multiply(_mouseTiltQuat);
        }

        // Drive morph uniforms: scatter particles and fade them out
        globePoints.material.uniforms.uMorph.value += (morphProgress - globePoints.material.uniforms.uMorph.value) * 0.08;
        // Opacity: stay full during morph scatter (0→0.7), then fade out (0.7→1.0)
        const fadeStart = 0.7;
        const morphOpacity = morphProgress < fadeStart ? 1.0 : 1.0 - ((morphProgress - fadeStart) / (1.0 - fadeStart));
        globePoints.material.uniforms.uMorphOpacity.value += (morphOpacity - globePoints.material.uniforms.uMorphOpacity.value) * 0.08;

        // Keep globe visible during morph (override preloader brightness fade)
        globePoints.visible = morphOpacity > 0.01;

        // Fade out atmosphere mesh during morph
        if (sceneRefs.atmosMesh) {
            const atmosFade = Math.max(0, 1 - morphProgress * 2.5);
            sceneRefs.atmosMesh.material.uniforms.uIntensity.value += (atmosFade - sceneRefs.atmosMesh.material.uniforms.uIntensity.value) * 0.08;
            sceneRefs.atmosMesh.visible = atmosFade > 0.01;
        }
    }

    // Feature 7: Hero text parallax with mouse offset (pointer devices)
    if (isPointerDevice && heroMain && zoomProgress < 1) {
        const fadeout = Math.max(0, 1 - zoomProgress * 1.5);
        const textShiftX = -normalizedMx * 15 * fadeout;
        const textShiftY = -normalizedMy * 10 * fadeout;
        const y = zoomProgress * -120;
        const s = 1 - zoomProgress * 0.1;
        heroMain.style.transform = `translateY(${y}px) scale(${s}) translate(${textShiftX}px, ${textShiftY}px)`;
        heroMain.style.opacity = Math.max(0, 1 - zoomProgress * 1.5);
    }

    // Marker: avatar fades in, ring/line fade out with scroll — hide during morph
    if (markerGroup) {
        const markerRing = markerGroup.children[0];
        if (markerRing) {
            const breathe = 1 - zoomProgress * 0.8;
            const scale = (1.0 + Math.sin(elapsedTime * 3) * 0.2) * breathe;
            markerRing.scale.set(scale, scale, 1);
        }

        markerGroup.getWorldPosition(_worldPos);
        const backfaceAlpha = Math.max(0, Math.min(1, (_worldPos.z + 1.0) / 3.0));

        // Ring & line fade out as we scroll; avatar fades in
        const ringFade = Math.max(0, 1 - Math.max(0, zoomProgress - 0.3) * 2.5);
        const avatarReveal = Math.min(1, zoomProgress * 1.5);
        // Fade out marker entirely during morph
        const markerMorphFade = Math.max(0, 1 - morphProgress * 3);

        markerGroup.children.forEach(child => {
            if (child.material) {
                if (child.isSprite) {
                    // Avatar: starts dim, becomes fully visible on scroll, fades in morph
                    child.material.opacity = backfaceAlpha * (0.15 + 0.85 * avatarReveal) * markerMorphFade;
                } else {
                    // Ring & line: fade out on scroll
                    const baseOpacity = (child.isLine || child.geometry?.type === 'RingGeometry') ? 0.6 : 1.0;
                    child.material.opacity = backfaceAlpha * baseOpacity * ringFade * markerMorphFade;
                }
            }
        });
    }

    // Disable OrbitControls when scroll zoom is active
    controls.enabled = zoomProgress <= 0.01;

    if (controls.enabled) {
        controls.update();
    }

    // Camera zoom driven by scroll (clamp at zoom-close)
    if (globePoints) {
        const targetZ = ZOOM_FAR + (ZOOM_CLOSE - ZOOM_FAR) * zoomProgress;
        camera.position.z += (targetZ - camera.position.z) * 0.12;
    }

    // Skip Three.js render entirely when globe is off-screen
    if (globePoints && globePoints.visible) {
        composer.render();
    } else if (sceneRefs.atmosMesh && sceneRefs.atmosMesh.visible) {
        composer.render();
    }

    // Cursor glow trail disabled
    // cursorRipple.update();
}

// Pause animation when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clock.stop();
    } else {
        clock.start();
    }
});

// ===== Contact Liquid Glass — mouse tracking =====
if (matchMedia('(pointer: fine)').matches) {
    const contactPanel = document.querySelector('.contact-inner');
    if (contactPanel) {
        contactPanel.addEventListener('mousemove', (e) => {
            const rect = contactPanel.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            contactPanel.style.setProperty('--mouse-x', `${x}%`);
            contactPanel.style.setProperty('--mouse-y', `${y}%`);
        });
    }
}

// ===== Contact email — copy to clipboard =====
const emailBtn = document.querySelector('.contact-btn[data-email]');
const copyToast = document.getElementById('copyToast');

if (emailBtn && copyToast) {
    emailBtn.addEventListener('click', () => {
        const email = emailBtn.getAttribute('data-email');
        navigator.clipboard.writeText(email).then(() => {
            copyToast.classList.add('show');
            setTimeout(() => copyToast.classList.remove('show'), 1800);
        }).catch(() => {
            // Fallback for older browsers / insecure contexts
            const ta = document.createElement('textarea');
            ta.value = email;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copyToast.classList.add('show');
            setTimeout(() => copyToast.classList.remove('show'), 1800);
        });
    });
}

window.onload = function () {
    animate(performance.now());
};
