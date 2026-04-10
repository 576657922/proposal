/**
 * Film-grain overlay using a pre-generated noise canvas as a CSS background.
 * Static texture with CSS animation for movement — near-zero GPU cost.
 */

export function initAnimatedGrain() {
    // Generate a small noise texture once
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0, len = data.length; i < len; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i]     = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    const dataURL = canvas.toDataURL('image/png');

    // Inject stylesheet with animation
    const style = document.createElement('style');
    style.textContent = `
        .grain-overlay {
            position: fixed;
            inset: -25%;
            width: 150%;
            height: 150%;
            z-index: 10000;
            opacity: 0.05;
            pointer-events: none;
            background-image: url(${dataURL});
            background-repeat: repeat;
            animation: grain-shift 0.5s steps(4) infinite;
        }
        @keyframes grain-shift {
            0%   { transform: translate(0, 0); }
            25%  { transform: translate(-32px, 16px); }
            50%  { transform: translate(16px, -32px); }
            75%  { transform: translate(-16px, -16px); }
            100% { transform: translate(32px, 32px); }
        }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'grain-overlay';
    document.body.appendChild(overlay);
}
