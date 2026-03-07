import { Vector3, Quaternion } from 'three';

const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;

export const CONFIG = {
    particleCount: isMobile ? 80000 : 200000,
    globeRadius: 7,
    particleSize: 1.8,
    color: 0xe8ff47,
    rotationSpeed: 0.0014
};

export const ZOOM_FAR = 45;
export const ZOOM_CLOSE = 18;
// Pre-compute Japan Yamanashi quaternion for camera targeting
const _jLat = 35.66 * (Math.PI / 180);
const _jLon = 138.57 * (Math.PI / 180);
const japanDir = new Vector3(
    Math.cos(_jLon) * Math.cos(_jLat),
    Math.sin(_jLat),
    Math.sin(_jLon) * Math.cos(_jLat)
).normalize();

export const japanQuaternion = new Quaternion().setFromUnitVectors(
    japanDir, new Vector3(0, 0, 1)
);
