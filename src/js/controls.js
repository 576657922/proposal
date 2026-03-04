import { SCROLL_SENSITIVITY } from './config.js';

let scrollProgress = 0; // 0 = far view (small globe), 1 = close-up (Japan)

export function getScrollProgress() {
    return scrollProgress;
}

export function initScrollControls() {
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollProgress += e.deltaY * SCROLL_SENSITIVITY;
        scrollProgress = Math.max(0, Math.min(1, scrollProgress));
    }, { passive: false });
}
