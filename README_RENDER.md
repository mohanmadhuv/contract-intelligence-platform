# Contract Intelligence Platform - Render Deployment

## 🎯 Quick Start

This platform has been migrated from Google Cloud (BigQuery + Vertex AI) to **Render** (PostgreSQL + AWS Bedrock) for easier deployment.

### What Changed?
- ✅ **Database**: BigQuery → PostgreSQL
- ✅ **AI Chat**: Vertex AI Gemini → AWS Bedrock Claude 3.5 Sonnet
- ✅ **Deployment**: Google Cloud Run → Render
- ✅ **All queries converted** to PostgreSQL syntax
- ✅ **Data loader ready** to fetch 813K+ contracts

## 📋 Prerequisites

1. **Render Account** - [Sign up free](https://render.com)
2. **AWS Bedrock Access** - Already configured (us-west-2)
3. **15-30 minutes** for data loading

## 🚀 Deployment (3 Steps)

### Step 1: Create PostgreSQL Database

```bash
# In Render Dashboard:
New → PostgreSQL
  Name: contract-intelligence-db
  Region: Oregon (US West)
  Plan: Starter ($7/month)
  
# Copy the "Internal Database URL"
```

### Step 2: Deploy Backend API

```bash
# In Render Dashboard:
New → Web Service
  Repository: <your-github-repo>
  Name: contract-intelligence-api
  Root Directory: backend
  Build: pip install -r requirements.txt
  Start: uvicorn main:app --host 0.0.0.0 --port $PORT
  
# Environment Variables:
DATABASE_URL=<paste Internal Database URL>
AWS_REGION=us-west-2
BEDROCK_API_KEY=ABSKQmVkcm9ja0FQSUtleS0yMmo5LWF0LTg2NjQ4MTE4MjYxNDowU2hQekc4SmNEQ25GTEdDWENGZUFpdmIrVFFpNGFDM3U4bytlcEgxVGFDU1pkT2QvSlhpWmdtS1U2dz0=
```

### Step 3: Load Data

```bash
# From your local machine:
git clone <your-repo>
cd contract-intelligence-platform

pip install psycopg2-binary requests

# Use External Database URL from Render
export DATABASE_URL="postgresql://user:pass@host/db"

python load_data.py
# ⏱️ Takes 15-30 minutes
# 📊 Loads 813,557 contracts (last 10 years)
```

### Step 4: Deploy Frontend

```bash
# In Render Dashboard:
New → Static Site
  Repository: <your-github-repo>
  Name: contract-intelligence-ui
  Root Directory: frontend
  Build: npm install && npm run build
  Publish: dist
  
# Environment Variable:
VITE_API_URL=https://contract-intelligence-api.onrender.com
```

## ✅ Verify Deployment

```bash
# Test backend
curl https://your-api.onrender.com/api/overview

# Test AI chat
curl -X POST https://your-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the top 5 vendors?", "history": []}'

# Visit frontend
open https://your-ui.onrender.com
```

## 📊 Data Details

- **Source**: Open Canada CKAN API
- **Dataset**: Federal contracts over $10,000
- **Records**: 813,557 contracts
- **Time Range**: 2016-2026 (last 10 years)
- **Size**: ~1.4GB raw, ~2-3GB with indexes
- **Fields**: 43 columns (vendor, date, value, category, etc.)

## 🤖 AI Chat Feature

Powered by **AWS Bedrock Claude 3.5 Sonnet**:

**Example Questions:**
- "What are the top 5 vendors by spending in 2024?"
- "Show me IT spending trends over the last 5 years"
- "Which department has the highest contract amendments?"
- "What's the average contract value for construction services?"

**How it works:**
1. User asks question in natural language
2. Claude generates PostgreSQL query
3. Query executes against database
4. Claude summarizes results in plain English

## 📁 Project Structure

```
contract-intelligence-platform/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── db.py                # PostgreSQL connection
│   ├── queries.py           # All analytics queries (PostgreSQL)
│   ├── chat.py              # AI chat with Bedrock
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React app
│   │   ├── components/      # UI components
│   │   └── views/           # Dashboard views
│   └── package.json
├── load_data.py             # Data loader (CKAN → PostgreSQL)
├── ckan_loader.py           # Simple CKAN fetcher
├── RENDER_DEPLOYMENT.md     # Detailed deployment guide
└── MIGRATION_SUMMARY.md     # Technical migration details
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `AWS_REGION` | AWS Bedrock region | ✅ |
| `BEDROCK_API_KEY` | Bedrock API credentials | ✅ |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ |

## 💰 Cost Estimate

| Service | Plan | Cost |
|---------|------|------|
| Render PostgreSQL | Starter (10GB) | $7/month |
| Render Web Service | Starter (512MB) | $7/month |
| Render Static Site | Free | $0 |
| AWS Bedrock | Pay-per-use | ~$5-10/month |
| **Total** | | **~$20-25/month** |

## 🐛 Troubleshooting

### "relation 'contracts' does not exist"
→ Run `load_data.py` to create and populate the table

### "AI assistant is currently unavailable"
→ Check `BEDROCK_API_KEY` and `AWS_REGION` in Render dashboard

### "Failed to fetch" in frontend
→ Verify `VITE_API_URL` points to your backend URL

### Slow queries
→ Upgrade PostgreSQL plan or add custom indexes

## 📚 Documentation

- **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** - Complete deployment guide
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Technical migration details
- **[DATA_LOAD_SUMMARY.md](DATA_LOAD_SUMMARY.md)** - Data loading documentation

## 🧪 Testing

```bash
# Test backend configuration
python test_backend_config.py

# Test data loader (dry run)
python ckan_loader.py

# Test API endpoints
curl https://your-api.onrender.com/api/overview
curl https://your-api.onrender.com/api/what-is-bought
curl https://your-api.onrender.com/api/topline-trend
```

## 🔐 Security

- ✅ All credentials via environment variables
- ✅ HTTPS enforced (Render provides free SSL)
- ✅ CORS configured for frontend domain
- ✅ AI chat generates read-only SQL (SELECT only)
- ✅ Database uses internal URL (not exposed)

## 📈 Performance

- **Overview API**: <500ms
- **Trend queries**: <1s
- **Complex aggregations**: 1-3s
- **AI chat**: 2-5s (includes LLM latency)

## 🔄 Updating Data

To refresh with latest contracts:

```bash
export DATABASE_URL="your_render_postgres_url"

# Clear and reload
psql $DATABASE_URL -c "DROP TABLE contracts;"
python load_data.py
```

## 🎓 Features

- **Global Fiscal Year Filter** - Analyze data across FY ranges
- **Time-series Analysis** - Topline spend, volume, unit-cost trends
- **Category Deep-dives** - Decompose spend growth
- **Vendor Concentration** - HHI and market share analysis
- **Geographic Spend** - Provincial heat maps
- **Less for More Watchlist** - Extreme amendment ratios
- **AI Procurement Analyst** - Natural language queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Government of Canada Open Data - [Open Government License](https://open.canada.ca/en/open-government-licence-canada)

## 🆘 Support

- **Render Issues**: [Render Docs](https://render.com/docs)
- **AWS Bedrock**: [Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- **Application Issues**: Create a GitHub issue

---

**Ready to deploy?** Follow the [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) guide!
