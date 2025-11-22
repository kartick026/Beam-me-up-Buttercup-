# 🎮 Beam Me Up Buttercup - Backend & Database

## 🚀 Setup Instructions

### 1. Start the Backend Server

Open a **new terminal** and run:

```bash
npm run server
```

The server will start on `http://localhost:3001`

### 2. Keep Both Running

You need **TWO terminals**:
- Terminal 1: `npm run dev` (Frontend on port 5173)
- Terminal 2: `npm run server` (Backend on port 3001)

---

## 📊 Database Structure

### **SQLite Database: `game.db`**

#### **Table: scores**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| player_name | TEXT | Player's name |
| score | INTEGER | Final score |
| level | INTEGER | Level reached |
| kills | INTEGER | Total kills |
| playtime | INTEGER | Time played (seconds) |
| created_at | DATETIME | Timestamp |

---

## 🔌 API Endpoints

### **GET /api/scores**
Get top scores (leaderboard)
- Query param: `?limit=10` (default: 10)
- Returns: Array of score objects

### **GET /api/scores/:playerName**
Get player's best score
- Returns: Single score object or null

### **GET /api/stats/:playerName**
Get player statistics
- Returns: Object with games_played, high_score, total_kills, etc.

### **POST /api/scores**
Save a new score
- Body: `{ player_name, score, level, kills, playtime }`
- Returns: Success message with ID

### **GET /api/leaderboard**
Get global leaderboard (top 10 players)
- Returns: Array of player stats

### **GET /api/health**
Health check
- Returns: Server status

---

## 💾 Features

✅ **Persistent Storage** - Scores saved in SQLite database  
✅ **Leaderboard** - Global rankings  
✅ **Player Stats** - Track individual performance  
✅ **Offline Fallback** - Uses localStorage if server is down  
✅ **CORS Enabled** - Works with frontend on different port  

---

## 🧪 Testing the API

### Using curl:

```bash
# Save a score
curl -X POST http://localhost:3001/api/scores \
  -H "Content-Type: application/json" \
  -d '{"player_name":"TestPlayer","score":1000,"level":5,"kills":50,"playtime":300}'

# Get leaderboard
curl http://localhost:3001/api/leaderboard

# Get player stats
curl http://localhost:3001/api/stats/TestPlayer
```

### Using browser:
- http://localhost:3001/api/scores
- http://localhost:3001/api/leaderboard
- http://localhost:3001/api/health

---

## 📁 Files

- `server.js` - Express server with API routes
- `game.db` - SQLite database (created automatically)
- `src/utils/api.js` - Frontend API service
- `src/utils/scoreManager.js` - Offline score management

---

## 🔧 Troubleshooting

**Server won't start?**
- Make sure port 3001 is not in use
- Check if dependencies are installed: `npm install`

**Database errors?**
- Delete `game.db` and restart server
- It will recreate the database automatically

**Frontend can't connect?**
- Make sure server is running on port 3001
- Check browser console for CORS errors
- Verify API_URL in `src/utils/api.js`

---

## 🎯 Next Steps

To integrate with the game:
1. Import `gameAPI` in your game component
2. Call `gameAPI.saveScore()` when game ends
3. Display leaderboard using `gameAPI.getLeaderboard()`
4. Show player stats with `gameAPI.getPlayerStats()`

Example:
```javascript
import { gameAPI } from './utils/api';

// Save score when game ends
await gameAPI.saveScore(playerName, score, level, kills, playtime);

// Get leaderboard
const leaderboard = await gameAPI.getLeaderboard();
```
