// API service for communicating with Supabase
import { gameDB } from './supabase.js';

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
            const scoreData = {
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
            };

            return await gameDB.saveScore(scoreData);
        } catch (error) {
            console.error('Error saving score:', error);
            // Fallback to localStorage if Supabase fails
            this.saveScoreLocally(playerName, score, level, kills);
            throw error;
        }
    },

    // Get top scores (leaderboard)
    async getTopScores(limit = 10) {
        try {
            return await gameDB.getTopScores(limit);
        } catch (error) {
            console.error('Error fetching scores:', error);
            return [];
        }
    },

    // Get player's best score
    async getPlayerBest(playerName) {
        try {
            return await gameDB.getPlayerBest(playerName);
        } catch (error) {
            console.error('Error fetching player score:', error);
            return null;
        }
    },

    // Get player stats
    async getPlayerStats(playerName) {
        try {
            return await gameDB.getPlayerStats(playerName);
        } catch (error) {
            console.error('Error fetching player stats:', error);
            return null;
        }
    },

    // Get global leaderboard
    async getLeaderboard() {
        try {
            return await gameDB.getLeaderboard();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    // Check if Supabase is configured
    async checkHealth() {
        try {
            await gameDB.getTopScores(1);
            return true;
        } catch (error) {
            return false;
        }
    },

    // Fallback: Save to localStorage if Supabase is down
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
