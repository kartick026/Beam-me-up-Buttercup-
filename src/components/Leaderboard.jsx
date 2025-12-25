import React, { useEffect, useState } from 'react';
import { gameAPI } from '../utils/api';
import StarfieldBackground from './UI/StarfieldBackground';

export default function Leaderboard({ onClose }) {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await gameAPI.getLeaderboard();
            setLeaderboardData(data || []);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            setError('Failed to load leaderboard. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const getRankEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank) => {
        if (rank === 1) return '#FFD700'; // Gold
        if (rank === 2) return '#C0C0C0'; // Silver
        if (rank === 3) return '#CD7F32'; // Bronze
        return '#00f0ff'; // Cyan
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m ${secs}s`;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1000
        }}>
            <StarfieldBackground>
                <div style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px',
                    background: 'rgba(0,0,0,0.5)'
                }}>
                    {/* Header */}
                    <div style={{
                        width: '100%',
                        maxWidth: '900px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '30px'
                    }}>
                        <h1 style={{
                            fontSize: 'clamp(32px, 6vw, 56px)',
                            fontWeight: '900',
                            color: '#00f0ff',
                            margin: 0,
                            textShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff',
                            letterSpacing: '3px',
                            fontFamily: "'GameFont', cursive"
                        }}>
                            🏆 GLOBAL LEADERBOARD
                        </h1>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 51, 102, 0.2)',
                                border: '2px solid #ff3366',
                                color: '#ff3366',
                                padding: '10px 25px',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                fontFamily: "'GameFont', cursive",
                                transition: 'all 0.3s ease',
                                boxShadow: '0 0 15px rgba(255, 51, 102, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 51, 102, 0.4)';
                                e.target.style.boxShadow = '0 0 25px rgba(255, 51, 102, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 51, 102, 0.2)';
                                e.target.style.boxShadow = '0 0 15px rgba(255, 51, 102, 0.3)';
                            }}
                        >
                            ✕ CLOSE
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div style={{
                            color: '#00f0ff',
                            fontSize: '24px',
                            fontFamily: "'GameFont', cursive",
                            textAlign: 'center',
                            marginTop: '50px',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }}>
                            <div>⏳ Loading Leaderboard...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div style={{
                            color: '#ff3366',
                            fontSize: '18px',
                            fontFamily: "'GameFont', cursive",
                            textAlign: 'center',
                            marginTop: '50px',
                            padding: '20px',
                            background: 'rgba(255, 51, 102, 0.1)',
                            border: '2px solid #ff3366',
                            borderRadius: '10px'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                            <div>{error}</div>
                            <button
                                onClick={fetchLeaderboard}
                                style={{
                                    marginTop: '20px',
                                    padding: '10px 30px',
                                    background: '#ff3366',
                                    border: 'none',
                                    borderRadius: '20px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontFamily: "'GameFont', cursive",
                                    fontSize: '16px'
                                }}
                            >
                                🔄 Retry
                            </button>
                        </div>
                    )}

                    {/* Leaderboard Data */}
                    {!loading && !error && leaderboardData.length === 0 && (
                        <div style={{
                            color: '#aaa',
                            fontSize: '20px',
                            fontFamily: "'GameFont', cursive",
                            textAlign: 'center',
                            marginTop: '50px'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>👻</div>
                            <div>No scores yet. Be the first to play!</div>
                        </div>
                    )}

                    {!loading && !error && leaderboardData.length > 0 && (
                        <div style={{
                            width: '100%',
                            maxWidth: '900px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                            {leaderboardData.map((player, index) => {
                                const rank = index + 1;
                                const isSelected = selectedPlayer?.player_name === player.player_name;

                                return (
                                    <div
                                        key={`${player.player_name}-${index}`}
                                        onClick={() => setSelectedPlayer(isSelected ? null : player)}
                                        style={{
                                            background: rank <= 3
                                                ? `linear-gradient(135deg, rgba(${rank === 1 ? '255, 215, 0' : rank === 2 ? '192, 192, 192' : '205, 127, 50'}, 0.15), rgba(0, 0, 0, 0.6))`
                                                : 'rgba(0, 240, 255, 0.05)',
                                            border: `2px solid ${getRankColor(rank)}`,
                                            borderRadius: '15px',
                                            padding: '20px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: `0 0 ${rank <= 3 ? '25' : '15'}px ${getRankColor(rank)}40`,
                                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                            fontFamily: "'GameFont', cursive"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = `0 0 30px ${getRankColor(rank)}80`;
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = `0 0 ${rank <= 3 ? '25' : '15'}px ${getRankColor(rank)}40`;
                                            }
                                        }}
                                    >
                                        {/* Main Row */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'auto 1fr auto auto auto',
                                            gap: '20px',
                                            alignItems: 'center'
                                        }}>
                                            {/* Rank */}
                                            <div style={{
                                                fontSize: rank <= 3 ? '36px' : '24px',
                                                fontWeight: '900',
                                                color: getRankColor(rank),
                                                textShadow: `0 0 10px ${getRankColor(rank)}`,
                                                minWidth: '60px',
                                                textAlign: 'center'
                                            }}>
                                                {getRankEmoji(rank)}
                                            </div>

                                            {/* Player Name */}
                                            <div style={{
                                                fontSize: 'clamp(18px, 3vw, 24px)',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {player.player_name}
                                            </div>

                                            {/* Best Score */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                minWidth: '100px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#aaa' }}>BEST SCORE</div>
                                                <div style={{
                                                    fontSize: '20px',
                                                    fontWeight: 'bold',
                                                    color: '#ffed4e',
                                                    textShadow: '0 0 10px #ffed4e'
                                                }}>
                                                    {player.best_score?.toLocaleString() || 0}
                                                </div>
                                            </div>

                                            {/* Max Level */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                minWidth: '80px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#aaa' }}>MAX LVL</div>
                                                <div style={{
                                                    fontSize: '20px',
                                                    fontWeight: 'bold',
                                                    color: '#00ff00'
                                                }}>
                                                    {player.max_level || 1}
                                                </div>
                                            </div>

                                            {/* Total Kills */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                minWidth: '100px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#aaa' }}>KILLS</div>
                                                <div style={{
                                                    fontSize: '20px',
                                                    fontWeight: 'bold',
                                                    color: '#ff0055'
                                                }}>
                                                    {player.total_kills?.toLocaleString() || 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isSelected && (
                                            <div style={{
                                                marginTop: '20px',
                                                paddingTop: '20px',
                                                borderTop: `1px solid ${getRankColor(rank)}40`,
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                                gap: '15px',
                                                animation: 'fadeIn 0.3s ease-in'
                                            }}>
                                                <StatBox label="Games Played" value={player.games_played || 0} color="#00f0ff" />
                                                <StatBox label="Avg Accuracy" value={`${(player.avg_accuracy || 0).toFixed(1)}%`} color="#ff6600" />
                                                <StatBox label="Last Played" value={new Date(player.last_played).toLocaleDateString()} color="#aaa" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        marginTop: '40px',
                        padding: '20px',
                        textAlign: 'center',
                        color: '#aaa',
                        fontSize: '14px',
                        fontFamily: "'GameFont', cursive"
                    }}>
                        <div>Click on any player to see more details</div>
                        <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic', color: '#00f0ff' }}>
                            "if u dont like this leaderboard, u gotta love it honey!!"
                        </div>
                    </div>
                </div>
            </StarfieldBackground>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

// Helper component for stat boxes
function StatBox({ label, value, color }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: `1px solid ${color}40`
        }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>{label}</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color }}>{value}</div>
        </div>
    );
}
