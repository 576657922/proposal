import * as THREE from 'three';
import '../styles/main.css';
import { CONFIG, ZOOM_FAR, ZOOM_CLOSE, japanQuaternion } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';
import { createGlobe } from './globe.js';
import { createAtmosphere } from './atmosphere.js';
import { createAvatarMarker } from './marker.js';
import { getScrollProgress, initScrollControls } from './controls.js';
import { textScramble } from './text-scramble.js';
import Lenis from 'lenis';
import gsap from 'gsap';
import SplitType from 'split-type';

// ===== Lenis smooth scroll =====
const lenis = new Lenis({
    lerp: 0.07,
    wheelMultiplier: 0.8,
    smoothTouch: false,
});

function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
}
requestAnimationFrame(lenisRaf);

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

let globePoints = null;
let markerGroup = null;
let currentSpinAngle = 0;

// Pre-allocated objects for animation loop (avoid per-frame GC)
const _spinQuat = new THREE.Quaternion();
const _finalQuat = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _worldPos = new THREE.Vector3();

// Load earth specular texture
const textureLoader = new THREE.TextureLoader();
const textureUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg';

textureLoader.load(textureUrl, (texture) => {
    document.getElementById('loading').style.opacity = '0';
    setTimeout(() => document.getElementById('loading').style.display = 'none', 500);

    globePoints = createGlobe(texture);
    createAtmosphere();
    markerGroup = createAvatarMarker(globePoints);
});

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== Custom cursor =====
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, dx = 0, dy = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx - 4 + 'px';
    dot.style.top = my - 4 + 'px';
});

function animateRing() {
    dx += (mx - dx) * 0.12;
    dy += (my - dy) * 0.12;
    ring.style.left = dx - 20 + 'px';
    ring.style.top = dy - 20 + 'px';
    requestAnimationFrame(animateRing);
}
animateRing();

// Expand ring on interactive elements
document.querySelectorAll('a, button, .project-item, .contact-btn, .skill-cell').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
});

// Hide cursor on touch devices
if ('ontouchstart' in window) {
    dot.style.display = 'none';
    ring.style.display = 'none';
}

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

// ===== Hero SplitText animation =====
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    // Remove CSS animation classes so GSAP takes over
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

    // Ensure parent lines are visible
    heroTitle.querySelectorAll('.line span').forEach(span => {
        span.style.opacity = '1';
        span.style.transform = 'none';
    });

    gsap.set(split.chars, { y: '110%', opacity: 0, rotateX: -80 });

    // Trigger after a short delay
    gsap.to(split.chars, {
        y: '0%',
        opacity: 1,
        rotateX: 0,
        stagger: 0.035,
        duration: 1.2,
        ease: 'power4.out',
        delay: 0.6,
    });
}

// ===== Hero parallax fade-out on scroll =====
const heroMain = document.querySelector('.ui-layer main');
const heroAction = document.querySelector('.action-area');

lenis.on('scroll', () => {
    const scrollProgress = getScrollProgress();

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
});

// ===== Parallax orbs on scroll =====
const orb1 = document.querySelector('.orb-1');
const orb2 = document.querySelector('.orb-2');

if (orb1 && orb2) {
    window.addEventListener('scroll', () => {
        const s = window.scrollY;
        orb1.style.transform = 'translate(' + s * 0.03 + 'px,' + s * -0.05 + 'px)';
        orb2.style.transform = 'translate(' + s * -0.02 + 'px,' + s * 0.04 + 'px)';
    }, { passive: true });
}

// ===== Timeline scroll-driven progress =====
const timeline = document.getElementById('timeline');
const timelineProgress = document.getElementById('timelineProgress');
const timelineDots = document.querySelectorAll('.timeline-dot');
const STEP_COUNT = timelineDots.length;

if (timeline && timelineProgress) {
    window.addEventListener('scroll', () => {
        const rect = timeline.getBoundingClientRect();
        const viewH = window.innerHeight;
        // start when top hits 60% of viewport, end when bottom hits 40%
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
    }, { passive: true });
}

// ===== Three.js animation loop =====
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

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

    // Ring breathing effect and backface transparency
    if (markerGroup) {
        const ring = markerGroup.children[0];
        if (ring) {
            const scale = 1.0 + Math.sin(elapsedTime * 3) * 0.2;
            ring.scale.set(scale, scale, 1);
        }

        markerGroup.getWorldPosition(_worldPos);

        const alpha = Math.max(0, Math.min(1, (_worldPos.z + 1.0) / 3.0));

        markerGroup.children.forEach(child => {
            if (child.material) {
                let baseOpacity = 1.0;
                if (child.isLine || child.geometry.type === 'RingGeometry') {
                    baseOpacity = 0.6;
                }
                child.material.opacity = alpha * baseOpacity;
            }
        });
    }

    // Disable OrbitControls when scroll zoom is active
    if (scrollProgress > 0.01) {
        controls.enabled = false;
    } else {
        controls.enabled = true;
    }

    if (controls.enabled) {
        controls.update();
    }

    // Camera zoom driven by scroll
    if (globePoints) {
        const targetZ = ZOOM_FAR + (ZOOM_CLOSE - ZOOM_FAR) * scrollProgress;
        camera.position.z += (targetZ - camera.position.z) * 0.12;
    }

    renderer.render(scene, camera);
}

window.onload = function () {
    animate();
};
