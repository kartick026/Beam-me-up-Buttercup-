export class Particle {
    constructor(x, y, color, speed, life, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * speed;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.decay = Math.random() * 0.05 + 0.02;
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.life -= dt;
        this.size = Math.max(0, this.size - this.decay);
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawnExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, 2 + Math.random() * 3, 0.5 + Math.random() * 0.5, 2 + Math.random() * 3));
        }
    }

    spawnTrail(x, y, color, size = 2) {
        this.particles.push(new Particle(x, y, color, 0.5, 0.3, size));
    }

    update(dt) {
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}
