import { BufferGeometry, BufferAttribute, ShaderMaterial, Color, Points, AdditiveBlending } from 'three';
import { CONFIG, japanQuaternion } from './config.js';
import { scene } from './scene.js';

export function createGlobe(texture) {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(CONFIG.particleCount * 3);
    const uvs = new Float32Array(CONFIG.particleCount * 2);

    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < CONFIG.particleCount; i++) {
        const y = 1 - (i / (CONFIG.particleCount - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        positions[i * 3] = x * CONFIG.globeRadius;
        positions[i * 3 + 1] = y * CONFIG.globeRadius;
        positions[i * 3 + 2] = z * CONFIG.globeRadius;

        const u = 0.5 + (Math.atan2(z, x) / (2 * Math.PI));
        const v = 0.5 + (Math.asin(y) / Math.PI);

        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2));

    const shaderMaterial = new ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uColor: { value: new Color(CONFIG.color) },
            uTime: { value: 0 },
            uHasTexture: { value: texture ? 1.0 : 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            uniform float uTime;
            void main() {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float size = ${CONFIG.particleSize.toFixed(1)} + sin(uTime * 2.0 + vUv.x * 10.0) * 0.5;
                gl_PointSize = size * (20.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform vec3 uColor;
            uniform float uHasTexture;
            varying vec2 vUv;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float alpha = smoothstep(0.5, 0.3, dist);
                if (uHasTexture > 0.5) {
                    vec4 texColor = texture2D(uTexture, vUv);
                    if (texColor.r > 0.3) discard;
                }
                gl_FragColor = vec4(uColor, alpha * 0.9);
            }
        `,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false
    });

    const globePoints = new Points(geometry, shaderMaterial);

    // Initial orientation: use quaternion to precisely position Japan facing camera
    globePoints.quaternion.copy(japanQuaternion);

    scene.add(globePoints);

    return globePoints;
}
