import { Bullet } from './bullets.js';

export class Boss {
    constructor(canvasWidth, canvasHeight, level) {
        // Determine boss type based on level
        this.level = level;
        this.type = this.getBossType(level);

        // Random spawn edge: 0=top, 1=right, 2=bottom, 3=left
        const edge = Math.floor(Math.random() * 4);
        const margin = 100;

        switch (edge) {
            case 0: // Top
                this.x = canvasWidth / 2;
                this.y = -margin;
                this.targetX = canvasWidth / 2;
                this.targetY = 100;
                break;
            case 1: // Right
                this.x = canvasWidth + margin;
                this.y = canvasHeight / 2;
                this.targetX = canvasWidth - 150;
                this.targetY = canvasHeight / 2;
                break;
            case 2: // Bottom
                this.x = canvasWidth / 2;
                this.y = canvasHeight + margin;
                this.targetX = canvasWidth / 2;
                this.targetY = canvasHeight - 150;
                break;
            case 3: // Left
            default:
                this.x = -margin;
                this.y = canvasHeight / 2;
                this.targetX = 150;
                this.targetY = canvasHeight / 2;
                break;
        }

        // Set stats based on boss type
        this.initializeBossStats();

        this.active = true;
        this.state = 'entering';
        this.attackTimer = 0;
        this.moveDir = 1;
        this.teleportTimer = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    getBossType(level) {
        // Randomly select boss type
        const bossTypes = ['teleporter', 'tank', 'shooter'];
        const randomIndex = Math.floor(Math.random() * bossTypes.length);
        return bossTypes[randomIndex];
    }

    initializeBossStats() {
        // Base stats scale with level - TUNED
        // Health increases by 50% per level (was 60%)
        const baseHealth = 300 * Math.pow(1.5, this.level - 1); // Base 300 (was 500)

        // Attack speed increases by 8% per level (capped at 60% reduction)
        const speedMultiplier = Math.max(0.4, 1 - (this.level * 0.08));

        switch (this.type) {
            case 'teleporter':
                this.width = 70;
                this.height = 70;
                this.health = baseHealth * 1.2; // +20% HP
                this.maxHealth = this.health;
                this.speed = 100 + (this.level * 8); // Faster movement
                this.color = '#9400D3'; // Purple
                this.attackInterval = 1.0 * speedMultiplier; // Faster attacks (was 1.5)
                this.teleportInterval = Math.max(0.8, 3.0 - (this.level * 0.25)); // Teleports much faster
                this.name = `TELEPORTER MK-${this.level}`;
                this.radius = this.width / 2;
                break;

            case 'tank':
                this.width = 100;
                this.height = 100;
                this.health = baseHealth * 2.5; // Massive HP pool (was 1.8)
                this.maxHealth = this.health;
                this.speed = 40 + (this.level * 3);
                this.color = '#8B4513'; // Brown/Rock
                this.attackInterval = 1.8 * speedMultiplier; // Faster attacks (was 2.5)
                this.name = `TANK MK-${this.level}`;
                this.radius = this.width / 2;
                break;

            case 'shooter':
                this.width = 80;
                this.height = 80;
                this.health = baseHealth * 1.5; // More HP (was 1.2)
                this.maxHealth = this.health;
                this.speed = 70 + (this.level * 5); // Very fast
                this.color = '#FFD700'; // Gold
                this.attackInterval = 0.6 * speedMultiplier; // Insane fire rate (was 1.0)
                this.name = `SHOOTER MK-${this.level}`;
                this.radius = this.width / 2;
                break;
        }
    }

    update(dt, player, bullets, canvasWidth) {
        if (this.state === 'entering') {
            // Move toward target position
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.state = 'idle';
            }
        } else {
            // Type-specific movement
            if (this.type === 'teleporter') {
                this.teleportTimer -= dt;
                if (this.teleportTimer <= 0) {
                    this.teleport();
                    this.teleportTimer = this.teleportInterval;
                }
                // Slight hovering movement
                this.y += Math.sin(Date.now() / 500) * 0.5;
            } else if (this.type === 'tank') {
                // Slow horizontal movement
                this.x += this.speed * this.moveDir * dt;
                if (this.x > canvasWidth - 120 || this.x < 120) {
                    this.moveDir *= -1;
                }
            } else if (this.type === 'shooter') {
                // Circle around player
                const angle = Date.now() / 1000;
                const radius = 200;
                this.x = player.x + Math.cos(angle) * radius;
                this.y = player.y + Math.sin(angle) * radius;

                // Keep in bounds
                this.x = Math.max(100, Math.min(canvasWidth - 100, this.x));
                this.y = Math.max(100, Math.min(this.canvasHeight - 100, this.y));
            }

            // Attack logic
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.attackTimer = this.attackInterval;
                this.attack(bullets, player);
                return true;
            }
        }
        return false;
    }

    teleport() {
        // Teleport to random position
        this.x = 150 + Math.random() * (this.canvasWidth - 300);
        this.y = 100 + Math.random() * (this.canvasHeight - 200);
    }

    attack(bullets, player) {
        switch (this.type) {
            case 'teleporter':
                // Spiral pattern - BUFFED
                this.shootSpiral(bullets, 16); // Was 8
                break;
            case 'tank':
                // Shotgun blast towards player - BUFFED
                this.shootShotgun(bullets, player);
                break;
            case 'shooter':
                // Rapid fire at player - BUFFED
                this.shootAtPlayer(bullets, player);
                break;
        }
    }

    shootSpiral(bullets, count) {
        const offset = Date.now() / 100;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + offset;
            const b = new Bullet(this.x, this.y, angle, 'enemy');
            b.damage = 20; // Boss damage
            bullets.push(b);
        }
    }

    shootShotgun(bullets, player) {
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const spread = 0.3; // Slightly tighter spread for more bullets
        // 9 bullets spread (was 5)
        for (let i = -4; i <= 4; i++) {
            const angle = baseAngle + (i * spread * 0.5);
            const b = new Bullet(this.x, this.y, angle, 'enemy');
            b.damage = 20; // Boss damage
            bullets.push(b);
        }
    }

    shootAtPlayer(bullets, player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const offsets = [0, 0.1, -0.1, 0.2, -0.2];
        offsets.forEach(offset => {
            const b = new Bullet(this.x, this.y, angle + offset, 'enemy');
            b.damage = 20; // Boss damage
            bullets.push(b);
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Type-specific visuals
        if (this.type === 'teleporter') {
            this.drawTeleporter(ctx);
        } else if (this.type === 'tank') {
            this.drawTank(ctx);
        } else if (this.type === 'shooter') {
            this.drawShooter(ctx);
        }

        // Health bar (common for all)
        this.drawHealthBar(ctx);

        ctx.restore();
    }

    drawTeleporter(ctx) {
        // Purple cosmic blob with orbiting particles
        const pulseSize = Math.sin(Date.now() / 100) * 5;

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width + pulseSize);
        gradient.addColorStop(0, '#9400D3');
        gradient.addColorStop(0.5, '#4B0082');
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width + pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = '#2a0a4a';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eye
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Orbiting particles
        for (let i = 0; i < 4; i++) {
            const angle = (Date.now() / 500 + i * Math.PI / 2);
            const radius = this.width / 1.5;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;

            ctx.fillStyle = '#9400D3';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#9400D3';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    drawTank(ctx) {
        // Rocky armored tank
        const pulseSize = Math.sin(Date.now() / 200) * 3;

        // Lava glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width + pulseSize);
        gradient.addColorStop(0, '#FF4500');
        gradient.addColorStop(0.7, '#FF8C00');
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width + pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Rock body
        ctx.fillStyle = '#4a4a4a';
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF6600';

        // Hexagonal shape
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * this.width / 2;
            const y = Math.sin(angle) * this.height / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Glowing cracks
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FF4500';
        ctx.beginPath();
        ctx.moveTo(-20, -10);
        ctx.lineTo(20, 10);
        ctx.moveTo(-15, 15);
        ctx.lineTo(15, -15);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF0000';
        ctx.beginPath();
        ctx.arc(-15, -5, 6, 0, Math.PI * 2);
        ctx.arc(15, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawShooter(ctx) {
        // Golden slime with cannons
        const pulseSize = Math.sin(Date.now() / 150) * 4;

        // Golden aura
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width + pulseSize);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.6, '#FFA500');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width + pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Slime body
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 5, this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Cannons
        const cannonPositions = [
            { x: -25, y: 0 },
            { x: 25, y: 0 }
        ];

        cannonPositions.forEach(pos => {
            ctx.fillStyle = '#FF6600';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#FF6600';
            ctx.fillRect(pos.x - 5, pos.y - 3, 15, 6);

            // Cannon glow
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(pos.x + 10, pos.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Angry eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(-15, -8);
        ctx.lineTo(-8, -5);
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, -5);
        ctx.lineTo(15, -8);
        ctx.lineTo(8, -2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawHealthBar(ctx) {
        const hpPercent = Math.max(0, this.health / this.maxHealth);
        const barWidth = this.width;
        const barHeight = 8;
        const barY = -this.height / 2 - 25;

        // Background
        ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        // Health
        const healthGradient = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
        healthGradient.addColorStop(0, '#ff0000');
        healthGradient.addColorStop(0.5, '#ff4500');
        healthGradient.addColorStop(1, '#ff6600');
        ctx.fillStyle = healthGradient;
        ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

        // Boss name
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fillText(this.name, 0, barY - 8);
        ctx.shadowBlur = 0;
    }
}
