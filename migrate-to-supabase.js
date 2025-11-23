import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials!');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dbPath = path.join(process.cwd(), 'game.db');

// Promisify SQLite functions
function promisifyDb(db) {
    return {
        all: promisify(db.all.bind(db)),
        get: promisify(db.get.bind(db)),
        run: promisify(db.run.bind(db)),
        close: promisify(db.close.bind(db))
    };
}

async function migrateData() {
    console.log('🚀 Starting migration from SQLite to Supabase...\n');

    // Open SQLite database
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('❌ Error opening SQLite database:', err.message);
            process.exit(1);
        }
    });

    const dbAsync = promisifyDb(db);

    try {
        // 1. Migrate players table
        console.log('📦 Migrating players...');
        const players = await dbAsync.all('SELECT * FROM players');
        if (players.length > 0) {
            const playersData = players.map(p => ({
                name: p.name,
                created_at: p.created_at || new Date().toISOString(),
                last_played: p.last_played || new Date().toISOString()
            }));

            const { data: insertedPlayers, error: playersError } = await supabase
                .from('players')
                .upsert(playersData, { onConflict: 'name' })
                .select();

            if (playersError) {
                console.error('❌ Error migrating players:', playersError);
            } else {
                console.log(`✅ Migrated ${insertedPlayers.length} players`);
            }
        } else {
            console.log('ℹ️  No players to migrate');
        }

        // 2. Migrate scores table
        console.log('\n📦 Migrating scores...');
        const scores = await dbAsync.all('SELECT * FROM scores');
        if (scores.length > 0) {
            const scoresData = scores.map(s => ({
                player_name: s.player_name,
                score: s.score,
                level: s.level,
                kills: s.kills,
                playtime: s.playtime,
                shots_fired: s.shots_fired || 0,
                shots_hit: s.shots_hit || 0,
                accuracy: s.accuracy || 0,
                damage_dealt: s.damage_dealt || 0,
                damage_taken: s.damage_taken || 0,
                bosses_defeated: s.bosses_defeated || 0,
                boss_types_defeated: s.boss_types_defeated || '',
                powerups_collected: s.powerups_collected || 0,
                favorite_weapon: s.favorite_weapon || 'normal',
                rapid_fire_used: s.rapid_fire_used || 0,
                double_shot_used: s.double_shot_used || 0,
                shield_used: s.shield_used || 0,
                shotgun_used: s.shotgun_used || 0,
                laser_used: s.laser_used || 0,
                missile_used: s.missile_used || 0,
                pulse_used: s.pulse_used || 0,
                health_collected: s.health_collected || 0,
                dashes_used: s.dashes_used || 0,
                max_combo: s.max_combo || 0,
                perfect_levels: s.perfect_levels || 0,
                enemy_types_killed: s.enemy_types_killed || '',
                created_at: s.created_at || new Date().toISOString()
            }));

            // Insert in batches to avoid timeout
            const batchSize = 100;
            let migrated = 0;
            for (let i = 0; i < scoresData.length; i += batchSize) {
                const batch = scoresData.slice(i, i + batchSize);
                const { data, error } = await supabase
                    .from('scores')
                    .insert(batch)
                    .select();

                if (error) {
                    console.error(`❌ Error migrating scores batch ${i / batchSize + 1}:`, error);
                } else {
                    migrated += batch.length;
                    console.log(`   Migrated ${migrated}/${scoresData.length} scores...`);
                }
            }
            console.log(`✅ Migrated ${migrated} scores`);
        } else {
            console.log('ℹ️  No scores to migrate');
        }

        // 3. Migrate achievements table
        console.log('\n📦 Migrating achievements...');
        const achievements = await dbAsync.all('SELECT * FROM achievements');
        if (achievements.length > 0) {
            const achievementsData = achievements.map(a => ({
                player_name: a.player_name,
                achievement_name: a.achievement_name,
                achievement_description: a.achievement_description || '',
                unlocked_at: a.unlocked_at || new Date().toISOString()
            }));

            const { data: insertedAchievements, error: achievementsError } = await supabase
                .from('achievements')
                .upsert(achievementsData, { onConflict: 'player_name,achievement_name' })
                .select();

            if (achievementsError) {
                console.error('❌ Error migrating achievements:', achievementsError);
            } else {
                console.log(`✅ Migrated ${insertedAchievements.length} achievements`);
            }
        } else {
            console.log('ℹ️  No achievements to migrate');
        }

        // 4. Migrate game_sessions table
        console.log('\n📦 Migrating game_sessions...');
        const sessions = await dbAsync.all('SELECT * FROM game_sessions');
        if (sessions.length > 0) {
            const sessionsData = sessions.map(s => ({
                player_name: s.player_name,
                start_time: s.start_time || new Date().toISOString(),
                end_time: s.end_time || null,
                final_score: s.final_score || null,
                final_level: s.final_level || null,
                session_data: s.session_data || null
            }));

            const { data: insertedSessions, error: sessionsError } = await supabase
                .from('game_sessions')
                .insert(sessionsData)
                .select();

            if (sessionsError) {
                console.error('❌ Error migrating game_sessions:', sessionsError);
            } else {
                console.log(`✅ Migrated ${insertedSessions.length} game sessions`);
            }
        } else {
            console.log('ℹ️  No game sessions to migrate');
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Players: ${players.length}`);
        console.log(`   - Scores: ${scores.length}`);
        console.log(`   - Achievements: ${achievements.length}`);
        console.log(`   - Game Sessions: ${sessions.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await dbAsync.close();
    }
}

// Run migration
migrateData().catch(console.error);

