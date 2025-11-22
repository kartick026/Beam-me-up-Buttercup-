// API service for communicating with the backend

const API_URL = 'http://localhost:3001/api';

export const gameAPI = {
    // Save a score
    async saveScore(
        playerName, score, level, kills, playtime,
        shotsFired, shotsHit, accuracy, damageDealt, damageTaken,
        bossesDefeated, bossTypesDefeated,
        powerupsCollected, favoriteWeapon, rapidFireUsed, doubleShotUsed, shieldUsed, shotgunUsed, laserUsed, missileUsed, pulseUsed, healthCollected,
        dashesUsed, maxCombo, perfectLevels,
        enemyTypesKilled
    ) {
        try {
            const response = await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: playerName,
                    score,
                    level,
                    kills,
                    playtime,
                    shots_fired: shotsFired,
                    shots_hit: shotsHit,
                    accuracy,
                    damage_dealt: damageDealt,
                    damage_taken: damageTaken,
                    bosses_defeated: bossesDefeated,
                    boss_types_defeated: bossTypesDefeated,
                    powerups_collected: powerupsCollected,
                    favorite_weapon: favoriteWeapon,
                    rapid_fire_used: rapidFireUsed,
                    double_shot_used: doubleShotUsed,
                    shield_used: shieldUsed,
                    shotgun_used: shotgunUsed,
                    laser_used: laserUsed,
                    missile_used: missileUsed,
                    pulse_used: pulseUsed,
                    health_collected: healthCollected,
                    dashes_used: dashesUsed,
                    max_combo: maxCombo,
                    perfect_levels: perfectLevels,
                    enemy_types_killed: enemyTypesKilled
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save score');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving score:', error);
            // Fallback to localStorage if server is down
            this.saveScoreLocally(playerName, score, level, kills);
            throw error;
        }
    },

    // Get top scores (leaderboard)
    async getTopScores(limit = 10) {
        try {
            const response = await fetch(`${API_URL}/scores?limit=${limit}`);

            if (!response.ok) {
                throw new Error('Failed to fetch scores');
            }

            const data = await response.json();
            return data.scores;
        } catch (error) {
            console.error('Error fetching scores:', error);
            return [];
        }
    },

    // Get player's best score
    async getPlayerBest(playerName) {
        try {
            const response = await fetch(`${API_URL}/scores/${encodeURIComponent(playerName)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch player score');
            }

            const data = await response.json();
            return data.score;
        } catch (error) {
            console.error('Error fetching player score:', error);
            return null;
        }
    },

    // Get player stats
    async getPlayerStats(playerName) {
        try {
            const response = await fetch(`${API_URL}/stats/${encodeURIComponent(playerName)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch player stats');
            }

            const data = await response.json();
            return data.stats;
        } catch (error) {
            console.error('Error fetching player stats:', error);
            return null;
        }
    },

    // Get global leaderboard
    async getLeaderboard() {
        try {
            const response = await fetch(`${API_URL}/leaderboard`);

            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }

            const data = await response.json();
            return data.leaderboard;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    // Check if server is running
    async checkHealth() {
        try {
            const response = await fetch(`${API_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Fallback: Save to localStorage if server is down
    saveScoreLocally(playerName, score, level, kills) {
        const scores = JSON.parse(localStorage.getItem('offlineScores') || '[]');
        scores.push({
            player_name: playerName,
            score,
            level,
            kills,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('offlineScores', JSON.stringify(scores));
    }
};
