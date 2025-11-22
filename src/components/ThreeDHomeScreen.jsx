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
                    fontSize: 'clamp(40px, 8vw, 80px)', // Slightly smaller to fit long title
                    fontWeight: '900',
                    color: '#fff',
                    margin: '0 0 20px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '5px',
                    textAlign: 'center',
                    textShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff, 0 0 80px #00f0ff',
                    animation: 'pulse 2s infinite',
                    lineHeight: '1.2'
                }}>
                    BEAM ME UP,<br />BUTTERCUP!!
                </h1>

                <p style={{
                    color: '#00f0ff',
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    letterSpacing: '5px',
                    marginBottom: '60px',
                    textShadow: '0 0 10px #00f0ff',
                    fontFamily: 'monospace'
                }}>
                    BY KARTICK SHARMA
                </p>

                <button
                    onClick={onStartGame}
                    style={{
                        padding: '20px 80px',
                        fontSize: 'clamp(24px, 5vw, 36px)',
                        fontWeight: '900',
                        color: 'black',
                        background: '#00f0ff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
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
                    fontFamily: 'monospace'
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
