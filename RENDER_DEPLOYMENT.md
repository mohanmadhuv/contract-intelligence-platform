# Render Deployment Guide with AI Chat

## Overview
This guide explains how to deploy the Contract Intelligence Platform on Render using PostgreSQL and Amazon Bedrock for AI chat.

## Architecture Changes

### Database: BigQuery → PostgreSQL
- ✅ All queries converted to PostgreSQL syntax
- ✅ Connection via DATABASE_URL environment variable
- ✅ Compatible with Render PostgreSQL service

### AI Chat: Vertex AI → Amazon Bedrock
- ✅ Using Claude 3.5 Sonnet via AWS Bedrock
- ✅ Generates PostgreSQL queries from natural language
- ✅ Executes queries and provides intelligent summaries

## Prerequisites

1. **Render Account**: [Sign up at render.com](https://render.com)
2. **AWS Bedrock Access**: Already configured (us-west-2)
3. **GitHub Repository**: Your code repository

## Deployment Steps

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name**: `contract-intelligence-db`
   - **Database**: `contracts_db`
   - **Region**: Oregon (US West) - closest to AWS us-west-2
   - **Plan**: Starter ($7/month recommended for 800K+ records)
4. Click **Create Database**
5. **Copy the Internal Database URL** (you'll need this)

### Step 2: Deploy Backend API

1. In Render Dashboard, click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `contract-intelligence-api`
   - **Environment**: `Python 3`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Starter ($7/month)

4. **Add Environment Variables**:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | (Paste Internal Database URL from Step 1) |
   | `AWS_REGION` | `us-west-2` |
   | `BEDROCK_API_KEY` | `ABSKQmVkcm9ja0FQSUtleS0yMmo5LWF0LTg2NjQ4MTE4MjYxNDowU2hQekc4SmNEQ25GTEdDWENGZUFpdmIrVFFpNGFDM3U4bytlcEgxVGFDU1pkT2QvSlhpWmdtS1U2dz0=` |

5. Click **Create Web Service**

### Step 3: Load Data into PostgreSQL

Once your backend is deployed, you need to load the contract data.

#### Option A: Load from Local Machine

```bash
# Clone your repository
git clone <your-repo-url>
cd contract-intelligence-platform

# Install dependencies
pip install psycopg2-binary requests

# Set the DATABASE_URL (use External Database URL from Render)
export DATABASE_URL="postgresql://user:password@host/database"

# Run the data loader
python load_data.py
```

This will:
- Fetch 813,557 contracts from CKAN API (last 10 years)
- Create the `contracts` table with proper schema
- Load all data with indexes
- Take approximately 15-30 minutes

#### Option B: Load via Render Shell

1. Go to your backend service in Render Dashboard
2. Click the **Shell** tab
3. Run:
```bash
cd /opt/render/project/src
python load_data.py
```

### Step 4: Deploy Frontend

1. In Render Dashboard, click **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `contract-intelligence-ui`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variable**:
   - **VITE_API_URL**: `https://contract-intelligence-api.onrender.com` (replace with your actual backend URL)

5. Click **Create Static Site**

### Step 5: Verify Deployment

1. **Check Backend Health**:
   - Visit: `https://contract-intelligence-api.onrender.com/api/overview`
   - Should return JSON with contract statistics

2. **Check Frontend**:
   - Visit: `https://contract-intelligence-ui.onrender.com`
   - Dashboard should load with data visualizations

3. **Test AI Chat**:
   - Click on the AI chat feature
   - Ask: "What are the top 5 vendors by spending in 2024?"
   - Should generate SQL, execute it, and provide a natural language answer

## Environment Variables Reference

### Backend Service

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | `postgresql://user:pass@host/db` |
| `AWS_REGION` | AWS Bedrock region | ✅ Yes | `us-west-2` |
| `BEDROCK_API_KEY` | Bedrock API credentials | ✅ Yes | `ABSK...` |
| `PORT` | Server port (auto-set by Render) | ✅ Yes | `10000` |

### Frontend Static Site

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API base URL | ✅ Yes | `https://your-api.onrender.com` |

## Data Loading Details

The `load_data.py` script:
- **Source**: Open Canada CKAN API
- **Dataset**: Contracts over $10,000
- **Records**: ~813,557 (last 10 years: 2016-2026)
- **Size**: ~1.4GB raw JSON
- **Time**: 15-30 minutes
- **Creates**: Table + 6 indexes for performance

### Data Schema

```sql
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    reference_number TEXT,
    procurement_id TEXT,
    vendor_name TEXT,
    vendor_postal_code TEXT,
    contract_date TEXT,
    contract_value TEXT,
    original_value TEXT,
    amendment_value TEXT,
    economic_object_code TEXT,
    commodity_type TEXT,
    description_en TEXT,
    -- ... 43 columns total
);
```

## AI Chat Feature

### How It Works

1. **User asks a question** in natural language
   - Example: "Show me IT spending trends over the last 5 years"

2. **Claude 3.5 Sonnet generates PostgreSQL query**
   ```sql
   SELECT 
     EXTRACT(YEAR FROM contract_date::date) AS year,
     ROUND(SUM(CAST(contract_value AS FLOAT)), 0) AS total_spend
   FROM contracts
   WHERE economic_object_code IN ('0433', '0432', '0321')
     AND EXTRACT(YEAR FROM contract_date::date) BETWEEN 2019 AND 2024
   GROUP BY year
   ORDER BY year;
   ```

3. **Query executes against PostgreSQL**

4. **Claude generates natural language summary**
   - "IT spending has grown from $2.3B CAD in 2019 to $3.1B CAD in 2024, representing a 35% increase..."

### Supported Query Types

- ✅ Spending trends by year, category, vendor
- ✅ Top vendors by spend or contract count
- ✅ Amendment analysis (cost overruns)
- ✅ Geographic distribution
- ✅ Department-level spending
- ✅ Procurement method analysis (competitive vs sole-source)
- ✅ Commodity type breakdowns

## Troubleshooting

### Issue: "relation 'contracts' does not exist"
**Solution**: Run `load_data.py` to create and populate the table.

### Issue: "AI assistant is currently unavailable"
**Solution**: 
- Verify `BEDROCK_API_KEY` is set correctly in Render
- Check `AWS_REGION` is `us-west-2`
- Check Render logs for Bedrock errors

### Issue: "Query execution error"
**Solution**: 
- The AI generated invalid SQL
- Check backend logs for the actual SQL query
- The model will learn from context - try rephrasing your question

### Issue: Frontend shows "Failed to fetch"
**Solution**: 
- Verify `VITE_API_URL` points to your backend
- Check CORS is enabled in `backend/main.py` (already configured)
- Ensure backend service is running

### Issue: Slow query performance
**Solution**: 
- Upgrade PostgreSQL plan (more RAM/CPU)
- Check indexes exist: `\d contracts` in psql
- Consider adding custom indexes for frequent queries

### Issue: Data load fails midway
**Solution**: 
- Check internet connection stability
- The script will skip if data already exists
- Delete partial data: `DROP TABLE contracts;` then retry

## Cost Breakdown

### Render Services

| Service | Plan | Cost |
|---------|------|------|
| PostgreSQL | Starter (10GB) | $7/month |
| Backend API | Starter (512MB) | $7/month |
| Frontend | Static Site | Free |
| **Total Render** | | **$14/month** |

### AWS Bedrock

| Model | Pricing | Estimated Cost |
|-------|---------|----------------|
| Claude 3.5 Sonnet | $3 per 1M input tokens | ~$5-10/month |
|  | $15 per 1M output tokens | (depends on usage) |

**Total Monthly Cost**: ~$20-25/month

### Free Tier Limitations

Render Free Tier:
- ❌ Services spin down after 15 min inactivity
- ❌ PostgreSQL limited to 1GB (not enough for full dataset)
- ❌ 750 hours/month (not always-on)

**Recommendation**: Use Starter tier for production deployment.

## Performance Optimization

### Database Indexes

Already created by `load_data.py`:
```sql
CREATE INDEX idx_contracts_date ON contracts(contract_date);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_name);
CREATE INDEX idx_contracts_commodity ON contracts(commodity_type);
CREATE INDEX idx_contracts_eoc ON contracts(economic_object_code);
CREATE INDEX idx_contracts_period ON contracts(reporting_period);
CREATE INDEX idx_contracts_value ON contracts(contract_value);
```

### Query Optimization Tips

1. **Always filter by date range** - reduces scan size
2. **Use LIMIT** - especially for large result sets
3. **Avoid SELECT *** - specify needed columns
4. **Use aggregations** - SUM, COUNT, AVG instead of row-by-row

## Monitoring

### Render Dashboard

- **Metrics**: CPU, Memory, Response time
- **Logs**: Real-time application logs
- **Alerts**: Set up email notifications

### Health Check Endpoints

- Backend: `GET /api/overview`
- Returns: Contract statistics (should be fast, <500ms)

## Backup Strategy

### Database Backups

Render PostgreSQL includes:
- **Automatic daily backups** (retained based on plan)
- **Point-in-time recovery** (Starter plan and above)

### Manual Backup

```bash
# Export data
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Updating Data

To refresh with latest contracts:

```bash
# Connect to database
export DATABASE_URL="your_render_postgres_url"

# Clear existing data
psql $DATABASE_URL -c "DROP TABLE contracts;"

# Reload
python load_data.py
```

**Note**: This will cause ~30 minutes of downtime. Consider blue-green deployment for zero-downtime updates.

## Security Best Practices

1. ✅ **Never commit credentials** - use environment variables
2. ✅ **Use Internal Database URL** for backend (faster, more secure)
3. ✅ **HTTPS only** - Render provides free SSL
4. ✅ **CORS configured** - only allow your frontend domain
5. ✅ **Read-only SQL** - AI chat only generates SELECT queries

## Next Steps

1. ✅ Deploy and load data
2. ✅ Test all analytics views
3. ✅ Test AI chat with various questions
4. ⏳ Set up custom domain (optional)
5. ⏳ Configure monitoring alerts
6. ⏳ Set up automated data refresh (cron job)

## Support Resources

- **Render Docs**: https://render.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **AWS Bedrock Docs**: https://docs.aws.amazon.com/bedrock/
- **Claude API**: https://docs.anthropic.com/

## Quick Reference Commands

```bash
# Check backend health
curl https://your-api.onrender.com/api/overview

# Test AI chat
curl -X POST https://your-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the top vendors?", "history": []}'

# Connect to database
psql $DATABASE_URL

# Check table size
psql $DATABASE_URL -c "SELECT COUNT(*) FROM contracts;"

# View recent contracts
psql $DATABASE_URL -c "SELECT * FROM contracts ORDER BY contract_date DESC LIMIT 5;"
```
