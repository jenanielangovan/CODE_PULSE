# CodePulse Deployment Guide

## Prerequisites

1. GCP project with billing enabled
2. APIs enabled:
   - Vertex AI API
   - Firestore API
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
3. `gcloud` CLI installed and authenticated

---

## 1. Initial GCP Setup

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

# Create Firestore database (if not exists)
gcloud firestore databases create --location=us-central1

# Create Artifact Registry repository
gcloud artifacts repositories create codepulse-backend \
  --repository-format=docker \
  --location=us-central1 \
  --description="CodePulse backend container images"
```

---

## 2. Create Service Account

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create codepulse-api \
  --display-name="CodePulse API Service Account"

# Grant Vertex AI access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:codepulse-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Grant Firestore access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:codepulse-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

---

## 3. Build and Deploy Backend

```bash
# Option A: Manual build and deploy
cd backend

# Build image
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/codepulse-backend/codepulse-api:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/codepulse-backend/codepulse-api:latest

# Deploy to Cloud Run
gcloud run deploy codepulse-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/codepulse-backend/codepulse-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account codepulse-api@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "GCP_PROJECT_ID=YOUR_PROJECT_ID,GCP_LOCATION=us-central1,GEMINI_MODEL=gemini-2.0-flash-001" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10


# Option B: Cloud Build trigger
gcloud builds submit --config cloudbuild.yaml .
```

---

## 4. Deploy Frontend

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting (first time only)
cd frontend
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Configure Backend URL in Frontend

After deploying the backend, get the Cloud Run URL:

```bash
gcloud run services describe codepulse-api --region us-central1 --format 'value(status.url)'
```

Update the frontend API base URL in `frontend/src/services/api.ts` or use a VITE environment variable:

```bash
# In frontend/.env.production
VITE_API_BASE_URL=https://codepulse-api-xxxxxxxx-uc.a.run.app/api
```

---

## 5. Local Development

```bash
# Backend
cd backend
cp .env.example .env
# Fill in GCP_PROJECT_ID and other vars
# Authenticate: gcloud auth application-default login
npm run dev     # starts on http://localhost:3001

# Frontend (separate terminal)
cd frontend
npm run dev     # starts on http://localhost:5173
# Vite proxy automatically forwards /api to :3001
```

---

## 6. GitHub Actions Deployment

Configure these GitHub repository secrets:
- `GCP_PROJECT_ID` — Your GCP project ID
- `GCP_WORKLOAD_IDENTITY_PROVIDER` — Workload Identity Federation provider URI
- `GCP_SERVICE_ACCOUNT` — Service account email for deployments

The CI/CD pipeline automatically:
1. Checks TypeScript compilation on every push
2. Deploys to Cloud Run on push to `main`

---

## 7. Firestore Indexes

The following composite indexes are required for efficient queries:

```bash
# Create composite index: reviews by userId + createdAt
gcloud firestore indexes composite create \
  --collection-group=reviews \
  --field-config field-path=userId,order=ASCENDING \
  --field-config field-path=createdAt,order=DESCENDING
```

Or deploy `firestore.indexes.json` if created.

---

## 8. Post-Deployment Verification

```bash
# Health check
curl https://YOUR-CLOUD-RUN-URL/health

# Demo review
curl -X GET https://YOUR-CLOUD-RUN-URL/api/demo/reviews

# Test code review (requires valid GCP credentials on Cloud Run)
curl -X POST https://YOUR-CLOUD-RUN-URL/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"hello\")", "language": "Python"}'
```
