-- Supabase Database Schema for Beam Me Up, Buttercup!!
-- Run this in your Supabase SQL Editor

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for players
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- Enable Row Level Security for players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow public read access to players
CREATE POLICY "Allow public read access" ON players
    FOR SELECT
    USING (true);

-- Allow public insert/update access to players
CREATE POLICY "Allow public insert access" ON players
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access" ON players
    FOR UPDATE
    USING (true);

-- Scores table with comprehensive stats
CREATE TABLE IF NOT EXISTS scores (
    id BIGSERIAL PRIMARY KEY,
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_player_name ON scores(player_name);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a game leaderboard)
-- Allow anyone to read scores
CREATE POLICY "Allow public read access" ON scores
    FOR SELECT
    USING (true);

-- Allow anyone to insert scores (you might want to add rate limiting in production)
CREATE POLICY "Allow public insert access" ON scores
    FOR INSERT
    WITH CHECK (true);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_name, achievement_name)
);

-- Create indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_player_name ON achievements(player_name);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked_at ON achievements(unlocked_at DESC);

-- Enable Row Level Security for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Allow public read access to achievements
CREATE POLICY "Allow public read access" ON achievements
    FOR SELECT
    USING (true);

-- Allow public insert access to achievements
CREATE POLICY "Allow public insert access" ON achievements
    FOR INSERT
    WITH CHECK (true);

-- Game sessions table (for detailed tracking)
CREATE TABLE IF NOT EXISTS game_sessions (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    final_score INTEGER,
    final_level INTEGER,
    session_data TEXT
);

-- Create indexes for game_sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_name ON game_sessions(player_name);
CREATE INDEX IF NOT EXISTS idx_game_sessions_start_time ON game_sessions(start_time DESC);

-- Enable Row Level Security for game_sessions
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to game_sessions
CREATE POLICY "Allow public read access" ON game_sessions
    FOR SELECT
    USING (true);

-- Allow public insert access to game_sessions
CREATE POLICY "Allow public insert access" ON game_sessions
    FOR INSERT
    WITH CHECK (true);

-- Optional: Create a view for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    player_name,
    MAX(score) as best_score,
    MAX(level) as max_level,
    SUM(kills) as total_kills,
    COUNT(*) as games_played,
    AVG(accuracy) as avg_accuracy,
    MAX(created_at) as last_played
FROM scores
GROUP BY player_name
ORDER BY best_score DESC
LIMIT 100;
