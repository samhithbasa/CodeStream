// ✨ Sparkle Cursor Effect
(function () {
    const colors = ['#00ffff', '#a78bfa', '#f472b6', '#facc15', '#34d399', '#60a5fa'];

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createSparkle(x, y) {
        const count = 6;
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 99999;
                border-radius: 50%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: ${y}px;
                left: ${x}px;
                width: ${random(4, 9)}px;
                height: ${random(4, 9)}px;
                opacity: 1;
                transform: translate(-50%, -50%);
                transition: none;
            `;
            document.body.appendChild(sparkle);

            const angle = random(0, Math.PI * 2);
            const velocity = random(40, 90);
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            let startTime = null;
            const duration = random(500, 900);

            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = (timestamp - startTime) / duration;

                if (progress >= 1) {
                    sparkle.remove();
                    return;
                }

                sparkle.style.left = `${x + vx * progress}px`;
                sparkle.style.top = `${y + vy * progress + 0.5 * 300 * progress * progress}px`;
                sparkle.style.opacity = 1 - progress;
                sparkle.style.transform = `translate(-50%, -50%) scale(${1 - progress * 0.5})`;

                requestAnimationFrame(animate);
            }

            requestAnimationFrame(animate);
        }
    }

    let throttle = false;
    document.addEventListener('mousemove', (e) => {
        if (throttle) return;
        throttle = true;
        setTimeout(() => { throttle = false; }, 30);
        createSparkle(e.clientX, e.clientY);
    });
})();
