import * as THREE from 'three';
import '../styles/main.css';
import { CONFIG, ZOOM_FAR, ZOOM_CLOSE, japanQuaternion } from './config.js';
import { scene, camera, renderer, controls } from './scene.js';
import { createGlobe } from './globe.js';
import { createAtmosphere } from './atmosphere.js';
import { createAvatarMarker } from './marker.js';
import { getScrollProgress, initScrollControls } from './controls.js';

// Initialize scroll-driven zoom
initScrollControls();

let globePoints = null;
let markerGroup = null;
let currentSpinAngle = 0;

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
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== Smooth scroll for anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
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
        const spinQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), currentSpinAngle
        );
        const finalQuat = spinQuat.clone().slerp(japanQuaternion, scrollProgress);
        globePoints.quaternion.copy(finalQuat);
    }

    // Ring breathing effect and backface transparency
    if (markerGroup) {
        const ring = markerGroup.children[0];
        if (ring) {
            const scale = 1.0 + Math.sin(elapsedTime * 3) * 0.2;
            ring.scale.set(scale, scale, 1);
        }

        const worldPos = new THREE.Vector3();
        markerGroup.getWorldPosition(worldPos);

        const alpha = Math.max(0, Math.min(1, (worldPos.z + 1.0) / 3.0));

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
        camera.position.z += (targetZ - camera.position.z) * 0.08;
    }

    renderer.render(scene, camera);
}

window.onload = function () {
    animate();
};
