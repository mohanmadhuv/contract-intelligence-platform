# Contract Intelligence — Build & Deploy Guide

## 1. Check the table name first (run once locally)

```bash
cd "Agency 2026"
pip install psycopg2-binary
python explore_db.py
```

Look at the output for the table name that holds contracts.  
If it's **not** called `contracts`, open `backend/queries.py` and change line 14:
```python
TABLE = "your_actual_table_name"
```

---

## 2. Run locally (development)

### Backend
```bash
cd contract-intelligence/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Test it: http://localhost:8000/api/overview

### Frontend
```bash
cd contract-intelligence/frontend
npm install
npm run dev
```
Open: http://localhost:5173

The Vite dev proxy forwards `/api/*` → `http://localhost:8000` automatically.

---

## 3. Deploy to Render.com

### Step A — Push to GitHub
```bash
cd contract-intelligence
git init
git add .
git commit -m "Initial commit — Contract Intelligence"
# Create a new GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/contract-intelligence.git
git push -u origin main
```

### Step B — Deploy Backend (Web Service)
1. Go to https://render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `DATABASE_URL` = `postgresql://database_database_w2a1_user:JvqVh0msmuBrwgING68S52H0sz3wEEXI@dpg-d7auudv5r7bs738iqh70-b.replica-cyan.oregon-postgres.render.com/database_database_w2a1`
5. Click **Deploy** — takes ~2 min
6. Note your API URL: `https://contract-intelligence-api.onrender.com`

### Step C — Deploy Frontend (Static Site)
1. Go to Render → **New** → **Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Environment Variables:
   - `VITE_API_URL` = `https://contract-intelligence-api.onrender.com`
5. Click **Deploy** — takes ~2 min
6. Your app is live at the static site URL!

---

## 4. If the table name is different

After running `explore_db.py`, if you see a table called e.g. `proactive_contracts`:

```python
# backend/queries.py  line 14
TABLE = "proactive_contracts"
```

If the **column names** also differ, update the column references in `queries.py`.
All column names are documented at the top of that file.

---

## 5. If the DB has no data — load from CKAN

The Open Canada CKAN API is publicly accessible. Run this to load data:

```bash
pip install requests psycopg2-binary
python load_data.py    # see load_data.py in this folder
```

`load_data.py` fetches from:
```
https://open.canada.ca/data/en/api/3/action/datastore_search
  ?resource_id=fac950c0-00d5-4ec1-a4d3-9cbebf98a305
  &limit=32000
  &filters=...
```

---

## 6. The 8 screens and what they show

| # | Screen | Metric | Chart |
|---|--------|--------|-------|
| 1 | What is being bought | Economic Object Code, Commodity | Donut + Horizontal Bar |
| 2 | Paying more over time | Total Contract Value, YoY Growth | Area + Bar |
| 3 | Fastest growing categories | Category CAGR | Horizontal Bar + Table |
| 4 | Volume | Contract count, Vendor count | Stacked Bar + Area |
| 5 | Unit Cost | Avg & Median Contract Value | Composed Line |
| 6 | Amendments | Inflation Ratio, Total Overrun | Area + Table |
| 7 | Concentration | HHI, Top Vendor Share | Pie + Area + Table |
| 8 | Less for More | Combined Erosion Score | Colour-coded Table |

---

## 7. Hackathon day checklist

- [ ] `python explore_db.py` — confirm table name and columns
- [ ] Update `TABLE` in `queries.py` if needed
- [ ] `uvicorn main:app --reload` + `npm run dev` — verify all 8 screens load
- [ ] `git push` → Render auto-deploys both services
- [ ] Update `VITE_API_URL` env var on Render to the backend URL
- [ ] Test deployed URL end-to-end
- [ ] Prepare 3 narrative points for the demo

**Good luck! 🚀**
