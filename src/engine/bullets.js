export class Bullet {
    constructor(x, y, angle, type = 'player') {
        this.x = x;
        this.y = y;

        // Determine if this is a player bullet (including special weapons)
        const isPlayerBullet = type === 'player' || type === 'pulse' || type === 'missile' || type === 'laser';

        this.speed = isPlayerBullet ? 600 : 300;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = isPlayerBullet ? 4 : 6;
        this.color = isPlayerBullet ? '#ffff00' : '#ff0000'; // Yellow for player, Red for enemy
        this.active = true;
        this.type = type;
        this.damage = 10;

        if (type === 'laser_beam') {
            this.lifespan = 0.2; // Lasts 0.2 seconds
            this.damage = 0; // Damage handled instantly by raycast
        }
    }

    update(dt, canvasWidth, canvasHeight) {
        if (this.type === 'laser_beam') {
            this.lifespan -= dt;
            if (this.lifespan <= 0) {
                this.active = false;
            }
            // Laser beam moves with player? No, let's keep it static where fired for impact
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounds check
        if (this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (this.type === 'laser_beam') {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.lifespan / 0.2); // Fade out
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4 + Math.sin(Date.now() / 50) * 2; // Pulsing width
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            // Draw beam to max distance (screen diagonal approx)
            const maxDist = 2000;
            ctx.lineTo(this.x + Math.cos(this.angle) * maxDist, this.y + Math.sin(this.angle) * maxDist);
            ctx.stroke();

            // Inner white core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            ctx.stroke();

            ctx.restore();
        } else if (this.type === 'laser') {
            // Legacy laser (if any remain, or fallback)
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            const tailLen = 40;
            const tailX = this.x - Math.cos(this.angle) * tailLen;
            const tailY = this.y - Math.sin(this.angle) * tailLen;
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
