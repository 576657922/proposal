/**
 * Film-grain overlay using SVG feTurbulence filter.
 * No canvas, no mix-blend-mode — avoids red tint GPU issue.
 * Animates seed value at ~12fps for organic noise movement.
 */

export function initAnimatedGrain() {
    // Create SVG filter for noise generation (GPU-safe, no blend-mode needed)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = `
        <filter id="grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" seed="0" result="noise"/>
            <feColorMatrix type="saturate" values="0" in="noise" result="mono"/>
        </filter>
    `;
    document.body.appendChild(svg);

    // Create overlay div with the SVG filter
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: -50%;
        width: 200%;
        height: 200%;
        z-index: 10000;
        opacity: 0.045;
        pointer-events: none;
        filter: url(#grain-filter);
        background: transparent;
    `;
    document.body.appendChild(overlay);

    // Animate seed for organic noise movement
    const turbulence = svg.querySelector('feTurbulence');
    let seed = 0;
    let intervalId = setInterval(() => {
        seed = (seed + 1) % 100;
        turbulence.setAttribute('seed', seed);
    }, 83); // ~12fps

    // Pause when tab is hidden to save CPU
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(intervalId);
            intervalId = null;
        } else if (!intervalId) {
            intervalId = setInterval(() => {
                seed = (seed + 1) % 100;
                turbulence.setAttribute('seed', seed);
            }, 83);
        }
    });
}
