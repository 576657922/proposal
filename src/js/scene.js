import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
