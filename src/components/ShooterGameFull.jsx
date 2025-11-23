import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/gameLoop';
import { MusicSystem } from '../engine/music';
import { PlayerIcon } from './UI/PlayerIcon';
import { EnemyIcon } from './UI/EnemyIcon';
import { BossIcon } from './UI/BossIcon';
import { BulletIcon } from './UI/BulletIcon';
import { PowerupIcon } from './UI/PowerupIcon';
import ThreeDHomeScreen from './ThreeDHomeScreen';
import PlayerStatsDisplay from './PlayerStatsDisplay';
import { gameAPI } from '../utils/api';
import StarfieldBackground from './UI/StarfieldBackground';

export default function ShooterGameFull() {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const requestRef = useRef(null);
    const musicRef = useRef(null);

    // Game State for UI
    const [gameState, setGameState] = useState('home'); // home, setup, playing, paused, gameover
    const [score, setScore] = useState(0);
    const [health, setHealth] = useState(100);
    const [level, setLevel] = useState(1);
    const [musicEnabled, setMusicEnabled] = useState(true);
    const [sfxEnabled, setSfxEnabled] = useState(true);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [playerStats, setPlayerStats] = useState(null);
    const [isPortrait, setIsPortrait] = useState(false);
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        const checkOrientation = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };
        window.addEventListener('resize', checkOrientation);
        checkOrientation();
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    // Input State
    const inputRef = useRef({
        keys: {},
        mouse: { x: 0, y: 0 },
        mouseDown: false,
        joystick: { active: false, x: 0, y: 0, startX: 0, startY: 0, id: null },
        aimJoystick: { active: false, x: 0, y: 0, startX: 0, startY: 0, id: null },
        touchShoot: false,
        dashRequest: false
    });

    // Audio Context
    const audioCtxRef = useRef(null);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playSound = (type) => {
        if (!audioCtxRef.current || !sfxEnabled) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'shoot') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(1000, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start();
            osc.stop(now + 0.1);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start();
            osc.stop(now + 0.1);
        } else if (type === 'powerup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start();
            osc.stop(now + 0.3);
        } else if (type === 'bossSpawn') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(100, now + 1.0);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
            osc.start();
            osc.stop(now + 1.0);
        } else if (type === 'enemyDeath') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start();
            osc.stop(now + 0.2);
        } else if (type === 'bossDeath') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 1.5);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

            // Add a second oscillator for a "rumble" effect
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(50, now);
            osc2.frequency.linearRampToValueAtTime(10, now + 1.0);
            gain2.gain.setValueAtTime(0.3, now);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

            osc.start();
            osc.stop(now + 1.5);
            osc2.start();
            osc2.stop(now + 1.0);
        }
    };

    const [isLoadingStats, setIsLoadingStats] = useState(false);

    // Fetch stats when player name changes
    useEffect(() => {
        const fetchStats = async () => {
            if (playerName.trim().length > 2) {
                setIsLoadingStats(true);
                try {
                    const stats = await gameAPI.getPlayerStats(playerName);
                    setPlayerStats(stats);
                } catch (error) {
                    console.error('Error fetching stats:', error);
                    setPlayerStats(null);
                } finally {
                    setIsLoadingStats(false);
                }
            } else {
                setPlayerStats(null);
            }
        };

        const timeoutId = setTimeout(fetchStats, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [playerName]);

    useEffect(() => {
        musicRef.current = new MusicSystem();

        // Resume audio context on first user interaction
        const handleInteraction = () => {
            if (musicRef.current && musicRef.current.audioCtx.state === 'suspended') {
                musicRef.current.audioCtx.resume().then(() => {
                    if (musicEnabled && gameState !== 'gameover') {
                        musicRef.current.startMusic();
                    }
                }).catch(e => console.log("Audio resume failed:", e));
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            if (musicRef.current) musicRef.current.stopMusic();
        };
    }, []);

    useEffect(() => {
        if (musicRef.current) {
            if (musicEnabled) {
                // Initialize audio context if needed (for autoplay policies)
                if (musicRef.current.audioCtx.state === 'suspended') {
                    musicRef.current.audioCtx.resume().catch(e => console.log("Audio resume failed:", e));
                }

                if (gameState === 'gameover') {
                    musicRef.current.playGameOverTheme();
                } else {
                    // Play main theme for home, setup, playing, and paused
                    musicRef.current.startMusic();
                }
            } else {
                musicRef.current.stopMusic();
            }
        }
    }, [musicEnabled, gameState]);

    const startGame = () => {
        initAudio();
        setGameState('playing');
        setScore(0);
        setHealth(100);
        setLevel(1);

        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        engineRef.current = new GameEngine(
            canvas.width,
            canvas.height,
            async () => {
                // Save score to database first
                if (playerName) {
                    const engine = engineRef.current;
                    try {
                        await gameAPI.saveScore(
                            playerName,
                            engine.score,
                            engine.level,
                            engine.kills,
                            Math.floor(engine.playTime),
                            // Combat stats
                            engine.shotsFired,
                            engine.shotsHit,
                            engine.shotsFired > 0 ? (engine.shotsHit / engine.shotsFired) * 100 : 0,
                            engine.damageDealt,
                            engine.damageTaken,
                            // Boss stats
                            engine.bossesDefeated,
                            engine.bossTypesDefeated ? engine.bossTypesDefeated.join(',') : '',
                            // Power-up stats
                            engine.powerupsCollected,
                            engine.favoriteWeapon,
                            engine.rapidFireUsed,
                            engine.doubleShotUsed,
                            engine.shieldUsed,
                            engine.shotgunUsed,
                            engine.laserUsed,
                            engine.missileUsed,
                            engine.pulseUsed,
                            engine.healthCollected,
                            // Survival stats
                            engine.dashesUsed,
                            engine.maxCombo,
                            engine.perfectLevels,
                            // Enemy stats
                            engine.enemyTypesKilled ? engine.enemyTypesKilled.join(',') : ''
                        );
                    } catch (err) {
                        console.error('Failed to save score:', err);
                    }
                }
                setGameState('gameover');
            },
            (s) => setScore(s),
            (l) => setLevel(l),
            (h) => setHealth(h),
            playSound
        );
    };

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                if (engineRef.current) {
                    engineRef.current.width = window.innerWidth;
                    engineRef.current.height = window.innerHeight;
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const handleKeyDown = (e) => {
            inputRef.current.keys[e.key.toLowerCase()] = true;
            if (e.key === 'p' || e.key === 'P') {
                setGameState(prev => prev === 'playing' ? 'paused' : (prev === 'paused' ? 'playing' : prev));
            }
            if (e.key === 'Shift') inputRef.current.dashRequest = true;
        };
        const handleKeyUp = (e) => inputRef.current.keys[e.key.toLowerCase()] = false;

        const handleMouseMove = (e) => {
            inputRef.current.mouse.x = e.clientX;
            inputRef.current.mouse.y = e.clientY;
        };
        const handleMouseDown = () => inputRef.current.mouseDown = true;
        const handleMouseUp = () => inputRef.current.mouseDown = false;

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        let lastTime = performance.now();
        let frameCount = 0;
        const loop = (time) => {
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            if (gameState === 'playing' && engineRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                engineRef.current.update(Math.min(dt, 0.1), inputRef.current);
                engineRef.current.draw(ctx);

                // Force re-render every 2 frames for joystick visuals
                frameCount++;
                if (frameCount % 2 === 0) {
                    forceUpdate(prev => prev + 1);
                }
            }
            requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameState]);

    // Touch Controls - Twin Stick
    const touchStart = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.clientX < window.innerWidth / 2) {
                // Left side: Movement Joystick
                inputRef.current.joystick.id = t.identifier;
                inputRef.current.joystick.startX = t.clientX;
                inputRef.current.joystick.startY = t.clientY;
                inputRef.current.joystick.active = true;
                inputRef.current.joystick.x = 0;
                inputRef.current.joystick.y = 0;
            } else {
                // Right side: Aim Joystick
                inputRef.current.aimJoystick.id = t.identifier;
                inputRef.current.aimJoystick.startX = t.clientX;
                inputRef.current.aimJoystick.startY = t.clientY;
                inputRef.current.aimJoystick.active = true;
                inputRef.current.aimJoystick.x = 0;
                inputRef.current.aimJoystick.y = 0;
                inputRef.current.touchShoot = true; // Auto-shoot when aiming
            }
        }
    };

    const touchMove = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            // Movement joystick
            if (t.identifier === inputRef.current.joystick.id) {
                const dx = t.clientX - inputRef.current.joystick.startX;
                const dy = t.clientY - inputRef.current.joystick.startY;
                const maxDist = 50;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const clampedDist = Math.min(dist, maxDist);
                const angle = Math.atan2(dy, dx);
                inputRef.current.joystick.x = Math.cos(angle) * (clampedDist / maxDist);
                inputRef.current.joystick.y = Math.sin(angle) * (clampedDist / maxDist);
            }
            // Aim joystick
            if (t.identifier === inputRef.current.aimJoystick.id) {
                const dx = t.clientX - inputRef.current.aimJoystick.startX;
                const dy = t.clientY - inputRef.current.aimJoystick.startY;
                const maxDist = 50;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const clampedDist = Math.min(dist, maxDist);
                const angle = Math.atan2(dy, dx);
                inputRef.current.aimJoystick.x = Math.cos(angle) * (clampedDist / maxDist);
                inputRef.current.aimJoystick.y = Math.sin(angle) * (clampedDist / maxDist);
            }
        }
    };

    const touchEnd = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === inputRef.current.joystick.id) {
                inputRef.current.joystick.active = false;
                inputRef.current.joystick.x = 0;
                inputRef.current.joystick.y = 0;
                inputRef.current.joystick.id = null;
            }
            if (t.identifier === inputRef.current.aimJoystick.id) {
                inputRef.current.aimJoystick.active = false;
                inputRef.current.aimJoystick.x = 0;
                inputRef.current.aimJoystick.y = 0;
                inputRef.current.aimJoystick.id = null;
                inputRef.current.touchShoot = false;
            }
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
            <canvas
                ref={canvasRef}
                onTouchStart={touchStart}
                onTouchMove={touchMove}
                onTouchEnd={touchEnd}
                style={{ display: 'block', cursor: gameState === 'playing' ? 'none' : 'default' }}
            />

            {/* HUD */}
            {gameState === 'playing' && (
                <div style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    color: 'white',
                    fontFamily: "'GameFont', cursive",
                    fontSize: 'min(20px, 5vw)', // Responsive font size
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>
                    <div>SCORE: {score}</div>
                    <div style={{ marginBottom: '5px' }}>
                        <div style={{ fontSize: '0.8em', marginBottom: '2px' }}>HEALTH: {Math.ceil(health)}</div>
                        <div style={{
                            width: '200px',
                            maxWidth: '40vw',
                            height: '15px',
                            background: 'rgba(50, 0, 0, 0.6)',
                            border: '1px solid #ff0000',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.max(0, Math.min(100, health))}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #ff0000, #ff4400)',
                                boxShadow: '0 0 10px #ff0000',
                                transition: 'width 0.2s ease-out'
                            }} />
                        </div>
                    </div>
                    <div>LEVEL: {level}</div>

                    {/* Level Progress */}
                    {engineRef.current && engineRef.current.bosses.length === 0 && (
                        <div style={{ marginTop: 5, fontSize: '0.8em', color: '#aaaaaa' }}>
                            Progress: {engineRef.current.killsThisLevel} / {engineRef.current.killsRequiredForNextLevel} kills
                        </div>
                    )}

                    {/* Boss Warning */}
                    {engineRef.current && engineRef.current.bosses.length > 0 && (
                        <div style={{ marginTop: 5, fontSize: '1.2em', color: '#ff0000', textShadow: '0 0 10px #ff0000', animation: 'pulse 0.5s ease-in-out infinite' }}>
                            ⚠ BOSS FIGHT ⚠
                        </div>
                    )}

                    {/* Weapon Display */}
                    {engineRef.current && engineRef.current.player.weaponType !== 'normal' && (
                        <div style={{ marginTop: 10, color: '#ff6600', textShadow: '0 0 8px #ff6600' }}>
                            WEAPON: {engineRef.current.player.weaponType.toUpperCase()}
                        </div>
                    )}

                    {/* Laser Energy Bar */}
                    {engineRef.current && engineRef.current.player.weaponType === 'laser' && (
                        <div style={{ marginTop: 5 }}>
                            <div style={{ fontSize: '0.7em' }}>ENERGY:</div>
                            <div style={{ width: '150px', maxWidth: '30vw', height: 10, background: '#333', border: '1px solid #0066ff' }}>
                                <div style={{
                                    width: `${(engineRef.current.player.laserEnergy / engineRef.current.player.maxLaserEnergy) * 100}%`,
                                    height: '100%',
                                    background: '#0066ff',
                                    boxShadow: '0 0 10px #0066ff'
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Missile Count */}
                    {engineRef.current && engineRef.current.player.weaponType === 'missile' && (
                        <div style={{ marginTop: 5, fontSize: '0.9em', color: '#ff0066' }}>
                            MISSILES: {engineRef.current.player.missileCount}
                        </div>
                    )}

                    {/* Combo Display */}
                    {engineRef.current && engineRef.current.combo > 0 && (
                        <div style={{
                            marginTop: 10,
                            fontSize: '1.2em',
                            color: '#ffff00',
                            textShadow: '0 0 10px #ffff00',
                            animation: 'pulse 0.5s ease-in-out infinite'
                        }}>
                            COMBO: {engineRef.current.combo} x{Math.min(Math.floor(engineRef.current.combo / 5) + 1, 10)}
                        </div>
                    )}
                </div>
            )}

            {/* Controls (Music/Pause) */}
            {gameState === 'playing' && (
                <div
                    style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        display: 'flex',
                        gap: 10
                    }}
                >
                    {/* Music Toggle */}
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            zIndex: 100
                        }}
                        onClick={() => setMusicEnabled(!musicEnabled)}
                        onTouchStart={(e) => { e.stopPropagation(); setMusicEnabled(!musicEnabled); }}
                    >
                        <span style={{ fontSize: 20 }}>{musicEnabled ? '🎵' : '🔇'}</span>
                    </div>

                    {/* SFX Toggle */}
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            zIndex: 100
                        }}
                        onClick={() => setSfxEnabled(!sfxEnabled)}
                        onTouchStart={(e) => { e.stopPropagation(); setSfxEnabled(!sfxEnabled); }}
                    >
                        <span style={{ fontSize: 20 }}>{sfxEnabled ? '🔊' : '🔇'}</span>
                    </div>

                    {/* Pause */}
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: 5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            zIndex: 100
                        }}
                        onClick={() => setGameState('paused')}
                        onTouchStart={(e) => { e.stopPropagation(); setGameState('paused'); }}
                    >
                        <div style={{ display: 'flex', gap: 5 }}>
                            <div style={{ width: 5, height: 20, background: 'white' }}></div>
                            <div style={{ width: 5, height: 20, background: 'white' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Controls Overlay */}
            {gameState === 'playing' && (
                <>
                    {/* Visual Joystick */}
                    {inputRef.current.joystick.active && (
                        <div style={{
                            position: 'absolute',
                            left: inputRef.current.joystick.startX - 50,
                            top: inputRef.current.joystick.startY - 50,
                            width: 100,
                            height: 100,
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            transform: 'translate(-50%, -50%)'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: 50 + inputRef.current.joystick.x * 50,
                                top: 50 + inputRef.current.joystick.y * 50,
                                width: 40,
                                height: 40,
                                background: 'rgba(0, 240, 255, 0.5)',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                boxShadow: '0 0 10px #00f0ff'
                            }} />
                        </div>
                    )}

                    {/* Dash Button */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '5%',
                            right: '25%',
                            width: 'min(100px, 20vw)',
                            height: 'min(100px, 20vw)',
                            background: 'rgba(0, 240, 255, 0.2)',
                            border: '2px solid rgba(0, 240, 255, 0.5)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto',
                            userSelect: 'none',
                            touchAction: 'none'
                        }}
                        onTouchStart={(e) => { e.preventDefault(); inputRef.current.dashRequest = true; }}
                    >
                        <span style={{ color: 'white', fontSize: 'min(14px, 3vw)', fontWeight: 'bold' }}>DASH</span>
                    </div>


                    {/* Aim Joystick Visual */}
                    {inputRef.current.aimJoystick.active && (
                        <div style={{
                            position: 'absolute',
                            left: inputRef.current.aimJoystick.startX - 50,
                            top: inputRef.current.aimJoystick.startY - 50,
                            width: 100,
                            height: 100,
                            border: '2px solid rgba(255, 50, 50, 0.3)',
                            background: 'rgba(255, 50, 50, 0.05)',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            transform: 'translate(-50%, -50%)'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: 50 + inputRef.current.aimJoystick.x * 50,
                                top: 50 + inputRef.current.aimJoystick.y * 50,
                                width: 40,
                                height: 40,
                                background: 'rgba(255, 50, 50, 0.5)',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                boxShadow: '0 0 10px #ff3232'
                            }} />
                        </div>
                    )}
                </>
            )}

            {/* Home Screen - 3D Animated */}
            {gameState === 'home' && (
                <ThreeDHomeScreen onStartGame={() => setGameState('setup')} />
            )}

            {/* Setup Screen - Name & Instructions */}
            {gameState === 'setup' && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 10
                }}>
                    <StarfieldBackground>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden', // Prevent scrolling
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px',
                            gap: '10px', // Reduced gap
                            background: 'rgba(0,0,0,0.4)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '600px' }}>
                                <h1 style={{
                                    fontSize: 'clamp(32px, 6vw, 48px)',
                                    fontWeight: '900',
                                    color: 'white',
                                    margin: 0,
                                    textAlign: 'center',
                                    textShadow: '0 0 10px #00f0ff, 0 0 20px #00f0ff',
                                    letterSpacing: '2px'
                                }}>
                                    ENTER YOUR NAME
                                </h1>

                                <input
                                    type="text"
                                    placeholder="Player Name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    maxLength={20}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: 'clamp(18px, 3vw, 24px)',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        background: 'rgba(0, 0, 0, 0.6)',
                                        border: '2px solid #00f0ff',
                                        borderRadius: '10px',
                                        color: 'white',
                                        outline: 'none',
                                        width: 'min(400px, 80vw)',
                                        fontFamily: "'GameFont', cursive",
                                        boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.6)';
                                        e.target.style.background = 'rgba(0, 0, 0, 0.8)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3)';
                                        e.target.style.background = 'rgba(0, 0, 0, 0.6)';
                                    }}
                                    autoFocus
                                />

                                {/* Player Stats Display */}
                                {isLoadingStats && (
                                    <div style={{ color: '#00f0ff', fontFamily: "'GameFont', cursive", marginBottom: '10px' }}>
                                        Loading stats...
                                    </div>
                                )}
                                {!isLoadingStats && playerStats && playerStats.games_played > 0 && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '10px',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0, 240, 255, 0.3)',
                                        width: 'min(400px, 80vw)',
                                        marginTop: '-20px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#aaa' }}>HIGH SCORE</div>
                                            <div style={{ fontSize: '20px', color: '#ffff00', fontWeight: 'bold' }}>{playerStats.high_score}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#aaa' }}>TOTAL KILLS</div>
                                            <div style={{ fontSize: '20px', color: '#ff0055', fontWeight: 'bold' }}>{playerStats.total_kills}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#aaa' }}>GAMES PLAYED</div>
                                            <div style={{ fontSize: '20px', color: '#00f0ff', fontWeight: 'bold' }}>{playerStats.games_played}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#aaa' }}>MAX LEVEL</div>
                                            <div style={{ fontSize: '20px', color: '#00ff00', fontWeight: 'bold' }}>{playerStats.max_level}</div>
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="checkbox"
                                            id="musicToggle"
                                            checked={musicEnabled}
                                            onChange={(e) => setMusicEnabled(e.target.checked)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="musicToggle" style={{ fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'GameFont', cursive", color: '#00f0ff' }}>
                                            Music 🎵
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="checkbox"
                                            id="sfxToggle"
                                            checked={sfxEnabled}
                                            onChange={(e) => setSfxEnabled(e.target.checked)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="sfxToggle" style={{ fontSize: '18px', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'GameFont', cursive", color: '#00f0ff' }}>
                                            SFX 🔊
                                        </label>
                                    </div>
                                </div>


                                <button
                                    onClick={() => setShowHowToPlay(true)}
                                    style={{
                                        background: 'transparent',
                                        border: '2px solid #00f0ff',
                                        color: '#00f0ff',
                                        padding: '10px 20px',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontFamily: "'GameFont', cursive",
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        marginTop: '10px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(0, 240, 255, 0.2)';
                                        e.target.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.6)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
                                    }}
                                >
                                    🎮 HOW TO PLAY
                                </button>

                                {showHowToPlay && (
                                    <div style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: 'rgba(0, 0, 0, 0.85)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 1000,
                                        backdropFilter: 'blur(5px)'
                                    }} onClick={() => setShowHowToPlay(false)}>
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                background: 'rgba(10, 10, 20, 0.95)',
                                                border: '2px solid #00f0ff',
                                                borderRadius: '15px',
                                                padding: '25px',
                                                maxWidth: '600px',
                                                width: '90%',
                                                maxHeight: '90vh',
                                                overflowY: 'auto',
                                                boxShadow: '0 0 50px rgba(0, 240, 255, 0.3)',
                                                position: 'relative'
                                            }}
                                        >
                                            <button
                                                onClick={() => setShowHowToPlay(false)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '15px',
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ff0055',
                                                    fontSize: '24px',
                                                    cursor: 'pointer',
                                                    fontFamily: 'Arial',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ✕
                                            </button>

                                            <h2 style={{
                                                fontSize: '24px',
                                                color: '#00f0ff',
                                                textAlign: 'center',
                                                marginTop: '0',
                                                marginBottom: '20px',
                                                textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
                                                fontFamily: "'GameFont', cursive"
                                            }}>
                                                🎮 HOW TO PLAY
                                            </h2>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', lineHeight: 1.6, fontFamily: "'GameFont', cursive" }}>
                                                <div><strong style={{ color: '#00f0ff' }}>🎯 Objective:</strong> Survive waves of enemies and defeat bosses!</div>
                                                <div><strong style={{ color: '#00f0ff' }}>⌨️ Movement:</strong> Use WASD keys to move around</div>
                                                <div><strong style={{ color: '#00f0ff' }}>🖱️ Shooting:</strong> Aim with mouse, click to shoot</div>
                                                <div><strong style={{ color: '#00f0ff' }}>⚡ Dash:</strong> Press SHIFT to dash</div>

                                                <div style={{ marginTop: '10px', borderTop: '1px solid rgba(0,240,255,0.3)', paddingTop: '15px' }}>
                                                    <div style={{ fontSize: '1.1em', color: '#aaa', marginBottom: '10px', textAlign: 'center' }}>Power-ups:</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '15px', fontSize: '12px' }}>
                                                        <div style={{ color: '#00ff00', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>⚡</span> Rapid</div>
                                                        <div style={{ color: '#ffff00', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>✌️</span> Double</div>
                                                        <div style={{ color: '#00ffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>🛡️</span> Shield</div>
                                                        <div style={{ color: '#ff6600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>∴</span> Shotgun</div>
                                                        <div style={{ color: '#0066ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>┃</span> Laser</div>
                                                        <div style={{ color: '#ff0066', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>🚀</span> Missile</div>
                                                        <div style={{ color: '#ff3366', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>❤</span> Health</div>
                                                        <div style={{ color: '#00ffaa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '24px' }}>🌀</span> Pulse</div>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    marginTop: '20px',
                                                    textAlign: 'center',
                                                    color: '#ff0055',
                                                    fontStyle: 'italic',
                                                    fontSize: '14px',
                                                    textShadow: '0 0 5px rgba(255, 0, 85, 0.5)'
                                                }}>
                                                    "if u dont like this game, u gotta love it honey!!"
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexShrink: 0 }}>
                                <button
                                    onClick={() => {
                                        if (playerName.trim()) {
                                            startGame();
                                        } else {
                                            alert('Please enter your name!');
                                        }
                                    }}
                                    style={{
                                        padding: '15px 50px',
                                        fontSize: 'clamp(24px, 4vw, 32px)',
                                        fontWeight: '900',
                                        color: 'black',
                                        background: '#00f0ff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontFamily: "'GameFont', cursive",
                                        letterSpacing: '4px',
                                        boxShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.05)';
                                        e.target.style.background = '#fff';
                                        e.target.style.boxShadow = '0 0 40px #fff, 0 0 80px #00f0ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.background = '#00f0ff';
                                        e.target.style.boxShadow = '0 0 20px #00f0ff, 0 0 40px #00f0ff';
                                    }}
                                >
                                    START GAME
                                </button>

                                <button
                                    onClick={() => setGameState('home')}
                                    style={{
                                        padding: '10px 30px',
                                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                                        fontWeight: '600',
                                        color: '#00f0ff',
                                        background: 'transparent',
                                        border: '2px solid #00f0ff',
                                        borderRadius: '25px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontFamily: "'GameFont', cursive"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(0, 240, 255, 0.1)';
                                        e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    ← BACK
                                </button>
                            </div>
                        </div>
                    </StarfieldBackground>
                </div >
            )
            }

            {
                gameState === 'paused' && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        backdropFilter: 'blur(5px)',
                        zIndex: 100
                    }}>
                        <h1 style={{
                            fontSize: '48px',
                            fontWeight: '900',
                            color: '#00f0ff',
                            textShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
                            marginBottom: '30px'
                        }}>PAUSED</h1>

                        <div style={{ marginBottom: '30px', width: '90%', maxWidth: '600px' }}>
                            <PlayerStatsDisplay playerName={playerName} />
                        </div>

                        <button
                            onClick={() => setGameState('playing')}
                            style={{
                                padding: '15px 50px',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: 'white',
                                background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
                                border: 'none',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)'
                            }}
                        >
                            RESUME
                        </button>

                        <button
                            onClick={() => setMusicEnabled(!musicEnabled)}
                            style={{
                                marginTop: '20px',
                                padding: '10px 30px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: musicEnabled ? '#00f0ff' : '#ff3366',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: `2px solid ${musicEnabled ? '#00f0ff' : '#ff3366'}`,
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontFamily: "'GameFont', cursive",
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '220px',
                                justifyContent: 'center'
                            }}
                        >
                            {musicEnabled ? 'MUSIC: ON' : 'MUSIC: OFF'}
                        </button>

                        <button
                            onClick={() => setSfxEnabled(!sfxEnabled)}
                            style={{
                                marginTop: '10px',
                                padding: '10px 30px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: sfxEnabled ? '#00f0ff' : '#ff3366',
                                background: 'rgba(0, 0, 0, 0.5)',
                                border: `2px solid ${sfxEnabled ? '#00f0ff' : '#ff3366'}`,
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontFamily: "'GameFont', cursive",
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '220px',
                                justifyContent: 'center'
                            }}
                        >
                            {sfxEnabled ? 'SFX: ON' : 'SFX: OFF'}
                        </button>
                    </div>
                )
            }

            {
                gameState === 'gameover' && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(50,0,0,0.9)',
                        color: 'white',
                        backdropFilter: 'blur(5px)',
                        zIndex: 100
                    }}>
                        <h1 style={{
                            color: '#ff3366',
                            fontSize: 'min(60px, 12vw)',
                            fontWeight: '900',
                            textShadow: '0 0 30px rgba(255, 51, 102, 0.6)',
                            margin: '0 0 20px 0'
                        }}>GAME OVER</h1>

                        <h2 style={{
                            fontSize: '32px',
                            marginBottom: '30px',
                            color: '#fff'
                        }}>Final Score: <span style={{ color: '#ffed4e' }}>{score}</span></h2>

                        <div style={{ marginBottom: '30px', width: '90%', maxWidth: '600px' }}>
                            <PlayerStatsDisplay playerName={playerName} />
                        </div>

                        <button
                            onClick={startGame}
                            style={{
                                padding: '15px 50px',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: 'black',
                                background: 'linear-gradient(135deg, #00f0ff, #00d4ff)',
                                border: 'none',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                boxShadow: '0 0 30px rgba(0, 240, 255, 0.6), 0 4px 15px rgba(0, 0, 0, 0.3)',
                                transition: 'all 0.3s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 0 40px rgba(0, 240, 255, 0.8), 0 6px 20px rgba(0, 0, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.6), 0 4px 15px rgba(0, 0, 0, 0.3)';
                            }}
                        >
                            PLAY AGAIN
                        </button>

                        <button
                            onClick={() => setGameState('home')}
                            style={{
                                marginTop: '20px',
                                padding: '12px 40px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#ff3366',
                                background: 'rgba(255, 51, 102, 0.1)',
                                border: '2px solid #ff3366',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 51, 102, 0.2)';
                                e.target.style.boxShadow = '0 0 20px rgba(255, 51, 102, 0.4)';
                                e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 51, 102, 0.1)';
                                e.target.style.boxShadow = 'none';
                                e.target.style.transform = 'scale(1)';
                            }}
                        >
                            MAIN MENU
                        </button>
                    </div>
                )
            }
            {
                isPortrait && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'black',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        textAlign: 'center',
                        padding: '20px'
                    }}>
                        <div style={{ fontSize: '50px', marginBottom: '20px' }}>📱↻</div>
                        <h2 style={{ color: '#00f0ff', fontFamily: "'GameFont', cursive" }}>PLEASE ROTATE DEVICE</h2>
                        <p style={{ fontFamily: "'GameFont', cursive", color: '#aaa' }}>Landscape mode required for best experience</p>
                    </div>
                )
            }
        </div >
    );
}
