import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./game.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Create tables
function initializeDatabase() {
    // Players table
    db.run(`
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_played DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating players table:', err);
    });

    // Scores table with comprehensive stats
    db.run(`
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            level INTEGER NOT NULL,
            kills INTEGER NOT NULL,
            playtime INTEGER NOT NULL,
            
            -- Combat stats
            shots_fired INTEGER DEFAULT 0,
            shots_hit INTEGER DEFAULT 0,
            accuracy REAL DEFAULT 0,
            damage_dealt INTEGER DEFAULT 0,
            damage_taken INTEGER DEFAULT 0,
            
            -- Boss stats
            bosses_defeated INTEGER DEFAULT 0,
            boss_types_defeated TEXT DEFAULT '',
            
            -- Power-up stats
            powerups_collected INTEGER DEFAULT 0,
            favorite_weapon TEXT DEFAULT 'normal',
            rapid_fire_used INTEGER DEFAULT 0,
            double_shot_used INTEGER DEFAULT 0,
            shield_used INTEGER DEFAULT 0,
            shotgun_used INTEGER DEFAULT 0,
            laser_used INTEGER DEFAULT 0,
            missile_used INTEGER DEFAULT 0,
            pulse_used INTEGER DEFAULT 0,
            health_collected INTEGER DEFAULT 0,
            
            -- Survival stats
            dashes_used INTEGER DEFAULT 0,
            max_combo INTEGER DEFAULT 0,
            perfect_levels INTEGER DEFAULT 0,
            
            -- Enemy stats
            enemy_types_killed TEXT DEFAULT '',
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating scores table:', err);
        else {
            // Create indexes for performance
            db.run(`CREATE INDEX IF NOT EXISTS idx_scores_player_name ON scores(player_name)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)`);
        }
    });

    // Achievements table
    db.run(`
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            achievement_name TEXT NOT NULL,
            achievement_description TEXT,
            unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(player_name, achievement_name)
        )
    `, (err) => {
        if (err) console.error('Error creating achievements table:', err);
    });

    // Game sessions table (for detailed tracking)
    db.run(`
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            final_score INTEGER,
            final_level INTEGER,
            session_data TEXT,
            FOREIGN KEY (player_name) REFERENCES players(name)
        )
    `, (err) => {
        if (err) console.error('Error creating game_sessions table:', err);
        else console.log('✅ Database tables initialized');
    });
}

// API Routes

// Get all scores (leaderboard)
app.get('/api/scores', (req, res) => {
    const limit = req.query.limit || 10;

    db.all(
        `SELECT * FROM scores ORDER BY score DESC LIMIT ?`,
        [limit],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ scores: rows });
            }
        }
    );
});

// Get player's best score
app.get('/api/scores/:playerName', (req, res) => {
    const { playerName } = req.params;

    db.get(
        `SELECT * FROM scores WHERE player_name = ? ORDER BY score DESC LIMIT 1`,
        [playerName],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ score: row || null });
            }
        }
    );
});

// Get player stats
app.get('/api/stats/:playerName', (req, res) => {
    const { playerName } = req.params;

    db.all(
        `SELECT 
            COUNT(*) as games_played,
            MAX(score) as high_score,
            SUM(kills) as total_kills,
            AVG(score) as average_score,
            MAX(level) as max_level,
            SUM(playtime) as total_playtime
         FROM scores 
         WHERE player_name = ?`,
        [playerName],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ stats: rows[0] });
            }
        }
    );
});

// Save a new score with comprehensive stats
app.post('/api/scores', (req, res) => {
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

    db.run(
        `INSERT INTO scores (
            player_name, score, level, kills, playtime,
            shots_fired, shots_hit, accuracy, damage_dealt, damage_taken,
            bosses_defeated, boss_types_defeated,
            powerups_collected, favorite_weapon,
            rapid_fire_used, double_shot_used, shield_used, shotgun_used,
            laser_used, missile_used, pulse_used, health_collected,
            dashes_used, max_combo, perfect_levels,
            enemy_types_killed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            player_name, score, level || 1, kills || 0, playtime || 0,
            shots_fired || 0, shots_hit || 0, accuracy || 0, damage_dealt || 0, damage_taken || 0,
            bosses_defeated || 0, boss_types_defeated || '',
            powerups_collected || 0, favorite_weapon || 'normal',
            rapid_fire_used || 0, double_shot_used || 0, shield_used || 0, shotgun_used || 0,
            laser_used || 0, missile_used || 0, pulse_used || 0, health_collected || 0,
            dashes_used || 0, max_combo || 0, perfect_levels || 0,
            enemy_types_killed || ''
        ],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({
                    message: 'Score saved successfully',
                    id: this.lastID
                });
            }
        }
    );
});

// Get global leaderboard
app.get('/api/leaderboard', (req, res) => {
    db.all(
        `SELECT 
            player_name,
            MAX(score) as best_score,
            MAX(level) as max_level,
            SUM(kills) as total_kills,
            COUNT(*) as games_played
         FROM scores 
         GROUP BY player_name 
         ORDER BY best_score DESC 
         LIMIT 10`,
        [],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ leaderboard: rows });
            }
        }
    );
});

// Get player achievements
app.get('/api/achievements/:playerName', (req, res) => {
    const { playerName } = req.params;

    db.all(
        `SELECT * FROM achievements WHERE player_name = ? ORDER BY unlocked_at DESC`,
        [playerName],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ achievements: rows });
            }
        }
    );
});

// Unlock achievement
app.post('/api/achievements', (req, res) => {
    const { player_name, achievement_name, achievement_description } = req.body;

    if (!player_name || !achievement_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
        `INSERT OR IGNORE INTO achievements (player_name, achievement_name, achievement_description) 
         VALUES (?, ?, ?)`,
        [player_name, achievement_name, achievement_description || ''],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.json({ message: 'Achievement already unlocked', new: false });
            } else {
                res.json({ message: 'Achievement unlocked!', id: this.lastID, new: true });
            }
        }
    );
});

// Delete all scores (for testing)
app.delete('/api/scores/reset', (req, res) => {
    db.run(`DELETE FROM scores`, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'All scores deleted' });
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
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
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});
