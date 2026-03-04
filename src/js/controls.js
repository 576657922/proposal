let scrollProgress = 0; // 0 = far view (small globe), 1 = close-up (Japan)

export function getScrollProgress() {
    return scrollProgress;
}

export function initScrollControls() {
    function onScroll() {
        // First 100vh of scroll maps to 0→1 zoom progress
        scrollProgress = Math.min(1, window.scrollY / window.innerHeight);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Set initial value in case page is already scrolled
    onScroll();
}
