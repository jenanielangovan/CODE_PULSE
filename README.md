# CodePulse — 24/7 Intelligent Code Reviewer

> **AI code review that remembers how you improve.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Powered-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![Vertex AI](https://img.shields.io/badge/Vertex_AI-Gemini-8B5CF6?logo=google&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Cloud Run](https://img.shields.io/badge/Cloud_Run-Serverless-00A86B)](https://cloud.google.com/run)

**Built for AIM Code Kitchen Season 01, Presented by Google Cloud**

---

## What is CodePulse?

CodePulse is an always-on intelligent code reviewer that **remembers how a developer's code quality evolves over time** and turns historical reviews into personalized engineering intelligence.

Traditional AI code reviewers evaluate code in isolation — they have no memory, no history, no understanding of your specific patterns and growth areas.

**CodePulse is different:**

```
Code → Review → Score → History → Pattern → Insight → Improvement
```

---

## The Key Differentiator

> **Historical Intelligence** — CodePulse doesn't just review your current code. It analyzes your entire review history to:

- 🔁 **Detect recurring weaknesses** — "Input validation appeared in 3 of your last 4 reviews"
- ✅ **Celebrate resolved issues** — "SQL injection was present in reviews 1 and 2. It's gone in review 3."
- 📈 **Track category trends** — "Security improved 45 → 95 (+50 points)"
- 🧠 **Generate personalized recommendations** — Gemini synthesizes your full history into a targeted insight just for you

---

## Features

| Feature | Description |
|---|---|
| **Multi-language** | Python, JavaScript, TypeScript, Java, Go, C++, C#, Rust, Ruby, PHP |
| **5-Dimension Scoring** | Correctness, Security, Performance, Maintainability, Readability |
| **Weighted Score** | Deterministic scoring (not just trusting Gemini's self-reported score) |
| **Historical Intelligence** | Recurring pattern detection, trend analysis, growth tracking |
| **Personalized AI Insight** | Gemini synthesizes full review history into targeted recommendations |
| **Quality Trajectory** | Visual line chart showing score evolution over time |
| **Demo Mode** | Deterministic 62 → 76 → 91 demo story — works without GCP credentials |
| **Structured Output** | JSON-validated findings with severity, category, line, explanation, fix |

---

## GCP Architecture

```
Browser ──→ Firebase Hosting (React SPA)
                    │
                    ▼
            Cloud Run (Express API)
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
      Vertex AI  Firestore  Cloud Storage
      (Gemini)   (reviews,  (future: repo
                  insights)  uploads)
                    │
          Cloud Build ──→ Artifact Registry
```

### GCP Services Used

| Service | Purpose |
|---|---|
| **Vertex AI + Gemini** | Code analysis, historical insight generation |
| **Cloud Run** | Serverless backend API (scales to zero) |
| **Firestore** | Review persistence, developer insights, quality snapshots |
| **Cloud Build** | CI/CD pipeline (GitHub → build → deploy) |
| **Artifact Registry** | Docker image registry |
| **Firebase Auth** | User authentication |
| **Firebase Hosting** | Frontend CDN delivery |

---

## Repository Structure

```
codepulse-intelligent-code-reviewer/
│
├── frontend/                    # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── components/          # ScoreRing, CategoryScoreBars, FindingCard, Charts
│       ├── pages/               # Landing, Review, Results, Dashboard, History
│       ├── services/            # api.ts — all backend HTTP calls
│       ├── types/               # Shared TypeScript interfaces
│       └── utils/               # formatters.ts — colors, labels, dates
│
├── backend/                     # Node.js + TypeScript + Express
│   └── src/
│       ├── gemini/              # GeminiService — Vertex AI integration
│       ├── services/            # ReviewService, HistoricalAnalysisService,
│       │                        #   ScoringService, DemoService
│       ├── routes/              # apiRoutes.ts — all REST endpoints
│       ├── firestore/           # Firestore client
│       └── utils/               # languageDetector.ts
│
├── prompts/
│   ├── code-review.md           # Gemini code review prompt template
│   └── historical-analysis.md  # Gemini historical intelligence prompt
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database-schema.md
│   └── deployment.md
│
├── cloudbuild.yaml              # CI/CD pipeline
├── firestore.rules              # Security rules
└── .github/workflows/ci.yml    # GitHub Actions
```

---

## Local Setup

### Prerequisites
- Node.js 20+
- A GCP project with Vertex AI + Firestore enabled
- `gcloud auth application-default login`

### 1. Clone and install

```bash
git clone https://github.com/yourusername/codepulse-intelligent-code-reviewer
cd codepulse-intelligent-code-reviewer
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your GCP_PROJECT_ID

npm install
npm run dev       # http://localhost:3001
```

### 3. Frontend setup (separate terminal)

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

The Vite dev proxy routes `/api` → `http://localhost:3001` automatically.

---

## Environment Variables

### Backend (`.env`)

```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-001
FIRESTORE_DATABASE=(default)
```

See `backend/.env.example` for full documentation.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reviews` | Submit code for review |
| `GET` | `/api/reviews` | List reviews (`?userId=xxx`) |
| `GET` | `/api/reviews/:id` | Get specific review |
| `GET` | `/api/dashboard` | Dashboard data (`?userId=xxx`) |
| `GET` | `/api/insights` | Historical insights (`?userId=xxx`) |
| `POST` | `/api/insights/analyze` | Trigger historical analysis |
| `GET` | `/api/demo/reviews` | Demo reviews (62, 76, 91) |
| `GET` | `/api/demo/insights` | Demo historical insight |
| `GET` | `/health` | Health check |

See [`docs/api.md`](docs/api.md) for full documentation.

---

## Deployment

```bash
# Backend to Cloud Run (via Cloud Build)
gcloud builds submit --config cloudbuild.yaml .

# Frontend to Firebase Hosting
cd frontend
npm run build
firebase deploy --only hosting
```

See [`docs/deployment.md`](docs/deployment.md) for full setup guide.

---

## Demo Mode

CodePulse includes a built-in demo that works **without GCP credentials**.

Visit the History page → "View Demo Historical Data" to see:

```
Review 1: 62 (Flawed — SQL injection, missing error handling)
Review 2: 76 (Improved — injection fixed, some issues remain)
Review 3: 91 (Excellent — fully resolved, clean and secure)
```

**Historical Insight:**
```
+29 points total improvement

✓ Security: 45 → 95 (+50 pts)
✓ Resolved: SQL injection, missing error handling

⚠ Recurring: Input validation (2 reviews)

Gemini recommends: "Your security has improved dramatically.
Focus next on defensive input validation..."
```

---

## Screentest Demo Flow

1. Open CodePulse at `http://localhost:5173`
2. Click **"Start Reviewing"**
3. Click **"Load Sample Code"** → submit → see **62/100**
4. Load sample code again → improve it → submit → see **76/100**
5. Submit polished version → see **91/100**
6. Click **"View History"** → see the full journey: `62 → 76 → 91`
7. See recurring patterns, improvements, Gemini's recommendation

Or use **"View Demo Historical Data"** for the pre-built story.

---

## Scoring System

The overall score is computed deterministically — not trusted from Gemini alone:

```
overallScore = Correctness × 30%
             + Security × 25%
             + Performance × 20%
             + Maintainability × 15%
             + Readability × 10%
```

Weights reflect real-world impact: correctness and security matter most.

---

## Security

- ✅ No secrets committed (`.env.example` only)
- ✅ Input validation with 50KB code size limit
- ✅ Safe error messages — no stack traces exposed
- ✅ Firestore security rules — users read only their own data
- ✅ Non-root Docker container
- ✅ IAM least privilege for service account
- ✅ Request size limits (2MB body)

---

## Roadmap

- [ ] Firebase Authentication (Google Sign-In)
- [ ] Repository upload (GitHub integration via Cloud Storage)
- [ ] Team dashboard — aggregate insights across a team
- [ ] Webhook support — trigger reviews on git push
- [ ] Export report to PDF
- [ ] Firestore composite index deployment automation

---

## License

MIT — see [LICENSE](LICENSE)

---

*CodePulse — Built for AIM Code Kitchen Season 01, Presented by Google Cloud*
*Powered by Vertex AI · Gemini · Cloud Run · Firestore*
