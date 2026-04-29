# Contract Intelligence Platform

A full-stack federal procurement data analytics platform for the Government of Canada. This application provides insights into contracting trends, vendor concentration, and regional spending using the CKAN Open Government API, backed by Google Cloud BigQuery and powered by a Vertex AI Gemini Chatbot.

## Architecture

- **Frontend**: React + Vite (Vanilla CSS, Government of Canada Design System)
- **Backend**: FastAPI (Python 3.11)
- **Data Warehouse**: Google Cloud BigQuery
- **AI Integration**: Vertex AI Gemini 2.5 Flash / 2.0 Flash
- **Deployment**: Google Cloud Run (Containerized)

## Features

- **Global Fiscal Year Filter**: Analyze data across specific FY ranges (FY2015-FY2026).
- **Time-series Analysis**: View topline spend, volume, and unit-cost trends.
- **Category Deep-dives**: Decompose spend growth into volume vs. unit-cost inflation.
- **Vendor Concentration**: Monitor HHI (Herfindahl-Hirschman Index) and market share.
- **Geographic Spend**: Heat maps of Canadian provincial spending.
- **Less for More Watchlist**: Identify contracts with extreme amendment ratios.
- **AI Procurement Analyst**: Ask natural language questions about the procurement data.

---

## Local Development Setup

### Prerequisites
1. Python 3.11+
2. Node.js 20+
3. Google Cloud SDK (`gcloud`)

### 1. Google Cloud Authentication
You must be authenticated with Google Cloud and have Application Default Credentials (ADC) set up to access BigQuery and Vertex AI locally.

```bash
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]
gcloud auth application-default login
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Note: The backend API runs at `http://localhost:8000/api`*

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```
*Note: The frontend runs at `http://localhost:5173` and proxies `/api` calls to the backend.*

---

## Data Pipeline

To populate the BigQuery data warehouse from the CKAN API:
```bash
cd backend
python bq_loader.py
```

---

## Deployment (Google Cloud Run)

This repository includes a multi-stage `Dockerfile` and `cloudbuild.yaml` for automated deployments to Google Cloud Run.

### 1. Enable Required APIs
```bash
gcloud services enable bigquery.googleapis.com aiplatform.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### 2. Deploy via Cloud Build
```bash
gcloud builds submit --config=cloudbuild.yaml
```

*For more detailed deployment configurations, see `DEPLOY.md`.*

## Data Source
[Government of Canada Open Data - Contracts over $10,000](https://open.canada.ca/data/en/dataset/537538cb-2a4a-411a-bc4c-cb71ea9e67da)
