import * as THREE from 'three';

export const CONFIG = {
    particleCount: 200000,
    globeRadius: 7,
    particleSize: 1.8,
    color: 0xe8ff47,
    rotationSpeed: 0.0008
};

export const ZOOM_FAR = 45;
export const ZOOM_CLOSE = 18;
// Pre-compute Japan Yamanashi quaternion for camera targeting
const _jLat = 35.66 * (Math.PI / 180);
const _jLon = 138.57 * (Math.PI / 180);
const japanDir = new THREE.Vector3(
    Math.cos(_jLon) * Math.cos(_jLat),
    Math.sin(_jLat),
    Math.sin(_jLon) * Math.cos(_jLat)
).normalize();

export const japanQuaternion = new THREE.Quaternion().setFromUnitVectors(
    japanDir, new THREE.Vector3(0, 0, 1)
);
