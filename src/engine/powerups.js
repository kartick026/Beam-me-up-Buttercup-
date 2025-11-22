export class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 18;
        this.active = true;
        this.lifeTime = 10.0;
        this.pulse = 0;
    }

    update(dt) {
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) this.active = false;
        this.pulse += dt * 5;
    }

    draw(ctx) {
        const pulseSize = Math.sin(this.pulse) * 3;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Outer Glow
        const colors = {
            rapid: '#00ff00',
            double: '#ffff00',
            shield: '#00ffff',
            shotgun: '#ff6600',
            laser: '#0066ff',
            missile: '#ff0066',
            health: '#ff3366',
            pulse: '#00ffaa'
        };
        const color = colors[this.type] || '#ffffff';

        ctx.shadowBlur = 15;
        ctx.shadowColor = color;

        // Background Bubble
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius + pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Icon Drawing
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;

        switch (this.type) {
            case 'rapid': // Lightning Bolt
                ctx.beginPath();
                ctx.moveTo(2, -8);
                ctx.lineTo(-4, 0);
                ctx.lineTo(0, 0);
                ctx.lineTo(-2, 8);
                ctx.lineTo(4, 0);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
                break;

            case 'double': // Two Bullets
                this.drawBullet(ctx, -5, 0);
                this.drawBullet(ctx, 5, 0);
                break;

            case 'shield': // Shield Emblem
                ctx.beginPath();
                ctx.moveTo(0, 8);
                ctx.quadraticCurveTo(8, 0, 8, -4);
                ctx.lineTo(8, -6);
                ctx.lineTo(0, -8);
                ctx.lineTo(-8, -6);
                ctx.lineTo(-8, -4);
                ctx.quadraticCurveTo(-8, 0, 0, 8);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, -2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'shotgun': // Spread Dots
                ctx.beginPath();
                ctx.arc(0, 4, 3, 0, Math.PI * 2);
                ctx.arc(-6, -2, 3, 0, Math.PI * 2);
                ctx.arc(6, -2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'laser': // Vertical Beam
                ctx.fillRect(-2, -10, 4, 20);
                ctx.beginPath();
                ctx.moveTo(-6, -10);
                ctx.lineTo(6, -10);
                ctx.moveTo(-6, 10);
                ctx.lineTo(6, 10);
                ctx.stroke();
                break;

            case 'missile': // Rocket
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.quadraticCurveTo(5, -5, 5, 2);
                ctx.lineTo(5, 6);
                ctx.lineTo(8, 10);
                ctx.lineTo(3, 8);
                ctx.lineTo(0, 10); // Exhaust
                ctx.lineTo(-3, 8);
                ctx.lineTo(-8, 10);
                ctx.lineTo(-5, 6);
                ctx.lineTo(-5, 2);
                ctx.quadraticCurveTo(-5, -5, 0, -10);
                ctx.fill();
                break;

            case 'health': // Heart
                ctx.beginPath();
                ctx.moveTo(0, 4);
                ctx.bezierCurveTo(0, 3, -5, -2, -5, -5);
                ctx.arc(-2.5, -5, 2.5, Math.PI, 0);
                ctx.arc(2.5, -5, 2.5, Math.PI, 0);
                ctx.bezierCurveTo(5, -2, 0, 3, 0, 4);
                ctx.fill();
                break;

            case 'pulse': // Concentric Rings
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    drawBullet(ctx, offsetX, offsetY) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY - 6);
        ctx.lineTo(offsetX + 2, offsetY - 4);
        ctx.lineTo(offsetX + 2, offsetY + 6);
        ctx.lineTo(offsetX - 2, offsetY + 6);
        ctx.lineTo(offsetX - 2, offsetY - 4);
        ctx.closePath();
        ctx.fill();
    }
}

export function spawnPowerup(x, y) {
    const types = ['rapid', 'double', 'shield', 'shotgun', 'laser', 'missile', 'health', 'pulse'];
    const rand = Math.floor(Math.random() * types.length);
    return new Powerup(x, y, types[rand]);
}
