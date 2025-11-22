export class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;

        // Set properties based on type
        if (type === 'shooter') {
            this.width = 30;
            this.height = 30;
            this.speed = 100;
            this.health = 40;
            this.color = '#00CED1'; // Cyan/Turquoise
            this.glowColor = '#00FFFF';
            this.value = 2;
            this.shootTimer = 0;
            this.shootInterval = 1.5; // Shoots every 1.5 seconds
        } else if (type === 'fast') {
            this.width = 25;
            this.height = 25;
            this.speed = 180;
            this.health = 20;
            this.color = '#ff1493';
            this.glowColor = '#ff69b4';
            this.value = 1;
            this.shootTimer = 0;
            this.shootInterval = 2.5; // Shoots every 2.5 seconds (slower)
        } else {
            this.width = 35;
            this.height = 35;
            this.speed = 120;
            this.health = 30;
            this.color = '#ff0000';
            this.glowColor = '#ff4444';
            this.value = 1;
            this.shootTimer = 0;
            this.shootInterval = 2.0; // Shoots every 2 seconds
        }

        this.active = true;
        this.wobble = Math.random() * Math.PI * 2;
        this.radius = this.width / 2; // Add radius for collision detection
    }

    update(dt, player, bullets) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            // Shooter enemies keep distance
            if (this.type === 'shooter' && dist < 200) {
                this.x -= (dx / dist) * this.speed * dt * 0.5; // Move away slowly
                this.y -= (dy / dist) * this.speed * dt * 0.5;
            } else {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        }

        this.wobble += dt * 3;

        // All enemies shoot continuously
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.shootInterval;
            return true; // Signal to spawn bullet
        }

        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        // Blob body with wobble effect
        ctx.fillStyle = gradient;
        ctx.beginPath();

        const segments = 8;
        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            const wobbleOffset = Math.sin(this.wobble + i) * 3;
            const radius = (this.width / 2) + wobbleOffset;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Inner darker blob
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glowing eyes
        const eyeOffset = this.width / 5;
        const eyeSize = this.width / 8;

        // Left eye
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(-eyeOffset, -2, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(eyeOffset, -2, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

export function spawnEnemy(canvasWidth, canvasHeight, player, level = 1) {
    // Spawn from screen edges (top, bottom, left, right)
    let x, y;
    const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    const margin = 50; // Spawn slightly off-screen

    switch (edge) {
        case 0: // Top
            x = Math.random() * canvasWidth;
            y = -margin;
            break;
        case 1: // Right
            x = canvasWidth + margin;
            y = Math.random() * canvasHeight;
            break;
        case 2: // Bottom
            x = Math.random() * canvasWidth;
            y = canvasHeight + margin;
            break;
        case 3: // Left
        default:
            x = -margin;
            y = Math.random() * canvasHeight;
            break;
    }

    // Spawn different enemy types with level-based distribution
    // Higher levels = more fast and shooter enemies
    const rand = Math.random();
    let type;
    const fastThreshold = Math.min(0.3 + (level * 0.05), 0.5);
    const shooterThreshold = Math.min(0.2 + (level * 0.03), 0.35);

    if (rand < (1 - fastThreshold - shooterThreshold)) {
        type = 'normal';
    } else if (rand < (1 - shooterThreshold)) {
        type = 'fast';
    } else {
        type = 'shooter';
    }

    const enemy = new Enemy(x, y, type);

    // Scale stats with level
    const levelMultiplier = 1 + (level * 0.1);
    enemy.speed *= levelMultiplier;
    enemy.health *= (1 + (level * 0.15));
    enemy.shootInterval *= Math.max(0.5, 1 - (level * 0.05)); // Shoot faster at higher levels

    return enemy;
}

