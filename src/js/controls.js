let scrollProgress = 0; // 0 = far view (small globe), 1 = close-up (Japan), >1 = morph zone

export function getScrollProgress() {
    return scrollProgress;
}

export function initScrollControls() {
    function onScroll() {
        // First 100vh → 0→1 zoom progress; next 100vh → 1→2 morph zone
        scrollProgress = Math.min(2, window.scrollY / window.innerHeight);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Set initial value in case page is already scrolled
    onScroll();
}
