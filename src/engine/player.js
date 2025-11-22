export const PLAYER_STATS = {
    speed: 260,
    health: 100,
    fireRate: 0.14,
    width: 30,
    height: 30,
    color: '#00f0ff'
};

export class Player {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.width = PLAYER_STATS.width;
        this.height = PLAYER_STATS.height;
        this.speed = PLAYER_STATS.speed;
        this.health = PLAYER_STATS.health;
        this.maxHealth = PLAYER_STATS.health;
        this.fireRate = PLAYER_STATS.fireRate;
        this.lastShotTime = 0;
        this.vx = 0;
        this.vy = 0;
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashTime = 0;
        this.color = PLAYER_STATS.color;

        // Weapon system
        this.weaponType = 'normal'; // normal, shotgun, laser, missile, pulse
        this.weaponTime = 0;

        // Powerup states
        this.shieldActive = false;
        this.shieldTime = 0;
        this.rapidFireActive = false;
        this.rapidFireTime = 0;

        // Laser specific
        this.laserEnergy = 100;
        this.maxLaserEnergy = 100;
        this.laserDrainRate = 20; // per second
        this.laserRechargeRate = 10; // per second when not firing

        // Missile specific
        this.missileCount = 0;
        this.maxMissiles = 10;
    }

    update(input, dt, canvasWidth, canvasHeight, isFiring) {
        // Powerup timers
        if (this.shieldActive) {
            this.shieldTime -= dt;
            if (this.shieldTime <= 0) this.shieldActive = false;
        }
        if (this.rapidFireActive) {
            this.rapidFireTime -= dt;
            if (this.rapidFireTime <= 0) {
                this.rapidFireActive = false;
                this.fireRate = PLAYER_STATS.fireRate;
            }
        }

        // Weapon timers
        if (this.weaponTime > 0) {
            this.weaponTime -= dt;
            if (this.weaponTime <= 0) {
                this.weaponType = 'normal';
            }
        }

        // Laser energy management
        if (this.weaponType === 'laser') {
            if (isFiring && this.laserEnergy > 0) {
                this.laserEnergy -= this.laserDrainRate * dt;
                if (this.laserEnergy < 0) this.laserEnergy = 0;
            } else {
                this.laserEnergy += this.laserRechargeRate * dt;
                if (this.laserEnergy > this.maxLaserEnergy) this.laserEnergy = this.maxLaserEnergy;
            }
        }

        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.isDashing) {
            this.dashTime -= dt;
            if (this.dashTime <= 0) {
                this.isDashing = false;
                this.vx = 0;
                this.vy = 0;
            } else {
                this.x += this.vx * dt * 3;
                this.y += this.vy * dt * 3;
            }
        } else {
            let dx = 0;
            let dy = 0;

            if (input.keys['w'] || input.keys['arrowup']) dy = -1;
            if (input.keys['s'] || input.keys['arrowdown']) dy = 1;
            if (input.keys['a'] || input.keys['arrowleft']) dx = -1;
            if (input.keys['d'] || input.keys['arrowright']) dx = 1;

            if (input.joystick.active) {
                dx = input.joystick.x;
                dy = input.joystick.y;
            }

            if (dx !== 0 || dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                dx /= length;
                dy /= length;
            }

            this.vx = dx * this.speed;
            this.vy = dy * this.speed;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            if ((input.keys['shift'] || input.dashRequest) && this.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
                this.isDashing = true;
                this.dashTime = 0.2;
                this.dashCooldown = 2.0;
                input.dashRequest = false;
            }
        }

        this.x = Math.max(this.width / 2, Math.min(canvasWidth - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvasHeight - this.height / 2, this.y));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const pulseSize = Math.sin(Date.now() / 200) * 3;
        const auraGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width + pulseSize + 10);
        auraGradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
        auraGradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.1)');
        auraGradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width + pulseSize + 10, 0, Math.PI * 2);
        ctx.fill();

        if (this.shieldActive) {
            const shieldPulse = Math.sin(Date.now() / 150) * 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.width + shieldPulse, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        bodyGradient.addColorStop(0, '#1a4d5c');
        bodyGradient.addColorStop(0.6, '#0d2633');
        bodyGradient.addColorStop(1, '#051419');

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = PLAYER_STATS.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = PLAYER_STATS.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const engineCount = 8;
        const engineRadius = this.width / 2.8;
        const engineGlow = Math.sin(Date.now() / 100) * 0.3 + 0.7;

        for (let i = 0; i < engineCount; i++) {
            const angle = (Math.PI * 2 / engineCount) * i;
            const ex = Math.cos(angle) * engineRadius;
            const ey = Math.sin(angle) * engineRadius;

            const engineGradient = ctx.createRadialGradient(ex, ey, 0, ex, ey, 4);
            engineGradient.addColorStop(0, `rgba(255, 255, 0, ${engineGlow})`);
            engineGradient.addColorStop(0.5, `rgba(255, 200, 0, ${engineGlow * 0.5})`);
            engineGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

            ctx.fillStyle = engineGradient;
            ctx.beginPath();
            ctx.arc(ex, ey, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const domeGradient = ctx.createRadialGradient(0, -2, 0, 0, -2, this.width / 4);
        domeGradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
        domeGradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.6)');
        domeGradient.addColorStop(1, 'rgba(0, 100, 200, 0.3)');

        ctx.fillStyle = domeGradient;
        ctx.beginPath();
        ctx.arc(0, -2, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-2, -4, this.width / 8, 0, Math.PI * 2);
        ctx.fill();

        const weaponPositions = [
            { x: 0, y: -this.width / 2.2 },
            { x: this.width / 2.2, y: 0 },
            { x: 0, y: this.width / 2.2 },
            { x: -this.width / 2.2, y: 0 }
        ];

        weaponPositions.forEach(pos => {
            ctx.fillStyle = '#1a4d5c';
            ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);

            ctx.fillStyle = PLAYER_STATS.color;
            ctx.shadowBlur = 4;
            ctx.shadowColor = PLAYER_STATS.color;
            ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
            ctx.shadowBlur = 0;
        });

        if (this.isDashing) {
            const trailLength = 5;
            for (let i = 0; i < trailLength; i++) {
                const alpha = 1 - (i / trailLength);
                ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2 + i * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
