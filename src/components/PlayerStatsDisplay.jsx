import React, { useState, useEffect } from 'react';
import { gameAPI } from '../utils/api';

export default function PlayerStatsDisplay({ playerName }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (playerName) {
            loadStats();
        }
    }, [playerName]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const playerStats = await gameAPI.getPlayerStats(playerName);
            setStats(playerStats);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                color: 'white',
                textAlign: 'center',
                padding: '20px'
            }}>
                Loading stats...
            </div>
        );
    }

    if (!stats || stats.games_played === 0) {
        return (
            <div style={{
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                padding: '20px',
                fontSize: '14px'
            }}>
                No stats yet. Play your first game!
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <h2 style={{
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: '800',
                color: '#00f0ff',
                margin: '0 0 20px 0',
                textAlign: 'center',
                borderBottom: '2px solid rgba(0, 240, 255, 0.3)',
                paddingBottom: '10px'
            }}>
                📊 {playerName}'s Stats
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)', // Force 3 columns on all screens
                gap: 'clamp(5px, 2vw, 15px)', // Smaller gap on mobile
                fontSize: 'clamp(10px, 2vw, 14px)' // Smaller text on mobile
            }}>
                <StatCard
                    icon="🎮"
                    label="Games Played"
                    value={stats.games_played || 0}
                    color="#00f0ff"
                />
                <StatCard
                    icon="🏆"
                    label="High Score"
                    value={stats.high_score || 0}
                    color="#ffed4e"
                />
                <StatCard
                    icon="⚔️"
                    label="Total Kills"
                    value={stats.total_kills || 0}
                    color="#ff3366"
                />
                <StatCard
                    icon="📈"
                    label="Avg Score"
                    value={Math.round(stats.average_score) || 0}
                    color="#00ff88"
                />
                <StatCard
                    icon="🎯"
                    label="Max Level"
                    value={stats.max_level || 0}
                    color="#ff00ff"
                />
                <StatCard
                    icon="⏱️"
                    label="Total Time"
                    value={formatTime(stats.total_playtime || 0)}
                    color="#ffa500"
                />
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${color}40`,
            borderRadius: '10px',
            padding: 'clamp(5px, 1.5vw, 12px)', // Smaller padding on mobile
            textAlign: 'center',
            transition: 'all 0.3s ease'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = `${color}20`;
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{ fontSize: 'clamp(16px, 4vw, 24px)', marginBottom: '5px' }}>{icon}</div>
            <div style={{
                fontSize: 'clamp(14px, 3vw, 20px)',
                fontWeight: '900',
                color: color,
                marginBottom: '3px'
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '600'
            }}>
                {label}
            </div>
        </div>
    );
}

function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}
