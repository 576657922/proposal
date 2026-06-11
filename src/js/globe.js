import { BufferGeometry, BufferAttribute, ShaderMaterial, Color, Points, NormalBlending } from 'three';
import { CONFIG, japanQuaternion } from './config.js';
import { scene } from './scene.js';

export function createGlobe(texture) {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(CONFIG.particleCount * 3);
    const randomTargets = new Float32Array(CONFIG.particleCount * 3);
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

        // Random scattered target positions for morph
        // Spread particles across a wide area
        randomTargets[i * 3] = (Math.random() - 0.5) * 80;
        randomTargets[i * 3 + 1] = (Math.random() - 0.5) * 50;
        randomTargets[i * 3 + 2] = (Math.random() - 0.5) * 40;

        const u = 0.5 + (Math.atan2(z, x) / (2 * Math.PI));
        const v = 0.5 + (Math.asin(y) / Math.PI);

        uvs[i * 2] = u;
        uvs[i * 2 + 1] = v;
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aRandomTarget', new BufferAttribute(randomTargets, 3));
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2));

    const shaderMaterial = new ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uColor: { value: new Color(CONFIG.color) },
            uTime: { value: 0 },
            uHasTexture: { value: texture ? 1.0 : 0.0 },
            uBrightness: { value: 0.3 },
            uMorph: { value: 0.0 },
            uMorphOpacity: { value: 1.0 }
        },
        vertexShader: `
            attribute vec3 aRandomTarget;
            varying vec2 vUv;
            varying float vFresnel;
            uniform float uTime;
            uniform float uMorph;
            void main() {
                vUv = uv;

                // Morph between sphere position and random scattered target
                vec3 morphedPos = mix(position, aRandomTarget, uMorph);

                // Add slow floating motion when morphed
                if (uMorph > 0.0) {
                    float floatPhase = uTime * 0.3 + position.x * 0.5 + position.y * 0.7;
                    morphedPos.x += sin(floatPhase) * 1.5 * uMorph;
                    morphedPos.y += cos(floatPhase * 0.7) * 1.0 * uMorph;
                    morphedPos.z += sin(floatPhase * 0.5 + 1.0) * 0.8 * uMorph;
                }

                vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);

                // Size increases slightly when scattered
                float baseSize = ${CONFIG.particleSize.toFixed(1)} + sin(uTime * 2.0 + vUv.x * 10.0) * 0.5;
                float morphSize = mix(baseSize, baseSize * 0.6, uMorph);
                gl_PointSize = morphSize * (20.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;

                // Fresnel: use normalized position as sphere normal
                // Fade fresnel out during morph since particles are no longer on a sphere
                vec3 worldNormal = normalize(normalMatrix * normalize(position));
                vec3 viewDir = normalize(-mvPosition.xyz);
                float rim = 1.0 - max(0.0, dot(viewDir, worldNormal));
                vFresnel = pow(rim, 2.5) * (1.0 - uMorph);
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform vec3 uColor;
            uniform float uHasTexture;
            uniform float uBrightness;
            uniform float uMorph;
            uniform float uMorphOpacity;
            varying vec2 vUv;
            varying float vFresnel;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float alpha = smoothstep(0.5, 0.3, dist);
                if (uHasTexture > 0.5 && uMorph < 0.5) {
                    vec4 texColor = texture2D(uTexture, vUv);
                    if (texColor.r > 0.3) discard;
                }
                // Fresnel edge glow: boost brightness and alpha at rim
                float fresnelGlow = vFresnel * 0.6;
                vec3 finalColor = uColor * (1.0 + fresnelGlow * 1.5);
                float finalAlpha = alpha * uBrightness * (0.9 + fresnelGlow) * uMorphOpacity;
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `,
        transparent: true,
        // blueprint: NormalBlending so dark ink particles stay visible on the
        // light paper background (additive would wash them out to white)
        blending: NormalBlending,
        depthWrite: false
    });

    const globePoints = new Points(geometry, shaderMaterial);

    // Initial orientation: use quaternion to precisely position Japan facing camera
    globePoints.quaternion.copy(japanQuaternion);

    scene.add(globePoints);

    return globePoints;
}
