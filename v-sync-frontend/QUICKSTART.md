# Contract Intelligence Platform - Quick Start

## ✅ Currently Running

Both servers are active and ready:

```
🎨 Frontend: http://localhost:3000
🚀 Backend:  http://localhost:3001
```

## 🔌 Enable Claude Responses

The app runs with sample data by default. To get Claude's analysis:

```bash
# 1. Get API key from https://console.anthropic.com
# 2. Set the environment variable in your shell:
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# 3. Kill and restart the backend:
cd backend
npm run dev
```

## 🎯 Test It Out

Open [http://localhost:3000](http://localhost:3000) and try:

```
User: "Show me rising costs"
Claude: Analyzes 5-year spending trends by category, 
        highlights which are growing fastest,
        suggests which to investigate
```

## 📁 Project Structure

```
backend/
  ├── src/
  │   ├── index.js              # Express server
  │   ├── handlers/
  │   │   └── chatHandler.js    # Claude integration
  │   └── services/
  │       └── contractDataService.js  # Sample data

frontend/
  ├── src/
  │   ├── App.jsx               # Main app
  │   └── components/
  │       ├── ChatInterface.jsx  # Chat UI
  │       ├── MessageBubble.jsx  # Message display
  │       └── DataSummary.jsx    # Sidebar stats

CLAUDE.md     # Full spec & requirements
README.md     # Setup guide
```

## 🛠 Restart Servers

```bash
# Kill everything
pkill -f "npm run dev"
pkill -f "npm start"

# Restart backend (Terminal 1)
cd backend && npm run dev

# Restart frontend (Terminal 2)
cd frontend && npm start
```

## 📊 What's Included

- **MVP Features**: Cost trends, vendor concentration, rate benchmarking
- **Sample Data**: 3 contract categories, 9+ vendors, 5-year trends
- **Government Context**: Built to meet Canadian procurement oversight needs
- **Architecture**: Server-side data processing + Claude analysis

## 🔗 API Endpoints

- `POST /chat` - Send messages to Claude with contract context
- `GET /health` - Server status check
- `GET /data/summary` - Overview of dataset
- `GET /data/cost-trends` - Spending trends by category
- `GET /data/vendor-concentration` - Market share data
- `GET /data/benchmarks` - Contract rate benchmarks
