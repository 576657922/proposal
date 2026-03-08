import { SphereGeometry, ShaderMaterial, Color, AdditiveBlending, Mesh } from 'three';
import { CONFIG } from './config.js';
import { scene } from './scene.js';

export function createAtmosphere() {
    const atmosGeo = new SphereGeometry(CONFIG.globeRadius * 1.02, 32, 32);
    const atmosMat = new ShaderMaterial({
        uniforms: {
            uColor: { value: new Color(CONFIG.color) },
            uIntensity: { value: 1.0 },
        },
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
            uniform float uIntensity;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vec3 viewDir = normalize(-vPosition);
                float intensity = pow(0.6 - dot(vNormal, viewDir), 3.0);
                gl_FragColor = vec4(uColor, intensity * 0.15 * uIntensity);
            }
        `,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false
    });
    const atmosMesh = new Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);
    return atmosMesh;
}
