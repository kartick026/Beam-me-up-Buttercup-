export class Background {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.stars = [];
        this.nebulae = [];
        this.currentTheme = 'space';
        this.themeTransition = 0;
        this.nextTheme = null;

        this.initStars();
        this.initNebulae();
    }

    initStars() {
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.1,
                brightness: Math.random()
            });
        }
    }

    initNebulae() {
        for (let i = 0; i < 3; i++) {
            this.nebulae.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 300 + 200,
                hue: Math.random() * 360,
                speed: Math.random() * 0.1 + 0.05
            });
        }
    }

    setTheme(level) {
        const themes = ['space', 'nebula', 'cosmic', 'void', 'galaxy'];
        const newTheme = themes[Math.min(level - 1, themes.length - 1)];

        if (newTheme !== this.currentTheme) {
            this.nextTheme = newTheme;
            this.themeTransition = 0;
        }
    }

    update(dt) {
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed * 60 * dt;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
            star.brightness = Math.sin(Date.now() / 1000 + star.x) * 0.5 + 0.5;
        });

        // Update nebulae
        this.nebulae.forEach(nebula => {
            nebula.y += nebula.speed * 60 * dt;
            if (nebula.y > this.height + nebula.size) {
                nebula.y = -nebula.size;
                nebula.x = Math.random() * this.width;
            }
        });

        // Handle theme transition
        if (this.nextTheme) {
            this.themeTransition += dt * 0.5;
            if (this.themeTransition >= 1) {
                this.currentTheme = this.nextTheme;
                this.nextTheme = null;
                this.themeTransition = 0;
            }
        }
    }

    draw(ctx) {
        // Draw base gradient based on theme
        this.drawThemeBackground(ctx);

        // Draw nebulae
        this.drawNebulae(ctx);

        // Draw stars
        this.drawStars(ctx);
    }

    drawThemeBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);

        switch (this.currentTheme) {
            case 'space':
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.5, '#0a0a15');
                gradient.addColorStop(1, '#000000');
                break;
            case 'nebula':
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.5, '#0f0520');
                gradient.addColorStop(1, '#000000');
                break;
            case 'cosmic':
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.5, '#050a15');
                gradient.addColorStop(1, '#000000');
                break;
            case 'void':
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.5, '#050005');
                gradient.addColorStop(1, '#000000');
                break;
            case 'galaxy':
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.5, '#0a0520');
                gradient.addColorStop(1, '#000000');
                break;
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawNebulae(ctx) {
        this.nebulae.forEach(nebula => {
            const gradient = ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.size
            );

            gradient.addColorStop(0, `hsla(${nebula.hue}, 70%, 30%, 0.1)`);
            gradient.addColorStop(0.5, `hsla(${nebula.hue + 30}, 60%, 20%, 0.05)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(
                nebula.x - nebula.size,
                nebula.y - nebula.size,
                nebula.size * 2,
                nebula.size * 2
            );
        });
    }

    drawStars(ctx) {
        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.8})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();

            // Twinkle effect for larger stars
            if (star.size > 1.5 && star.brightness > 0.7) {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.2})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}
