# Contract Intelligence Platform

Claude-powered chat interface for analyzing Canadian federal government contract spending data. Built for the Agency 2026 Hackathon.

## Quick Start (30 seconds)

### Prerequisites
- Node.js 18+ (verify with `node --version`)
- npm (comes with Node.js)
- ANTHROPIC_API_KEY from [console.anthropic.com](https://console.anthropic.com)

### Run Everything

**Option 1: Automated (Recommended)**
```bash
cd /Users/mohanmadhuv/Documents/v-sync

# Set your API key first
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Run both servers (in parallel)
./start.sh
```

**Option 2: Manual (Two Terminals)**

Terminal 1 - Backend:
```bash
cd /Users/mohanmadhuv/Documents/v-sync/backend
export ANTHROPIC_API_KEY=sk-ant-your-key-here
npm run dev
# Should show: "Contract Intelligence API running on port 3001"
```

Terminal 2 - Frontend:
```bash
cd /Users/mohanmadhuv/Documents/v-sync/frontend
npm start
# Should open browser at http://localhost:3000
```

### First Run
1. Both servers should auto-start with sample data (no real API calls until you chat)
2. Open [http://localhost:3000](http://localhost:3000)
3. Try: "Show me rising costs" or "Who dominates consulting?"

## Architecture

```
contract-intelligence/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── index.js           # Main server
│   │   ├── handlers/          # Request handlers
│   │   │   └── chatHandler.js # Claude integration
│   │   └── services/          # Business logic
│   │       └── contractDataService.js
│   └── package.json
│
├── frontend/                   # React app
│   ├── src/
│   │   ├── App.jsx            # Main app
│   │   └── components/        # React components
│   │       ├── ChatInterface.jsx
│   │       ├── MessageBubble.jsx
│   │       └── DataSummary.jsx
│   └── public/
│       └── index.html
│
└── CLAUDE.md                  # Project specification
```

## API Endpoints

### POST /chat
Send a message and get Claude's analysis with insights.

**Request:**
```json
{
  "message": "Show me rising costs",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "message": "...",
  "insights": [...],
  "suggestedActions": [...],
  "dataReferences": {...},
  "visualization": null
}
```

### GET /data/summary
Get overview of the contract dataset.

### GET /data/cost-trends
Get cost growth trends by category.

### GET /data/vendor-concentration
Get vendor market share by category.

### GET /data/benchmarks
Get contract rate benchmarks by category.

## Data Architecture

The service processes aggregated contract data rather than raw contracts:

- **Contract Summaries**: Spend by category, vendor, department, year
- **Vendor Concentration**: Market share trends
- **Cost Benchmarks**: Rate medians + ranges by category
- **Category Trends**: Year-over-year growth rates

**Key Principle**: Raw contract data stays on the server. Claude receives only aggregated views and user queries.

## MVP Features

### Must-Have (S1 & S2)
- **S1**: Catch rising costs - show which categories got more expensive
- **S2**: Know vendor concentration - see when one vendor dominates

### Should-Have (S3)
- **S3**: Challenge inflated rates - benchmark contract rates

### Nice-to-Have (S4)
- **S4**: Explain spend drivers - decompose volume/price/concentration effects

## Claude Integration

The backend uses Claude Opus 4.7 with:
- Contract data as system context
- User queries as the actual messages
- Prompt caching for efficient repeated analysis
- Structured responses with insights, actions, and rationale

## Testing

Start both servers:

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```

Then ask Claude questions like:
- "Show me rising costs"
- "Who controls management consulting?"
- "Are contract rates competitive?"

## Environment Variables

**Backend** (.env):
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
NODE_ENV=development
```

**Frontend** (automatic via package.json):
```
REACT_APP_API_URL=http://localhost:3001
```

## Project Documentation

See CLAUDE.md for:
- Full problem statement and user context
- Government challenges (GC1-GC4)
- User stories (S1-S4, A1-A2)
- Data architecture details
- Success metrics

## Data Source

Uses Canadian Government Open Data portal contract disclosures:
https://open.canada.ca/data/

(Sample data included for development.)

## License

MIT
