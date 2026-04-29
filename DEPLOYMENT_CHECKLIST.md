# Render Deployment Checklist

## Pre-Deployment

- [ ] GitHub repository is up to date with all changes
- [ ] All modified files committed and pushed:
  - [ ] `backend/db.py` (PostgreSQL version)
  - [ ] `backend/queries.py` (PostgreSQL SQL)
  - [ ] `backend/chat.py` (Bedrock integration)
  - [ ] `backend/requirements.txt` (updated dependencies)
  - [ ] `load_data.py` (data loader)
  - [ ] Documentation files

## Render Setup

### 1. PostgreSQL Database
- [ ] Created PostgreSQL service in Render
- [ ] Name: `contract-intelligence-db`
- [ ] Region: Oregon (US West)
- [ ] Plan: Starter ($7/month) or higher
- [ ] Copied **Internal Database URL**
- [ ] Copied **External Database URL** (for local data loading)

### 2. Backend Web Service
- [ ] Created Web Service in Render
- [ ] Connected to GitHub repository
- [ ] Name: `contract-intelligence-api`
- [ ] Environment: Python 3
- [ ] Root Directory: `backend`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Region: Oregon (US West) - same as database
- [ ] Plan: Starter ($7/month) or higher

#### Environment Variables Set:
- [ ] `DATABASE_URL` = (Internal Database URL from Step 1)
- [ ] `AWS_REGION` = `us-west-2`
- [ ] `BEDROCK_API_KEY` = `ABSKQmVkcm9ja0FQSUtleS0yMmo5LWF0LTg2NjQ4MTE4MjYxNDowU2hQekc4SmNEQ25GTEdDWENGZUFpdmIrVFFpNGFDM3U4bytlcEgxVGFDU1pkT2QvSlhpWmdtS1U2dz0=`

- [ ] Service deployed successfully
- [ ] Copied backend URL (e.g., `https://contract-intelligence-api.onrender.com`)

### 3. Data Loading
- [ ] Installed dependencies locally: `pip install psycopg2-binary requests`
- [ ] Set DATABASE_URL environment variable (External URL)
- [ ] Ran `python load_data.py`
- [ ] Data loading completed successfully
- [ ] Verified record count: ~813,557 contracts
- [ ] Indexes created automatically

### 4. Frontend Static Site
- [ ] Created Static Site in Render
- [ ] Connected to GitHub repository
- [ ] Name: `contract-intelligence-ui`
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist`

#### Environment Variables Set:
- [ ] `VITE_API_URL` = (Backend URL from Step 2)

- [ ] Site deployed successfully
- [ ] Copied frontend URL (e.g., `https://contract-intelligence-ui.onrender.com`)

## Testing

### Backend API Tests
- [ ] Health check: `curl https://your-api.onrender.com/api/overview`
  - [ ] Returns JSON with contract statistics
  - [ ] Response time < 1 second

- [ ] What is bought: `curl https://your-api.onrender.com/api/what-is-bought`
  - [ ] Returns commodity breakdown
  - [ ] Returns top EOC codes

- [ ] Topline trend: `curl https://your-api.onrender.com/api/topline-trend`
  - [ ] Returns yearly fiscal data
  - [ ] Years 2016-2026 present

- [ ] AI Chat test:
```bash
curl -X POST https://your-api.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the top 5 vendors?", "history": []}'
```
  - [ ] Returns SQL query
  - [ ] Returns data results
  - [ ] Returns natural language answer

### Frontend Tests
- [ ] Visit frontend URL in browser
- [ ] Dashboard loads without errors
- [ ] Overview statistics display correctly
- [ ] Charts render properly
- [ ] Year filter works (2015-2025)
- [ ] Category breakdown shows data
- [ ] Vendor concentration displays
- [ ] Geographic map loads
- [ ] Contract table populates
- [ ] AI chat interface accessible
- [ ] AI chat responds to questions

### AI Chat Functionality
Test these questions:
- [ ] "What are the top 5 vendors by spending?"
- [ ] "Show me IT spending trends over the last 5 years"
- [ ] "Which department spends the most on consulting?"
- [ ] "What's the average contract value in 2024?"
- [ ] "How many contracts were awarded to small businesses?"

Each should:
- [ ] Generate valid PostgreSQL SQL
- [ ] Execute without errors
- [ ] Return relevant data
- [ ] Provide natural language summary

## Performance Checks

- [ ] Backend response times acceptable (<3s for most queries)
- [ ] Frontend loads quickly (<5s initial load)
- [ ] No errors in Render logs
- [ ] Database queries use indexes (check with EXPLAIN)
- [ ] Memory usage within limits

## Security Verification

- [ ] No credentials in code or logs
- [ ] HTTPS enforced on all services
- [ ] CORS configured correctly
- [ ] Database uses internal URL
- [ ] Environment variables set correctly
- [ ] AI chat only generates SELECT queries

## Documentation

- [ ] README_RENDER.md reviewed
- [ ] RENDER_DEPLOYMENT.md available for team
- [ ] MIGRATION_SUMMARY.md documents changes
- [ ] Environment variables documented

## Monitoring Setup

- [ ] Render dashboard bookmarked
- [ ] Email alerts configured (optional)
- [ ] Health check endpoint monitored
- [ ] Error tracking enabled

## Cost Verification

- [ ] PostgreSQL plan confirmed: $____/month
- [ ] Web service plan confirmed: $____/month
- [ ] Static site: Free
- [ ] AWS Bedrock usage estimated: $____/month
- [ ] Total monthly cost: $____/month

## Post-Deployment

- [ ] Team notified of new URLs
- [ ] Old BigQuery/GCP services can be decommissioned
- [ ] Backup strategy documented
- [ ] Data refresh schedule planned
- [ ] Custom domain configured (optional)

## Rollback Plan (If Needed)

- [ ] BigQuery version preserved in separate branch
- [ ] Can revert to GCP deployment if issues arise
- [ ] Database backup available
- [ ] Team knows rollback procedure

## Success Criteria

✅ All API endpoints return valid data
✅ Frontend displays analytics correctly  
✅ AI chat generates and executes SQL
✅ Response times acceptable
✅ No errors in logs
✅ Monthly cost within budget
✅ Team can access and use platform

## Notes

**Deployment Date**: _______________
**Deployed By**: _______________
**Backend URL**: _______________
**Frontend URL**: _______________
**Database**: _______________

**Issues Encountered**:
- 
- 
- 

**Resolutions**:
- 
- 
- 

## Next Steps

- [ ] Monitor for 24 hours
- [ ] Set up automated data refresh
- [ ] Configure custom domain
- [ ] Add monitoring/alerting
- [ ] Document any custom configurations
- [ ] Train team on new platform

---

**Deployment Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Overall Status**: _____________
