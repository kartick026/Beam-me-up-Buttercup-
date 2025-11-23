import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// You'll need to replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export const gameDB = {
    // Save a score
    async saveScore(scoreData) {
        const { data, error } = await supabase
            .from('scores')
            .insert([scoreData])
            .select();

        if (error) throw error;
        return data[0];
    },

    // Get top scores
    async getTopScores(limit = 10) {
        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    // Get player's best score
    async getPlayerBest(playerName) {
        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .eq('player_name', playerName)
            .order('score', { ascending: false })
            .limit(1);

        if (error) throw error;
        return data[0] || null;
    },

    // Get player stats (aggregated)
    async getPlayerStats(playerName) {
        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .eq('player_name', playerName)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) return null;

        // Aggregate stats
        const totalGames = data.length;
        const bestScore = Math.max(...data.map(s => s.score));
        const totalKills = data.reduce((sum, s) => sum + s.kills, 0);
        const totalPlaytime = data.reduce((sum, s) => sum + s.playtime, 0);
        const avgAccuracy = data.reduce((sum, s) => sum + s.accuracy, 0) / totalGames;

        return {
            player_name: playerName,
            games_played: totalGames,
            total_games: totalGames,
            high_score: bestScore,
            best_score: bestScore,
            total_kills: totalKills,
            total_playtime: totalPlaytime,
            average_accuracy: avgAccuracy,
            max_level: Math.max(...data.map(s => s.level)),
            last_played: data[0].created_at
        };
    },

    // Get global leaderboard
    async getLeaderboard() {
        const { data, error } = await supabase
            .from('scores')
            .select('player_name, score, level, kills, created_at')
            .order('score', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data;
    }
};
