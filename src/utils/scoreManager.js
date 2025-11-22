// Simple localStorage-based score management
// This acts like a local database for the browser

export class ScoreManager {
    constructor() {
        this.storageKey = 'beamMeUpScores';
    }

    // Get all scores
    getAllScores() {
        const scores = localStorage.getItem(this.storageKey);
        return scores ? JSON.parse(scores) : [];
    }

    // Save a new score
    saveScore(playerName, score, level, kills) {
        const scores = this.getAllScores();
        const newScore = {
            id: Date.now(),
            playerName: playerName || 'Anonymous',
            score: score,
            level: level,
            kills: kills,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        scores.push(newScore);

        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);

        // Keep only top 10
        const topScores = scores.slice(0, 10);

        localStorage.setItem(this.storageKey, JSON.stringify(topScores));

        return newScore;
    }

    // Get top N scores
    getTopScores(limit = 10) {
        const scores = this.getAllScores();
        return scores.slice(0, limit);
    }

    // Get player's best score
    getPlayerBest(playerName) {
        const scores = this.getAllScores();
        const playerScores = scores.filter(s => s.playerName === playerName);
        return playerScores.length > 0 ? playerScores[0] : null;
    }

    // Check if score makes it to leaderboard
    isHighScore(score) {
        const scores = this.getAllScores();
        if (scores.length < 10) return true;
        return score > scores[scores.length - 1].score;
    }

    // Clear all scores
    clearScores() {
        localStorage.removeItem(this.storageKey);
    }

    // Get player stats
    getPlayerStats(playerName) {
        const scores = this.getAllScores();
        const playerScores = scores.filter(s => s.playerName === playerName);

        if (playerScores.length === 0) {
            return null;
        }

        return {
            gamesPlayed: playerScores.length,
            highScore: Math.max(...playerScores.map(s => s.score)),
            totalKills: playerScores.reduce((sum, s) => sum + s.kills, 0),
            averageScore: Math.round(playerScores.reduce((sum, s) => sum + s.score, 0) / playerScores.length),
            maxLevel: Math.max(...playerScores.map(s => s.level))
        };
    }
}

// Export singleton instance
export const scoreManager = new ScoreManager();
