# Contract Intelligence — Deployment to Google Cloud

## Prerequisites

### 1. Install Google Cloud CLI
```powershell
# Already downloaded — complete the interactive installer
# After install, restart your terminal
```

### 2. Authenticate & Set Project
```powershell
gcloud auth login
gcloud config set project agency2026ot-v-sync-0429
gcloud config set compute/region northamerica-northeast1
```

### 3. Enable Required APIs
```powershell
gcloud services enable bigquery.googleapis.com aiplatform.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### 4. Set Up ADC (Application Default Credentials)
```powershell
gcloud auth application-default login
```

---

## Data Pipeline: Load CKAN → BigQuery

```powershell
cd backend
python bq_loader.py
```

This will:
- Create dataset `contract_intelligence` in `northamerica-northeast1`
- Create table `contracts` with typed schema
- Fetch all records from CKAN Open Government API (FY2015-FY2026)
- Load ~300K+ records into BigQuery

---

## Local Development

### Terminal 1: Backend
```powershell
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

Frontend at http://localhost:5173 (proxies /api to backend).

---

## Deploy to Cloud Run

### 1. Create Artifact Registry repo (one-time)
```powershell
gcloud artifacts repositories create contract-intelligence --repository-format=docker --location=northamerica-northeast1
```

### 2. Build & Deploy
```powershell
# Option A: Cloud Build (recommended)
gcloud builds submit --config=cloudbuild.yaml

# Option B: Manual
docker build -t northamerica-northeast1-docker.pkg.dev/agency2026ot-v-sync-0429/contract-intelligence/app:latest .
docker push northamerica-northeast1-docker.pkg.dev/agency2026ot-v-sync-0429/contract-intelligence/app:latest
gcloud run deploy contract-intelligence \
  --image northamerica-northeast1-docker.pkg.dev/agency2026ot-v-sync-0429/contract-intelligence/app:latest \
  --region northamerica-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi --cpu 1 \
  --set-env-vars "GCP_PROJECT_ID=agency2026ot-v-sync-0429,BQ_DATASET=contract_intelligence,GCP_REGION=northamerica-northeast1"
```

### 3. Grant Cloud Run Service Account Access
```powershell
# Get the service account email
gcloud run services describe contract-intelligence --region northamerica-northeast1 --format="value(spec.template.spec.serviceAccountName)"

# Grant BigQuery access
gcloud projects add-iam-policy-binding agency2026ot-v-sync-0429 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding agency2026ot-v-sync-0429 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/bigquery.jobUser"

# Grant Vertex AI access
gcloud projects add-iam-policy-binding agency2026ot-v-sync-0429 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/aiplatform.user"
```

---

## Architecture

```
Cloud Run (northamerica-northeast1)
├── FastAPI backend (Python 3.11)
│   ├── /api/* — Analytics endpoints → BigQuery
│   ├── /api/chat — AI chatbot → Vertex AI Gemini
│   └── /* — Serves Vite-built React SPA
├── BigQuery dataset: contract_intelligence.contracts
└── Vertex AI: Gemini 2.5 Flash (via ADC)
```
