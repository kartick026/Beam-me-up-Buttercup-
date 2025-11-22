import React, { useEffect, useRef } from 'react';

export default function StarfieldBackground({ children }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const stars = [];
        const numStars = 400;
        const speed = 5;
        const ships = [];
        let spawnTimer = 0;

        // Initialize stars
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width - width / 2,
                y: Math.random() * height - height / 2,
                z: Math.random() * width
            });
        }

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const render = () => {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            stars.forEach(star => {
                // Move star closer
                star.z -= speed;

                // Reset if behind camera
                if (star.z <= 0) {
                    star.z = width;
                    star.x = Math.random() * width - width / 2;
                    star.y = Math.random() * height - height / 2;
                }

                // Project 3D to 2D
                const scale = 500 / star.z;
                const x = cx + star.x * scale;
                const y = cy + star.y * scale;
                const size = Math.max(0.1, scale * 1.5);

                // Draw star
                // Color fades based on distance
                const alpha = Math.min(1, (width - star.z) / width);

                // Cool cyan/purple tint
                const r = 100 + Math.random() * 155;
                const g = 100 + Math.random() * 155;
                const b = 255;

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                // Trail effect for warp speed feel
                if (scale > 2) {
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`;
                    ctx.lineWidth = size;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + (x - cx) * 0.05, y + (y - cy) * 0.05);
                    ctx.stroke();
                }
            });

            // --- SHIPS LOGIC ---
            spawnTimer -= 1;
            if (spawnTimer <= 0) {
                spawnTimer = Math.random() * 100 + 50; // Random spawn interval
                if (ships.length < 10) {
                    const isEnemy = Math.random() > 0.4;
                    ships.push({
                        x: (Math.random() - 0.5) * width * 2, // Spread wide
                        y: (Math.random() - 0.5) * height * 2,
                        z: width * 1.5, // Start far away
                        speed: speed * (Math.random() * 0.5 + 1.2), // Faster than stars
                        type: isEnemy ? 'enemy' : 'ally',
                        color: isEnemy ? '#ff0055' : '#00f0ff',
                        rotation: 0
                    });
                }
            }

            for (let i = ships.length - 1; i >= 0; i--) {
                const ship = ships[i];
                ship.z -= ship.speed;
                ship.rotation += 0.05;

                if (ship.z <= 10) {
                    ships.splice(i, 1);
                    continue;
                }

                const scale = 500 / ship.z;
                const x = cx + ship.x * scale;
                const y = cy + ship.y * scale;
                const size = scale * 20;

                // Don't draw if off screen
                if (x < -100 || x > width + 100 || y < -100 || y > height + 100) continue;

                ctx.save();
                ctx.translate(x, y);

                // Bank the ship based on position
                const bankAngle = (ship.x / width) * 0.5;
                ctx.rotate(bankAngle);

                ctx.shadowBlur = 15;
                ctx.shadowColor = ship.color;
                ctx.fillStyle = ship.color;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;

                if (ship.type === 'enemy') {
                    // Enemy: Aggressive Triangle
                    ctx.beginPath();
                    ctx.moveTo(0, -size); // Nose
                    ctx.lineTo(size * 0.6, size * 0.6); // Right wing
                    ctx.lineTo(0, size * 0.3); // Rear notch
                    ctx.lineTo(-size * 0.6, size * 0.6); // Left wing
                    ctx.closePath();
                    ctx.fill();

                    // Cockpit
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.moveTo(0, -size * 0.5);
                    ctx.lineTo(size * 0.2, 0);
                    ctx.lineTo(-size * 0.2, 0);
                    ctx.fill();
                } else {
                    // Ally: Sleek Fighter
                    ctx.beginPath();
                    ctx.moveTo(0, -size * 1.2); // Long nose
                    ctx.lineTo(size * 0.4, size * 0.2);
                    ctx.lineTo(size * 0.8, size * 0.8); // Wing tip
                    ctx.lineTo(size * 0.2, size * 0.6);
                    ctx.lineTo(0, size * 0.8); // Engine
                    ctx.lineTo(-size * 0.2, size * 0.6);
                    ctx.lineTo(-size * 0.8, size * 0.8); // Wing tip
                    ctx.lineTo(-size * 0.4, size * 0.2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // Engine Glow
                ctx.shadowBlur = 20;
                ctx.shadowColor = ship.type === 'enemy' ? '#ffaa00' : '#00ffff';
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, size * 0.6, size * 0.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflowY: 'auto' // Allow scrolling if content is tall
            }}>
                {children}
            </div>
        </div>
    );
}
