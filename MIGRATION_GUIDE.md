# 🚀 Migration Guide: SQLite to Supabase

This guide will help you migrate your game data from SQLite to Supabase.

## Prerequisites

1. **Supabase Project**: You need a Supabase project set up
   - Go to [supabase.com](https://supabase.com) and create a project
   - Get your project URL and anon key from Project Settings → API

2. **Environment Variables**: Create a `.env` file in the `react-shooter-game` directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 1: Set Up Supabase Database Schema

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Open the file `supabase-schema.sql` in this directory
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Verify all tables are created:
   - `players`
   - `scores`
   - `achievements`
   - `game_sessions`

## Step 2: Install Dependencies

Make sure you have all required packages:

```bash
cd react-shooter-game
npm install
```

## Step 3: Run the Migration Script

The migration script will:
- Read all data from your SQLite database (`game.db`)
- Export it to Supabase
- Preserve all relationships and data

```bash
npm run migrate
```

The script will show progress for each table:
- ✅ Players migrated
- ✅ Scores migrated
- ✅ Achievements migrated
- ✅ Game sessions migrated

## Step 4: Verify Migration

1. **Check Supabase Dashboard**:
   - Go to **Table Editor** in Supabase
   - Verify data appears in all tables
   - Check row counts match your SQLite database

2. **Test the API**:
   - Start the Supabase server: `npm run server:supabase`
   - Test endpoints:
     ```bash
     curl http://localhost:3001/api/scores
     curl http://localhost:3001/api/leaderboard
     ```

## Step 5: Switch to Supabase Server

Once migration is complete, you can:

1. **Option A: Use the new Supabase server** (Recommended)
   ```bash
   npm run server:supabase
   ```

2. **Option B: Replace the old server**
   - Backup `server.js`: `cp server.js server.js.backup`
   - Replace with Supabase version: `cp server-supabase.js server.js`
   - Update package.json script if needed

## Step 6: Update Frontend (if needed)

The frontend should already be configured to use Supabase via `src/utils/api.js` and `src/utils/supabase.js`.

Make sure your `.env` file has the correct Supabase credentials, and restart your dev server:

```bash
npm run dev
```

## Troubleshooting

### Migration Script Errors

**"Missing Supabase credentials"**
- Check your `.env` file exists and has correct values
- Make sure variables are named: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**"Error opening SQLite database"**
- Make sure `game.db` exists in the `react-shooter-game` directory
- Check file permissions

**"Error migrating scores"**
- Check Supabase table schema matches `supabase-schema.sql`
- Verify RLS policies allow inserts
- Check Supabase logs in dashboard

### Data Issues

**Missing data after migration**
- Check Supabase logs for errors
- Verify RLS policies allow public inserts
- Re-run migration (it uses `upsert` so it's safe to run multiple times)

**Duplicate data**
- The migration uses `upsert` for players and achievements (prevents duplicates)
- Scores are inserted (duplicates are expected if you run migration multiple times)
- You can clean up duplicates in Supabase dashboard if needed

## What Gets Migrated

✅ **Players Table**
- All player records
- Created and last played timestamps

✅ **Scores Table**
- All score records with full stats
- Combat stats, boss stats, power-up stats, etc.

✅ **Achievements Table**
- All unlocked achievements
- Achievement descriptions and unlock timestamps

✅ **Game Sessions Table**
- All game session records
- Session data and timestamps

## After Migration

1. **Keep SQLite backup**: Don't delete `game.db` immediately - keep it as a backup
2. **Test thoroughly**: Play the game and verify scores save correctly
3. **Monitor Supabase**: Check the dashboard for any errors
4. **Update documentation**: Update any docs that reference SQLite

## Next Steps

- ✅ Data is now in Supabase
- ✅ Frontend uses Supabase directly (no server needed for basic operations)
- ✅ Server can use Supabase for additional features
- 🎯 Consider removing SQLite dependency if no longer needed

## Need Help?

- Check Supabase logs in dashboard
- Review migration script output for specific errors
- Verify your Supabase project settings and RLS policies


