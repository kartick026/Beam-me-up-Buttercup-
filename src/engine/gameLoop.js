import { Player } from './player';
import { Bullet } from './bullets';
import { spawnEnemy } from './enemies';
import { Powerup, spawnPowerup } from './powerups';
import { ParticleSystem } from './particles';
import { Boss } from './boss';
import { Background } from './background';

export class GameEngine {
    constructor(width, height, onGameOver, onScoreUpdate, onLevelUpdate, onHealthUpdate, playSound) {
        this.width = width;
        this.height = height;
        this.onGameOver = onGameOver;
        this.onScoreUpdate = onScoreUpdate;
        this.onLevelUpdate = onLevelUpdate;
        this.onHealthUpdate = onHealthUpdate;
        this.playSound = playSound;

        this.player = new Player(width, height);
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.particles = new ParticleSystem();
        this.bosses = [];
        this.background = new Background(width, height);

        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.kills = 0;
        this.playTime = 0;

        // Stats tracking
        this.bossesDefeated = 0;
        this.bossTypesDefeated = [];
        this.powerupsCollected = 0;
        this.favoriteWeapon = 'normal';
        this.weaponUsage = {
            normal: 0,
            rapid: 0,
            double: 0,
            shotgun: 0,
            laser: 0,
            missile: 0,
            pulse: 0
        };
        this.rapidFireUsed = 0;
        this.doubleShotUsed = 0;
        this.shieldUsed = 0;
        this.shotgunUsed = 0;
        this.laserUsed = 0;
        this.missileUsed = 0;
        this.pulseUsed = 0;
        this.healthCollected = 0;
        this.dashesUsed = 0;
        this.maxCombo = 0;
        this.perfectLevels = 0;
        this.enemyTypesKilled = [];

        // Level Management
        this.killsThisLevel = 0;
        this.killsRequiredForNextLevel = 15;
        this.levelTransition = false;
        this.levelTransitionTimer = 0;
        this.levelTransitionDuration = 3.0;

        // Spawning
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 2.0;
        this.bossPowerupTimer = 10.0;

        // Screen Shake
        this.shakeTime = 0;
        this.shakeMagnitude = 0;

        // Combo System
        this.combo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2.5;

        // Mouse
        this.mouse = { x: 0, y: 0 };
    }

    update(dt, input) {
        if (this.gameOver) return;

        this.playTime += dt;

        // Screen Shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) this.shakeMagnitude = 0;
        }

        // Level Transition
        if (this.levelTransition) {
            this.levelTransitionTimer -= dt;
            if (this.levelTransitionTimer <= 0) {
                this.levelTransition = false;
            }
            // During transition, update background but not game logic
            this.background.update(dt);
            this.particles.update(dt);
            return;
        }

        // Player
        const isFiring = input.mouseDown || input.keys[' '] || input.touchShoot;
        this.player.update(input, dt, this.width, this.height, isFiring);
        if (input.dashRequest && this.player.canDash) {
            this.player.dash();
            this.dashesUsed++;
        }

        // Mouse Aim
        this.mouse = input.mouse;

        // Twin-stick: Update crosshair position based on aim joystick
        if (input.aimJoystick && input.aimJoystick.active && (input.aimJoystick.x !== 0 || input.aimJoystick.y !== 0)) {
            const crosshairDist = 250;
            this.mouse = {
                x: this.player.x + input.aimJoystick.x * crosshairDist,
                y: this.player.y + input.aimJoystick.y * crosshairDist
            };
        }

        // Firing
        if (isFiring) {
            const now = Date.now() / 1000;
            if (now - this.player.lastShotTime >= this.player.fireRate) {
                this.player.lastShotTime = now;
                this.playSound('shoot');
                this.shotsFired++;
                this.weaponUsage[this.player.weaponType]++;

                let angle;
                // Twin-stick: Use aim joystick if active
                if (input.aimJoystick && input.aimJoystick.active && (input.aimJoystick.x !== 0 || input.aimJoystick.y !== 0)) {
                    angle = Math.atan2(input.aimJoystick.y, input.aimJoystick.x);
                } else if (input.joystick.active) {
                    // Fallback to movement joystick if aim joystick not used
                    if (input.joystick.x !== 0 || input.joystick.y !== 0) {
                        angle = Math.atan2(input.joystick.y, input.joystick.x);
                    } else {
                        angle = -Math.PI / 2;
                    }
                } else if (!input.mouse || (input.mouse.x === 0 && input.mouse.y === 0)) {
                    // Auto-aim if no mouse/joystick
                    if (this.player.vx !== 0 || this.player.vy !== 0) {
                        angle = Math.atan2(this.player.vy, this.player.vx);
                    } else {
                        angle = -Math.PI / 2;
                    }
                    // If there are enemies, aim at closest
                    let closest = null;
                    let minDst = Infinity;
                    this.enemies.forEach(e => {
                        const d = (e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2;
                        if (d < minDst) { minDst = d; closest = e; }
                    });
                    this.bosses.forEach(boss => {
                        const d = (boss.x - this.player.x) ** 2 + (boss.y - this.player.y) ** 2;
                        if (d < minDst) { closest = boss; }
                    });

                    if (closest) {
                        angle = Math.atan2(closest.y - this.player.y, closest.x - this.player.x);
                    }
                } else {
                    // Mouse aim
                    angle = Math.atan2(input.mouse.y - this.player.y, input.mouse.x - this.player.x);
                }




                let fireDefault = true;

                if (this.player.weaponType === 'laser' && this.player.laserEnergy > 0) {
                    fireDefault = false;
                    // Instant Raycast Laser
                    const laserBeam = new Bullet(this.player.x, this.player.y, angle, 'laser_beam');
                    this.bullets.push(laserBeam);

                    // Raycast Logic
                    const maxDist = 2000;
                    const endX = this.player.x + Math.cos(angle) * maxDist;
                    const endY = this.player.y + Math.sin(angle) * maxDist;

                    // Check all enemies
                    this.enemies.forEach(e => {
                        if (!e.active) return;
                        const dist = this.distanceToSegment(e.x, e.y, this.player.x, this.player.y, endX, endY);
                        if (dist < e.radius + 10) {
                            const damage = 25; // Much higher damage
                            e.health -= damage;
                            this.damageDealt += damage;
                            this.shotsHit++;
                            this.playSound('hit');

                            // Create hit particles
                            for (let i = 0; i < 8; i++) {
                                this.particles.particles.push({
                                    x: e.x,
                                    y: e.y,
                                    vx: (Math.random() - 0.5) * 200,
                                    vy: (Math.random() - 0.5) * 200,
                                    life: 0.3,
                                    maxLife: 0.3,
                                    color: '#00ffff',
                                    size: 3,
                                    decay: 0.05,
                                    angle: 0,
                                    speed: 0,
                                    update: function (dt) {
                                        this.x += this.vx * dt;
                                        this.y += this.vy * dt;
                                        this.life -= dt;
                                        this.size = Math.max(0, this.size - this.decay);
                                    },
                                    draw: function (ctx) {
                                        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
                                        ctx.fillStyle = this.color;
                                        ctx.beginPath();
                                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                                        ctx.fill();
                                        ctx.globalAlpha = 1.0;
                                    }
                                });
                            }
                        }
                    });

                    // Check all bosses
                    this.bosses.forEach(boss => {
                        if (!boss.active) return;
                        const dist = this.distanceToSegment(boss.x, boss.y, this.player.x, this.player.y, endX, endY);
                        if (dist < boss.radius + 10) {
                            const damage = 25;
                            boss.health -= damage;
                            this.damageDealt += damage;
                            this.shotsHit++;
                            this.playSound('hit');

                            // Create hit particles
                            for (let i = 0; i < 12; i++) {
                                this.particles.particles.push({
                                    x: boss.x + (Math.random() - 0.5) * boss.width,
                                    y: boss.y + (Math.random() - 0.5) * boss.height,
                                    vx: (Math.random() - 0.5) * 250,
                                    vy: (Math.random() - 0.5) * 250,
                                    life: 0.4,
                                    maxLife: 0.4,
                                    color: '#00ffff',
                                    size: 4,
                                    decay: 0.05,
                                    angle: 0,
                                    speed: 0,
                                    update: function (dt) {
                                        this.x += this.vx * dt;
                                        this.y += this.vy * dt;
                                        this.life -= dt;
                                        this.size = Math.max(0, this.size - this.decay);
                                    },
                                    draw: function (ctx) {
                                        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
                                        ctx.fillStyle = this.color;
                                        ctx.beginPath();
                                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                                        ctx.fill();
                                        ctx.globalAlpha = 1.0;
                                    }
                                });
                            }
                        }
                    });
                } else if (this.player.weaponType === 'missile' && this.player.missileCount > 0) {
                    fireDefault = false;
                    // Homing missile
                    const missile = new Bullet(this.player.x, this.player.y, angle, 'missile');
                    missile.speed = 250;
                    missile.vx = Math.cos(angle) * missile.speed;
                    missile.vy = Math.sin(angle) * missile.speed;
                    missile.damage = 50;
                    missile.color = '#ff0066';
                    missile.homing = true;
                    this.bullets.push(missile);
                    this.player.missileCount--;
                } else if (this.player.weaponType === 'pulse') {
                    fireDefault = false;
                    // Pulse wave: circular AOE
                    for (let i = 0; i < 12; i++) {
                        const pulseAngle = (Math.PI * 2 / 12) * i;
                        const pulseBullet = new Bullet(this.player.x, this.player.y, pulseAngle, 'pulse');
                        pulseBullet.speed = 300;
                        pulseBullet.vx = Math.cos(pulseAngle) * pulseBullet.speed;
                        pulseBullet.vy = Math.sin(pulseAngle) * pulseBullet.speed;
                        pulseBullet.damage = 15;
                        pulseBullet.color = '#00ffaa';
                        this.bullets.push(pulseBullet);
                    }
                }

                if (fireDefault) {
                    this.bullets.push(new Bullet(this.player.x, this.player.y, angle, 'player'));

                    // Weapon-specific firing patterns
                    if (this.player.weaponType === 'double') {
                        this.bullets.push(new Bullet(this.player.x + Math.cos(angle + 1.57) * 10, this.player.y + Math.sin(angle + 1.57) * 10, angle, 'player'));
                        this.bullets.push(new Bullet(this.player.x - Math.cos(angle + 1.57) * 10, this.player.y - Math.sin(angle + 1.57) * 10, angle, 'player'));
                    } else if (this.player.weaponType === 'shotgun') {
                        // Spread shot: 5 bullets in a cone
                        const spreadAngles = [-0.3, -0.15, 0.15, 0.3];
                        spreadAngles.forEach(offset => {
                            this.bullets.push(new Bullet(this.player.x, this.player.y, angle + offset, 'player'));
                        });
                    }
                }
            }
        }

        // Bullets
        this.bullets.forEach(b => {
            // Homing missile logic
            if (b.homing && b.type === 'missile') {
                let closest = null;
                let minDist = Infinity;

                this.enemies.forEach(e => {
                    const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = e;
                    }
                });

                this.bosses.forEach(boss => {
                    const dist = Math.sqrt((boss.x - b.x) ** 2 + (boss.y - b.y) ** 2);
                    if (dist < minDist) {
                        closest = boss;
                    }
                });

                if (closest) {
                    const targetAngle = Math.atan2(closest.y - b.y, closest.x - b.x);
                    b.angle = targetAngle;
                    b.vx = Math.cos(targetAngle) * b.speed;
                    b.vy = Math.sin(targetAngle) * b.speed;
                }
            }

            b.update(dt, this.width, this.height);
        });
        this.bullets = this.bullets.filter(b => b.active);

        // Enemies
        this.enemySpawnTimer -= dt;
        if (this.enemySpawnTimer <= 0 && this.bosses.length === 0 && this.killsThisLevel < this.killsRequiredForNextLevel) {
            // Spawn more enemies at higher levels
            const enemiesToSpawn = Math.min(1 + Math.floor(this.level / 3), 3);
            for (let i = 0; i < enemiesToSpawn; i++) {
                this.enemies.push(spawnEnemy(this.width, this.height, this.player, this.level));
            }
            this.enemySpawnTimer = Math.max(0.3, 1.5 - (this.level * 0.08));
        }

        this.enemies.forEach(e => {
            const shouldShoot = e.update(dt, this.player, this.bullets);
            // All enemies now shoot continuously
            if (shouldShoot) {
                const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                const enemyBullet = new Bullet(e.x, e.y, angle, 'enemy');
                enemyBullet.damage = 5; // Normal enemy damage
                this.bullets.push(enemyBullet);
                this.playSound('shoot');
            }

            // Check if enemy is dead
            if (e.health <= 0) {
                e.active = false;
                this.kills++;
                this.killsThisLevel++;
                this.score += e.value || 1;
                this.onScoreUpdate(this.score);
                this.playSound('enemyDeath');
                this.particles.spawnExplosion(e.x, e.y, e.color, 10);

                // Combo system
                this.combo++;
                this.comboTimer = this.comboTimeout;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                // Track enemy types
                if (!this.enemyTypesKilled.includes(e.type)) {
                    this.enemyTypesKilled.push(e.type);
                }
            }
        });

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.active);

        // Combo timer
        if (this.combo > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0; // Reset combo
            }
        }

        // Boss Spawn Logic
        if (this.bosses.length === 0 && this.killsThisLevel >= this.killsRequiredForNextLevel && !this.levelTransition) {
            const numBosses = this.level >= 3 ? 2 : 1;

            for (let i = 0; i < numBosses; i++) {
                const boss = new Boss(this.width, this.height, this.level);
                // Spread bosses out if multiple
                if (numBosses > 1) {
                    boss.x = (this.width / (numBosses + 1)) * (i + 1);
                }
                this.bosses.push(boss);
            }

            this.playSound('bossSpawn');
            this.enemies = []; // Clear remaining enemies
        }

        // Update Bosses
        this.bosses.forEach((boss) => {
            const shot = boss.update(dt, this.player, this.bullets, this.width);
            if (shot) this.playSound('shoot');

            if (boss.health <= 0) {
                // Stats: Boss Defeated
                this.bossesDefeated++;
                if (!this.bossTypesDefeated.includes(boss.type)) {
                    this.bossTypesDefeated.push(boss.type);
                }

                boss.active = false; // Mark for removal
                this.score += 50; // Boss bonus
                this.onScoreUpdate(this.score);
                this.playSound('bossDeath');

                // Spawn explosion
                this.particles.spawnExplosion(boss.x, boss.y, boss.color, 15);
            }
        });

        // Boss Fight Aid: Spawn powerups periodically
        if (this.bosses.length > 0) {
            this.bossPowerupTimer -= dt;
            if (this.bossPowerupTimer <= 0) {
                this.bossPowerupTimer = 12.0; // Spawn every 12 seconds

                // Spawn at random location
                const px = Math.random() * (this.width - 100) + 50;
                const py = Math.random() * (this.height - 100) + 50;

                // High chance of health if player is low
                if (this.player.health < 50 && Math.random() < 0.6) {
                    this.powerups.push(new Powerup(px, py, 'health'));
                } else {
                    this.powerups.push(spawnPowerup(px, py));
                }

                // Visual cue
                this.particles.spawnExplosion(px, py, '#ffffff', 10);
            }
        }

        // Remove dead bosses
        const prevBossCount = this.bosses.length;
        this.bosses = this.bosses.filter(b => b.active !== false);

        // Level Transition if all bosses defeated (and we had bosses)
        if (prevBossCount > 0 && this.bosses.length === 0) {
            // Trigger level transition
            this.level++;
            this.onLevelUpdate(this.level);
            this.levelTransition = true;
            this.levelTransitionTimer = this.levelTransitionDuration;
            this.killsThisLevel = 0;
            this.killsRequiredForNextLevel = 10 + (this.level * 5); // Increase requirement each level

            // Scale difficulty
            this.enemySpawnRate = Math.max(0.5, 2.0 - (this.level * 0.15));

            // Restore HP on level up
            const hpRestore = 40 + (this.level * 10);
            this.player.health = Math.min(100, this.player.health + hpRestore);
            this.onHealthUpdate(this.player.health);
        }
        // Powerups
        this.powerups.forEach(p => p.update(dt));
        this.powerups = this.powerups.filter(p => p.active);

        // Particles
        this.particles.update(dt);

        // Background
        this.background.update(dt);
        this.background.setTheme(this.level);

        // Collisions
        this.checkCollisions(dt);
    }

    checkCollisions(dt) {
        // Bullets vs Enemies
        this.bullets.forEach(b => {
            if (!b.active || b.type === 'laser_beam') return; // Skip inactive or visual-only beams

            if (b.type !== 'enemy') {
                // Vs Enemies
                this.enemies.forEach(e => {
                    if (!e.active) return;
                    const dx = b.x - e.x;
                    const dy = b.y - e.y;
                    if (dx * dx + dy * dy < (e.width / 2 + b.radius) * (e.width / 2 + b.radius)) {
                        b.active = false;
                        this.particles.spawnExplosion(b.x, b.y, '#ffff00', 3);
                        e.health -= b.damage;

                        // Stats: Hit & Damage
                        this.shotsHit++;
                        this.damageDealt += b.damage;

                        if (e.health <= 0) {
                            e.active = false;
                            this.particles.spawnExplosion(e.x, e.y, e.color, 15);
                            this.shakeTime = 0.2;
                            this.shakeMagnitude = 5;
                            this.playSound('enemyDeath');

                            // Stats: Kills
                            this.kills++;
                            if (!this.enemyTypesKilled.includes(e.type)) {
                                this.enemyTypesKilled.push(e.type);
                            }

                            // Combo system
                            this.combo++;
                            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                            this.comboTimer = this.comboTimeout;
                            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                            // Apply combo multiplier to score
                            const multiplier = Math.min(Math.floor(this.combo / 5) + 1, 10); // Max 10x
                            this.score += e.value * multiplier;
                            this.onScoreUpdate(this.score);
                            this.playSound('hit');

                            // Track kills for level progression
                            this.killsThisLevel++;

                            // Drop powerup
                            if (Math.random() < 0.28) {
                                this.powerups.push(spawnPowerup(e.x, e.y));
                            }
                        }
                    }
                });

                // Vs Bosses
                this.bosses.forEach(boss => {
                    if (boss.state !== 'entering') {
                        const dx = b.x - boss.x;
                        const dy = b.y - boss.y;
                        if (Math.abs(dx) < boss.width / 2 && Math.abs(dy) < boss.height / 2) {
                            b.active = false;
                            this.particles.spawnExplosion(b.x, b.y, '#ffff00', 3);
                            boss.health -= b.damage;
                            this.playSound('hit');
                        }
                    }
                });
                this.score += e.value || 1;
                this.onScoreUpdate(this.score);
                this.playSound('enemyDeath');
                this.particles.spawnExplosion(e.x, e.y, e.color, 10);

                // Combo system
                this.combo++;
                this.comboTimer = this.comboTimeout;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                // Track enemy types
                if (!this.enemyTypesKilled.includes(e.type)) {
                    this.enemyTypesKilled.push(e.type);
                }
            }
        });

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.active);

        // Combo timer
        if (this.combo > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0; // Reset combo
            }
        }

        // Boss Spawn Logic
        if (this.bosses.length === 0 && this.killsThisLevel >= this.killsRequiredForNextLevel && !this.levelTransition) {
            const numBosses = this.level >= 3 ? 2 : 1;

            for (let i = 0; i < numBosses; i++) {
                const boss = new Boss(this.width, this.height, this.level);
                // Spread bosses out if multiple
                if (numBosses > 1) {
                    boss.x = (this.width / (numBosses + 1)) * (i + 1);
                }
                this.bosses.push(boss);
            }

            this.playSound('bossSpawn');
            this.enemies = []; // Clear remaining enemies
        }

        // Update Bosses
        this.bosses.forEach((boss) => {
            const shot = boss.update(dt, this.player, this.bullets, this.width);
            if (shot) this.playSound('shoot');

            if (boss.health <= 0) {
                // Stats: Boss Defeated
                this.bossesDefeated++;
                if (!this.bossTypesDefeated.includes(boss.type)) {
                    this.bossTypesDefeated.push(boss.type);
                }

                boss.active = false; // Mark for removal
                this.score += 50; // Boss bonus
                this.onScoreUpdate(this.score);
                this.playSound('bossDeath');

                // Spawn explosion
                this.particles.spawnExplosion(boss.x, boss.y, boss.color, 15);
            }
        });

        // Boss Fight Aid: Spawn powerups periodically
        if (this.bosses.length > 0) {
            this.bossPowerupTimer -= dt;
            if (this.bossPowerupTimer <= 0) {
                this.bossPowerupTimer = 12.0; // Spawn every 12 seconds

                // Spawn at random location
                const px = Math.random() * (this.width - 100) + 50;
                const py = Math.random() * (this.height - 100) + 50;

                // High chance of health if player is low
                if (this.player.health < 50 && Math.random() < 0.6) {
                    this.powerups.push(new Powerup(px, py, 'health'));
                } else {
                    this.powerups.push(spawnPowerup(px, py));
                }

                // Visual cue
                this.particles.spawnExplosion(px, py, '#ffffff', 10);
            }
        }

        // Remove dead bosses
        const prevBossCount = this.bosses.length;
        this.bosses = this.bosses.filter(b => b.active !== false);

        // Level Transition if all bosses defeated (and we had bosses)
        if (prevBossCount > 0 && this.bosses.length === 0) {
            // Trigger level transition
            this.level++;
            this.onLevelUpdate(this.level);
            this.levelTransition = true;
            this.levelTransitionTimer = this.levelTransitionDuration;
            this.killsThisLevel = 0;
            this.killsRequiredForNextLevel = 10 + (this.level * 5); // Increase requirement each level

            // Scale difficulty
            this.enemySpawnRate = Math.max(0.5, 2.0 - (this.level * 0.15));

            // Restore HP on level up
            const hpRestore = 40 + (this.level * 10);
            this.player.health = Math.min(100, this.player.health + hpRestore);
            this.onHealthUpdate(this.player.health);
        }
        // Powerups
        this.powerups.forEach(p => p.update(dt));
        this.powerups = this.powerups.filter(p => p.active);

        // Particles
        this.particles.update(dt);

        // Background
        this.background.update(dt);
        this.background.setTheme(this.level);

        // Collisions
        this.checkCollisions(dt);
    }

    checkCollisions(dt) {
        // Bullets vs Enemies
        this.bullets.forEach(b => {
            if (!b.active || b.type === 'laser_beam') return; // Skip inactive or visual-only beams

            if (b.type !== 'enemy') {
                // Vs Enemies
                this.enemies.forEach(e => {
                    if (!e.active) return;
                    const dx = b.x - e.x;
                    const dy = b.y - e.y;
                    if (dx * dx + dy * dy < (e.width / 2 + b.radius) * (e.width / 2 + b.radius)) {
                        b.active = false;
                        this.particles.spawnExplosion(b.x, b.y, '#ffff00', 3);
                        e.health -= b.damage;

                        // Stats: Hit & Damage
                        this.shotsHit++;
                        this.damageDealt += b.damage;

                        if (e.health <= 0) {
                            e.active = false;
                            this.particles.spawnExplosion(e.x, e.y, e.color, 15);
                            this.shakeTime = 0.2;
                            this.shakeMagnitude = 5;
                            this.playSound('enemyDeath');

                            // Stats: Kills
                            this.kills++;
                            if (!this.enemyTypesKilled.includes(e.type)) {
                                this.enemyTypesKilled.push(e.type);
                            }

                            // Combo system
                            this.combo++;
                            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                            this.comboTimer = this.comboTimeout;
                            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                            // Apply combo multiplier to score
                            const multiplier = Math.min(Math.floor(this.combo / 5) + 1, 10); // Max 10x
                            this.score += e.value * multiplier;
                            this.onScoreUpdate(this.score);
                            this.playSound('hit');

                            // Track kills for level progression
                            this.killsThisLevel++;

                            // Drop powerup
                            if (Math.random() < 0.28) {
                                this.powerups.push(spawnPowerup(e.x, e.y));
                            }
                        }
                    }
                });

                // Vs Bosses
                this.bosses.forEach(boss => {
                    if (boss.state !== 'entering') {
                        const dx = b.x - boss.x;
                        const dy = b.y - boss.y;
                        if (Math.abs(dx) < boss.width / 2 && Math.abs(dy) < boss.height / 2) {
                            b.active = false;
                            this.particles.spawnExplosion(b.x, b.y, '#ffff00', 3);
                            boss.health -= b.damage;
                            this.playSound('hit');
                        }
                    }
                });
            } else {
                // Enemy Bullet Vs Player
                const dx = b.x - this.player.x;
                const dy = b.y - this.player.y;
                if (dx * dx + dy * dy < (this.player.width / 2 + b.radius) * (this.player.width / 2 + b.radius)) {
                    b.active = false;
                    this.particles.spawnExplosion(this.player.x, this.player.y, '#ff0000', 5);
                    this.shakeTime = 0.3;
                    this.shakeMagnitude = 10;
                    if (!this.player.shieldActive) {
                        this.player.health -= (b.damage || 5);
                        this.onHealthUpdate(this.player.health);
                        this.combo = 0; // Reset combo on hit
                        if (this.player.health <= 0) {
                            this.gameOver = true;
                            this.onGameOver();
                        }
                    }
                }
            }
        });

        this.enemies = this.enemies.filter(e => e.active);

        // Player vs Enemies (Crash)
        this.enemies.forEach(e => {
            const dx = e.x - this.player.x;
            const dy = e.y - this.player.y;
            if (dx * dx + dy * dy < (e.width / 2 + this.player.width / 2) * (e.width / 2 + this.player.width / 2)) {
                e.active = false;
                this.particles.spawnExplosion(e.x, e.y, e.color, 10);
                this.shakeTime = 0.4;
                this.shakeMagnitude = 15;
                if (!this.player.shieldActive) {
                    this.player.health -= 5; // Reduced from 20
                    this.onHealthUpdate(this.player.health);
                    this.combo = 0; // Reset combo on crash
                    if (this.player.health <= 0) {
                        this.gameOver = true;
                        this.onGameOver();
                    }
                }
            }
        });

        // Player vs Bosses (Solid Collision)
        this.bosses.forEach(boss => {
            if (boss.state !== 'entering') {
                const dx = this.player.x - boss.x;
                const dy = this.player.y - boss.y;
                const minDistX = boss.width / 2 + this.player.width / 2;
                const minDistY = boss.height / 2 + this.player.height / 2;

                if (Math.abs(dx) < minDistX && Math.abs(dy) < minDistY) {
                    // Resolve overlap (Solid collision)
                    const overlapX = minDistX - Math.abs(dx);
                    const overlapY = minDistY - Math.abs(dy);

                    if (overlapX < overlapY) {
                        this.player.x += dx > 0 ? overlapX : -overlapX;
                    } else {
                        this.player.y += dy > 0 ? overlapY : -overlapY;
                    }

                    // Damage Player
                    this.player.health -= 50 * dt; // Increased from 30*dt
                    this.onHealthUpdate(this.player.health);
                    this.shakeTime = 0.2;
                    this.shakeMagnitude = 5;

                    if (this.player.health <= 0) {
                        this.gameOver = true;
                        this.onGameOver();
                    }
                }
            }
        });


        // Player vs Powerups
        this.powerups.forEach(p => {
            const dx = p.x - this.player.x;
            const dy = p.y - this.player.y;
            if (dx * dx + dy * dy < (p.radius + this.player.width / 2) * (p.radius + this.player.width / 2)) {
                p.active = false;
                this.playSound('powerup');
                this.powerupsCollected++;

                if (p.type === 'rapid') {
                    this.player.rapidFireActive = true;
                    this.player.rapidFireTime = 5.0;
                    this.player.fireRate = 0.05;
                    this.rapidFireUsed++;
                } else if (p.type === 'double') {
                    this.player.weaponType = 'double';
                    this.player.weaponTime = 8.0;
                    this.doubleShotUsed++;
                } else if (p.type === 'shield') {
                    this.player.shieldActive = true;
                    this.player.shieldTime = 5.0;
                    this.shieldUsed++;
                } else if (p.type === 'shotgun') {
                    this.player.weaponType = 'shotgun';
                    this.player.weaponTime = 10.0;
                    this.shotgunUsed++;
                } else if (p.type === 'laser') {
                    this.player.weaponType = 'laser';
                    this.player.weaponTime = 12.0;
                    this.player.laserEnergy = this.player.maxLaserEnergy;
                    this.laserUsed++;
                } else if (p.type === 'missile') {
                    this.player.weaponType = 'missile';
                    this.player.weaponTime = 12.0;
                    this.player.missileCount = this.player.maxMissiles;
                    this.missileUsed++;
                } else if (p.type === 'pulse') {
                    this.player.weaponType = 'pulse';
                    this.player.weaponTime = 10.0;
                    this.pulseUsed++;
                } else if (p.type === 'health') {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
                    this.onHealthUpdate(this.player.health);
                    this.healthCollected++;
                }
            }
        });
    }

    draw(ctx) {
        try {
            ctx.clearRect(0, 0, this.width, this.height);

            ctx.save();
            if (this.shakeTime > 0) {
                const dx = (Math.random() - 0.5) * this.shakeMagnitude;
                const dy = (Math.random() - 0.5) * this.shakeMagnitude;
                ctx.translate(dx, dy);
            }

            // Draw dynamic background
            if (this.background) this.background.draw(ctx);

            // Add Glow
            ctx.shadowBlur = 15;

            this.powerups.forEach(p => { ctx.shadowColor = p.type === 'rapid' ? '#00ff00' : '#ffff00'; p.draw(ctx); });
            this.particles.draw(ctx);
            this.enemies.forEach(e => { ctx.shadowColor = e.color; e.draw(ctx); });
            this.bosses.forEach(boss => { ctx.shadowColor = boss.color; boss.draw(ctx); });
            this.bullets.forEach(b => { ctx.shadowColor = b.color; b.draw(ctx); });

            ctx.shadowColor = this.player.color;
            this.player.draw(ctx);

            // Draw Crosshair
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.mouse.x, this.mouse.y, 10, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(this.mouse.x, this.mouse.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Cross lines
            ctx.beginPath();
            ctx.moveTo(this.mouse.x - 15, this.mouse.y);
            ctx.lineTo(this.mouse.x - 5, this.mouse.y);
            ctx.moveTo(this.mouse.x + 5, this.mouse.y);
            ctx.lineTo(this.mouse.x + 15, this.mouse.y);
            ctx.moveTo(this.mouse.x, this.mouse.y - 15);
            ctx.lineTo(this.mouse.x, this.mouse.y - 5);
            ctx.moveTo(this.mouse.x, this.mouse.y + 5);
            ctx.lineTo(this.mouse.x, this.mouse.y + 15);
            ctx.stroke();

            ctx.restore();

            // Level Transition Overlay
            if (this.levelTransition) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, this.width, this.height);

                ctx.font = 'bold 80px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Pulsing effect
                const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
                ctx.fillStyle = `rgba(0, 240, 255, ${pulse})`;
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#00f0ff';
                ctx.fillText(`LEVEL ${this.level}`, this.width / 2, this.height / 2 - 50);

                ctx.font = 'bold 30px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.fillText('GET READY!', this.width / 2, this.height / 2 + 30);

                // Progress bar
                const barWidth = 300;
                const barHeight = 20;
                const barX = this.width / 2 - barWidth / 2;
                const barY = this.height / 2 + 80;

                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                const progress = 1 - (this.levelTransitionTimer / this.levelTransitionDuration);
                ctx.fillStyle = '#00f0ff';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00f0ff';
                ctx.fillRect(barX, barY, barWidth * progress, barHeight);

                ctx.shadowBlur = 0;
            }
        } catch (e) {
            console.error("GameEngine Draw Error:", e);
        }
    }

    distanceToSegment(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }
}
