import * as THREE from 'three';
import { CONFIG } from './config.js';
import { scene } from './scene.js';

export function createAtmosphere() {
    const atmosGeo = new THREE.SphereGeometry(CONFIG.globeRadius * 1.02, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(CONFIG.color) } },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vec3 viewDir = normalize(-vPosition);
                float intensity = pow(0.6 - dot(vNormal, viewDir), 3.0);
                gl_FragColor = vec4(uColor, intensity * 0.15);
            }
        `,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));
}
