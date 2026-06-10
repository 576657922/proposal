import { Scene, PerspectiveCamera, WebGLRenderer, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ZOOM_FAR } from './config.js';

const container = document.getElementById('canvas-container');

export const scene = new Scene();

export const camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    100
);
camera.position.set(0, 0, ZOOM_FAR);

export const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
});
// Cap device pixel ratio: 2 keeps the main scene crisp without paying for 3x retina.
const PIXEL_RATIO = Math.min(window.devicePixelRatio, 2);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(PIXEL_RATIO);
container.appendChild(renderer.domElement);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;
controls.minDistance = 10;
controls.maxDistance = 50;

// Disable touch controls so they don't block page scrolling on mobile
controls.touches = {};
renderer.domElement.style.touchAction = 'pan-y';

// ===== Post-processing: Bloom =====
const resolution = new Vector2(window.innerWidth / 2, window.innerHeight / 2);
export const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(resolution, 0.4, 0.4, 0.85);
composer.addPass(bloomPass);
composer.setSize(window.innerWidth, window.innerHeight);
// Bloom is a soft glow, so render the composer (RenderPass + blur passes) at a
// lower pixel ratio than the main renderer — large fill-rate saving, no visible loss.
composer.setPixelRatio(Math.min(PIXEL_RATIO, 1.5));
