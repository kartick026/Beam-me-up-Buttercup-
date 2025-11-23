# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Beam Me Up Buttercup
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
5. Click "Create new project" (takes ~2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click "Run" or press `Ctrl+Enter`
6. You should see "Success. No rows returned"

## Step 3: Get Your API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure Your App

1. Create a `.env` file in your project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **IMPORTANT**: Add `.env` to `.gitignore` (it should already be there)

## Step 5: Configure for Netlify/Vercel

### For Netlify:
1. Go to your Netlify site settings
2. Navigate to **Site settings** → **Environment variables**
3. Add both variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### For Vercel:
1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add both variables for all environments (Production, Preview, Development)

## Step 6: Test Locally

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Play the game and submit a score
3. Check Supabase dashboard → **Table Editor** → **scores** to see if data appears

## Step 7: Deploy

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Migrate to Supabase database"
   git push
   ```

2. Netlify/Vercel will auto-deploy
3. Test the deployed version!

## Features

✅ **Cloud Database** - No more local SQLite  
✅ **Real-time** - Supabase supports real-time subscriptions  
✅ **Scalable** - Handles thousands of players  
✅ **Free Tier** - 500MB database, 2GB bandwidth/month  
✅ **Automatic Backups** - Daily backups included  

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct keys
- Make sure you're using the **anon public** key, not the service role key
- Restart your dev server after changing `.env`

### Scores not saving
- Check browser console for errors
- Verify the SQL schema ran successfully
- Check Supabase logs in the dashboard

### CORS errors
- Supabase automatically handles CORS for the anon key
- If issues persist, check your Supabase project settings

## Next Steps

- Set up rate limiting to prevent spam
- Add user authentication (Supabase Auth)
- Create real-time leaderboard updates
- Add achievements system
