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
