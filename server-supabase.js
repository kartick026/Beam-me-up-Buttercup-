import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials!');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Test Supabase connection
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('scores')
            .select('id')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase connection error:', error.message);
        } else {
            console.log('✅ Connected to Supabase database');
        }
    } catch (err) {
        console.error('❌ Failed to connect to Supabase:', err.message);
    }
}

testConnection();

// API Routes

// Get all scores (leaderboard)
app.get('/api/scores', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) throw error;
        res.json({ scores: data || [] });
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get player's best score
app.get('/api/scores/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;

        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .eq('player_name', playerName)
            .order('score', { ascending: false })
            .limit(1);

        if (error) throw error;
        res.json({ score: data && data.length > 0 ? data[0] : null });
    } catch (error) {
        console.error('Error fetching player score:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get player stats
app.get('/api/stats/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;

        const { data, error } = await supabase
            .from('scores')
            .select('*')
            .eq('player_name', playerName);

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.json({ stats: null });
        }

        const stats = {
            games_played: data.length,
            high_score: Math.max(...data.map(s => s.score)),
            total_kills: data.reduce((sum, s) => sum + (s.kills || 0), 0),
            average_score: Math.round(data.reduce((sum, s) => sum + s.score, 0) / data.length),
            max_level: Math.max(...data.map(s => s.level)),
            total_playtime: data.reduce((sum, s) => sum + (s.playtime || 0), 0)
        };

        res.json({ stats });
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save a new score with comprehensive stats
app.post('/api/scores', async (req, res) => {
    try {
        const {
            player_name, score, level, kills, playtime,
            // Combat stats
            shots_fired, shots_hit, accuracy, damage_dealt, damage_taken,
            // Boss stats
            bosses_defeated, boss_types_defeated,
            // Power-up stats
            powerups_collected, favorite_weapon,
            rapid_fire_used, double_shot_used, shield_used, shotgun_used,
            laser_used, missile_used, pulse_used, health_collected,
            // Survival stats
            dashes_used, max_combo, perfect_levels,
            // Enemy stats
            enemy_types_killed
        } = req.body;

        if (!player_name || score === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const scoreData = {
            player_name,
            score,
            level: level || 1,
            kills: kills || 0,
            playtime: playtime || 0,
            shots_fired: shots_fired || 0,
            shots_hit: shots_hit || 0,
            accuracy: accuracy || 0,
            damage_dealt: damage_dealt || 0,
            damage_taken: damage_taken || 0,
            bosses_defeated: bosses_defeated || 0,
            boss_types_defeated: boss_types_defeated || '',
            powerups_collected: powerups_collected || 0,
            favorite_weapon: favorite_weapon || 'normal',
            rapid_fire_used: rapid_fire_used || 0,
            double_shot_used: double_shot_used || 0,
            shield_used: shield_used || 0,
            shotgun_used: shotgun_used || 0,
            laser_used: laser_used || 0,
            missile_used: missile_used || 0,
            pulse_used: pulse_used || 0,
            health_collected: health_collected || 0,
            dashes_used: dashes_used || 0,
            max_combo: max_combo || 0,
            perfect_levels: perfect_levels || 0,
            enemy_types_killed: enemy_types_killed || ''
        };

        const { data, error } = await supabase
            .from('scores')
            .insert([scoreData])
            .select();

        if (error) throw error;

        res.json({
            message: 'Score saved successfully',
            id: data[0].id
        });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get global leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('scores')
            .select('player_name, score, level, kills, created_at');

        if (error) throw error;

        // Group by player and get best scores
        const playerMap = new Map();
        data.forEach(score => {
            const existing = playerMap.get(score.player_name);
            if (!existing || score.score > existing.score) {
                playerMap.set(score.player_name, score);
            }
        });

        const leaderboard = Array.from(playerMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(score => ({
                player_name: score.player_name,
                best_score: score.score,
                max_level: score.level,
                total_kills: data
                    .filter(s => s.player_name === score.player_name)
                    .reduce((sum, s) => sum + (s.kills || 0), 0),
                games_played: data.filter(s => s.player_name === score.player_name).length
            }));

        res.json({ leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get player achievements
app.get('/api/achievements/:playerName', async (req, res) => {
    try {
        const { playerName } = req.params;

        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('player_name', playerName)
            .order('unlocked_at', { ascending: false });

        if (error) throw error;
        res.json({ achievements: data || [] });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ error: error.message });
    }
});

// Unlock achievement
app.post('/api/achievements', async (req, res) => {
    try {
        const { player_name, achievement_name, achievement_description } = req.body;

        if (!player_name || !achievement_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('achievements')
            .upsert({
                player_name,
                achievement_name,
                achievement_description: achievement_description || ''
            }, {
                onConflict: 'player_name,achievement_name'
            })
            .select();

        if (error) throw error;

        const isNew = data && data.length > 0;
        res.json({
            message: isNew ? 'Achievement unlocked!' : 'Achievement already unlocked',
            id: isNew ? data[0].id : null,
            new: isNew
        });
    } catch (error) {
        console.error('Error unlocking achievement:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete all scores (for testing)
app.delete('/api/scores/reset', async (req, res) => {
    try {
        const { error } = await supabase
            .from('scores')
            .delete()
            .neq('id', 0); // Delete all (this works because id is always > 0)

        if (error) throw error;
        res.json({ message: 'All scores deleted' });
    } catch (error) {
        console.error('Error deleting scores:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', database: 'Supabase' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  /api/scores - Get top scores`);
    console.log(`   GET  /api/scores/:playerName - Get player's best score`);
    console.log(`   GET  /api/stats/:playerName - Get player stats`);
    console.log(`   POST /api/scores - Save new score`);
    console.log(`   GET  /api/leaderboard - Get global leaderboard`);
    console.log(`   GET  /api/achievements/:playerName - Get player achievements`);
    console.log(`   POST /api/achievements - Unlock achievement`);
});


