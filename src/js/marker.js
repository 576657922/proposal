import {
    Group, Vector3, RingGeometry, MeshBasicMaterial, DoubleSide, Mesh,
    BufferGeometry, LineBasicMaterial, Line, CanvasTexture, SpriteMaterial, Sprite
} from 'three';
import { CONFIG } from './config.js';

export function createAvatarMarker(globePoints) {
    const markerGroup = new Group();

    // Compute Japan Yamanashi (Lat: 35.66 N, Lon: 138.57 E) surface coordinates
    const lat = 35.66;
    const lon = 138.57;
    const latRad = lat * (Math.PI / 180);
    const lonRad = lon * (Math.PI / 180);

    const surfaceRadius = CONFIG.globeRadius * 1.01;
    const floatRadius = CONFIG.globeRadius * 1.35;

    // Surface position
    const ySurface = Math.sin(latRad) * surfaceRadius;
    const rSurfaceAtY = Math.cos(latRad) * surfaceRadius;
    const xSurface = Math.cos(lonRad) * rSurfaceAtY;
    const zSurface = Math.sin(lonRad) * rSurfaceAtY;
    const surfacePos = new Vector3(xSurface, ySurface, zSurface);

    // Floating position
    const yFloat = Math.sin(latRad) * floatRadius;
    const rFloatAtY = Math.cos(latRad) * floatRadius;
    const xFloat = Math.cos(lonRad) * rFloatAtY;
    const zFloat = Math.sin(lonRad) * rFloatAtY;
    const floatPos = new Vector3(xFloat, yFloat, zFloat);

    // --- A. Surface ring (Ripple) ---
    const ringGeo = new RingGeometry(0.1, 0.25, 32);
    const ringMat = new MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.8,
        side: DoubleSide
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.position.copy(surfacePos);
    ring.lookAt(surfacePos.clone().multiplyScalar(2));
    markerGroup.add(ring);

    // --- B. Connection line (sci-fi pin) ---
    const lineGeo = new BufferGeometry().setFromPoints([surfacePos, floatPos]);
    const lineMat = new LineBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.5
    });
    const line = new Line(lineGeo, lineMat);
    markerGroup.add(line);

    // --- C. Floating avatar sprite ---
    function buildSprite(loadedImg) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);

        ctx.save();
        ctx.beginPath();
        ctx.arc(128, 128, 110, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (loadedImg) {
            const size = Math.min(loadedImg.width, loadedImg.height);
            const x = (loadedImg.width - size) / 2;
            const y = (loadedImg.height - size) / 2;
            ctx.drawImage(loadedImg, x, y, size, size, 18, 18, 220, 220);
        } else {
            ctx.fillStyle = '#ffcc00';
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.font = 'bold 60px Inter, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ME', 128, 134);
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(128, 128, 110, 0, Math.PI * 2);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#ffcc00';
        ctx.stroke();

        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;

        let avatarSprite = markerGroup.children.find(c => c.isSprite);
        if (!avatarSprite) {
            const material = new SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false
            });
            avatarSprite = new Sprite(material);
            avatarSprite.scale.set(0.9, 0.9, 1);
            avatarSprite.position.copy(floatPos);
            markerGroup.add(avatarSprite);

            if (globePoints) {
                globePoints.add(markerGroup);
            }
        } else {
            const oldTexture = avatarSprite.material.map;
            avatarSprite.material.map = texture;
            avatarSprite.material.needsUpdate = true;
            if (oldTexture) oldTexture.dispose();
        }
    }

    buildSprite(null); // Render placeholder first

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => buildSprite(img);
    img.src = '/images/avatar.png';

    return markerGroup;
}
