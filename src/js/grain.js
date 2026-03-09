/**
 * Animated canvas noise overlay — replaces static SVG grain on pointer devices.
 * Renders random grayscale pixels at 12fps for a film-grain look.
 */

export function initAnimatedGrain() {
    return; // DEBUG: temporarily disabled to diagnose red tint
    if (!matchMedia('(pointer: fine)').matches) return;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    canvas.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        mix-blend-mode: overlay;
        opacity: 0.12;
        pointer-events: none;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(256, 256);
    const data = imageData.data;

    function generateNoise() {
        for (let i = 0, len = data.length; i < len; i += 4) {
            const v = (Math.random() * 255) | 0;
            data[i]     = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    generateNoise();
    let intervalId = setInterval(generateNoise, 83); // ~12fps

    // Pause grain when tab is hidden to save CPU
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(intervalId);
            intervalId = null;
        } else if (!intervalId) {
            intervalId = setInterval(generateNoise, 83);
        }
    });
}
