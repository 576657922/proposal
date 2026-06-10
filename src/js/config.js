import { Vector3, Quaternion } from 'three';

const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
// Treat machines with few logical cores or little RAM as low-end and scale particles down.
const isLowEnd =
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4);

function pickParticleCount() {
    if (isMobile) return isLowEnd ? 40000 : 60000;
    return isLowEnd ? 80000 : 130000;
}

export const CONFIG = {
    particleCount: pickParticleCount(),
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
