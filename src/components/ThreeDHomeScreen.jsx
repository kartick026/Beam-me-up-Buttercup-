import React from 'react';
import StarfieldBackground from './UI/StarfieldBackground';

export default function ThreeDHomeScreen({ onStartGame }) {
    return (
        <StarfieldBackground>
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)'
            }}>
                <h1 style={{
                    fontFamily: "'GameFont', cursive",
                    fontSize: 'clamp(28px, 6vw, 80px)', // Smaller minimum size for mobile
                    fontWeight: '900',
                    color: '#fff',
                    margin: '0 0 20px 0',
                    textTransform: 'uppercase',
                    letterSpacing: 'clamp(2px, 1vw, 5px)', // Tighter spacing on mobile
                    textAlign: 'center',
                    textShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff, 0 0 80px #00f0ff',
                    animation: 'pulse 2s infinite',
                    lineHeight: '1.2',
                    maxWidth: '95vw' // Ensure it doesn't overflow width
                }}>
                    BEAM ME UP,<br />BUTTERCUP!!
                </h1>

                <p style={{
                    color: '#00f0ff',
                    fontSize: 'clamp(12px, 3vw, 24px)',
                    letterSpacing: 'clamp(2px, 1vw, 5px)',
                    marginBottom: 'clamp(30px, 8vh, 60px)',
                    textShadow: '0 0 10px #00f0ff',
                    fontFamily: "'GameFont', cursive"
                }}>
                    BY KARTICK SHARMA
                </p>

                <button
                    onClick={onStartGame}
                    style={{
                        padding: 'clamp(12px, 3vw, 20px) clamp(30px, 6vw, 80px)', // Responsive padding
                        fontSize: 'clamp(16px, 4vw, 36px)', // Smaller font on mobile
                        fontWeight: '900',
                        color: 'black',
                        background: '#00f0ff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontFamily: "'GameFont', cursive",
                        letterSpacing: '5px',
                        boxShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.background = '#fff';
                        e.target.style.boxShadow = '0 0 40px #fff, 0 0 80px #00f0ff';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.background = '#00f0ff';
                        e.target.style.boxShadow = '0 0 20px #00f0ff, 0 0 40px #00f0ff';
                    }}
                >
                    START MISSION
                </button>

                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '12px',
                    fontFamily: "'GameFont', cursive"
                }}>
                    v1.0.0 • REACT SHOOTER
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { text-shadow: 0 0 20px #00f0ff, 0 0 40px #00f0ff; opacity: 1; }
                    50% { text-shadow: 0 0 40px #00f0ff, 0 0 80px #00f0ff; opacity: 0.8; }
                    100% { text-shadow: 0 0 20px #00f0ff, 0 0 40px #00f0ff; opacity: 1; }
                }
            `}</style>
        </StarfieldBackground>
    );
}
