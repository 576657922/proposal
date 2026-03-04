const CHARS = '!<>-_\\/[]{}—=+*^?#________'

export function textScramble(el, finalText, duration = 800) {
    const length = finalText.length
    const startTime = performance.now()
    let raf = 0

    const update = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const resolvedCount = Math.floor(progress * length)

        let output = ''
        for (let i = 0; i < length; i++) {
            if (i < resolvedCount) {
                output += finalText[i]
            } else if (finalText[i] === ' ') {
                output += ' '
            } else {
                output += CHARS[Math.floor(Math.random() * CHARS.length)]
            }
        }

        el.textContent = output

        if (progress < 1) {
            raf = requestAnimationFrame(update)
        } else {
            el.textContent = finalText
        }
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
}
