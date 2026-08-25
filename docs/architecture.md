# CodePulse — Architecture Overview

## System Overview

```
Developer Browser
      │
      ▼
Firebase Hosting (frontend)
      │
      ▼
Cloud Run — CodePulse API (Node.js/Express/TypeScript)
      │
      ├──── Vertex AI (Gemini 2.0 Flash)
      │         └── Code review analysis
      │         └── Historical insight generation
      │
      ├──── Firestore
      │         └── reviews/{reviewId}
      │         └── developerInsights/{userId}
      │         └── qualitySnapshots/{userId}
      │         └── historicalInsights/{userId}
      │
      └──── Cloud Storage (future: file uploads)

GitHub
  │
  ▼
Cloud Build
  │
  ▼
Artifact Registry (Docker images)
  │
  ▼
Cloud Run (deployed container)
```

## Service Responsibilities

| GCP Service | Purpose | Why This Service |
|---|---|---|
| **Vertex AI / Gemini** | AI inference | Production-grade AI with structured output, no API key management |
| **Cloud Run** | Serverless API | Scales to zero, no VM management, native GCP IAM |
| **Firestore** | Review persistence | Document model fits review schema, real-time capable, serverless |
| **Cloud Build** | CI/CD | Native GCP, integrates with Artifact Registry and Cloud Run |
| **Artifact Registry** | Container registry | GCP-native, IAM-controlled, supports vulnerability scanning |
| **Firebase Auth** | User authentication | Integrates with Cloud Run via JWT, no custom auth server |
| **Firebase Hosting** | Frontend delivery | CDN-backed, zero-config HTTPS, supports SPA routing |

## Data Flow — Code Review

```
1. User submits code (POST /api/reviews)
      │
2. Language detection (heuristic + extension mapping)
      │
3. Gemini analysis (Vertex AI SDK, structured JSON output)
      │
4. Deterministic weighted scoring
      │     overallScore = Correctness×30% + Security×25% +
      │                    Performance×20% + Maintainability×15% +
      │                    Readability×10%
      │
5. Persist review document to Firestore (reviews/{id})
      │
6. (async) Sync aggregate insights and quality snapshots
      │
7. (async) Trigger Historical Analysis Service
      │         └── Retrieve all user reviews
      │         └── Detect recurring weaknesses (deterministic)
      │         └── Detect improvements and regressions
      │         └── Detect resolved issues
      │         └── Send full history context to Gemini
      │         └── Merge deterministic + AI findings
      │         └── Persist to historicalInsights/{userId}
      │
8. Return review result to frontend (immediate)
```

## Data Flow — Historical Intelligence (Key Differentiator)

The historical analysis is triggered asynchronously after each review.
It does not block the review response.

```
Retrieve all reviews for user (ordered by createdAt ASC)
      │
Compare category scores: previous → current
      │
Detect recurring weaknesses: same issue title in ≥2 reviews
      │
Detect resolved issues: appears in prior reviews, absent in current
      │
Send context to Gemini:
      │   "Here are 3 reviews: [history]
      │    Current: [current review]
      │    Identify improvements, regressions, patterns, and give a
      │    personalized recommendation."
      │
Merge deterministic findings with Gemini narrative
      │
Store StoredHistoricalInsight to Firestore
      │
Surface on /history page
```

## Scoring Weights

The overall score is NOT taken directly from Gemini (which could hallucinate).
It is computed deterministically from the 5 category scores:

```
overallScore = round(
  correctness  × 0.30 +
  security     × 0.25 +
  performance  × 0.20 +
  maintainability × 0.15 +
  readability  × 0.10
)
```

This ensures:
- Same inputs → same output (deterministic)
- Score is explainable and auditable
- Security is weighted highly as it has real-world impact

## Frontend Architecture

```
React + TypeScript + Vite
      │
      ├── pages/
      │     Landing.tsx          — Hero, features, GCP architecture
      │     ReviewPage.tsx        — Code editor, language selector
      │     ResultsPage.tsx       — Score ring, findings, strengths
      │     Dashboard.tsx         — Trajectory chart, stats
      │     HistoryPage.tsx       — Historical intelligence display
      │
      ├── components/
      │     Navbar.tsx             — Navigation
      │     ScoreRing.tsx          — Animated SVG score circle
      │     CategoryScoreBars.tsx  — Animated progress bars
      │     FindingCard.tsx        — Expandable finding details
      │     QualityTrajectoryChart.tsx — Recharts line chart
      │     UIStates.tsx           — Loading, error, empty, demo states
      │
      ├── services/
      │     api.ts                 — All HTTP calls to backend
      │
      ├── types/
      │     index.ts               — TypeScript interfaces
      │
      └── utils/
            formatters.ts          — Colors, labels, time formatting
```

## Security Considerations

1. **No secrets in repository** — .env.example documents all vars, .gitignore excludes .env
2. **Firestore security rules** — users can only read their own data
3. **Input validation** — code size limit (50KB), required field validation
4. **Safe error messages** — stack traces never reach the client
5. **Request size limits** — Express body parser limited to 2MB
6. **Non-root Docker** — container runs as unprivileged user
7. **IAM least privilege** — service account only needs Vertex AI + Firestore access
