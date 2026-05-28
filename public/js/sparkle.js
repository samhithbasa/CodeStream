// ✨ Premium Magical Star-Sparkle Cursor Effect
(function () {
    const colors = ['#ffffff', '#facc15', '#a78bfa', '#f472b6', '#00ffff'];

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createSparkle(x, y) {
        const count = Math.floor(random(1, 3)); // 1 to 2 sparkles per mousemove event
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = random(8, 16);
            
            // Create a gorgeous 4-pointed star using CSS clip-path and radial glow
            sparkle.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 99999;
                background: ${color};
                top: ${y}px;
                left: ${x}px;
                width: ${size}px;
                height: ${size}px;
                opacity: 1;
                clip-path: polygon(50% 0%, 63% 37%, 100% 50%, 63% 63%, 50% 100%, 37% 63%, 0% 50%, 37% 37%);
                filter: drop-shadow(0 0 4px ${color});
                transform: translate(-50%, -50%) scale(0) rotate(0deg);
                transition: none;
            `;
            document.body.appendChild(sparkle);

            // Gentle random movement vector
            const angle = random(0, Math.PI * 2);
            const velocity = random(20, 45); // slower, more drift-like velocity
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity - random(10, 20); // slight upward float bias
            
            let startTime = null;
            const duration = random(700, 1100);
            const spinDirection = Math.random() > 0.5 ? 1 : -1;
            const maxRotation = random(120, 360) * spinDirection;

            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = (timestamp - startTime) / duration;

                if (progress >= 1) {
                    sparkle.remove();
                    return;
                }

                // Smooth drift
                const currentX = x + vx * progress;
                const currentY = y + vy * progress;
                
                // Scale starts at 0, quickly grows to 1, then shrinks to 0 at the end
                let scale = 1;
                if (progress < 0.15) {
                    scale = progress / 0.15;
                } else {
                    scale = 1 - (progress - 0.15) / 0.85;
                }

                sparkle.style.left = `${currentX}px`;
                sparkle.style.top = `${currentY}px`;
                sparkle.style.opacity = 1 - progress;
                sparkle.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${progress * maxRotation}deg)`;

                requestAnimationFrame(animate);
            }

            requestAnimationFrame(animate);
        }
    }

    let throttle = false;
    document.addEventListener('mousemove', (e) => {
        if (throttle) return;
        throttle = true;
        setTimeout(() => { throttle = false; }, 70); // 70ms throttle for elegant density
        createSparkle(e.clientX, e.clientY);
    });
})();
