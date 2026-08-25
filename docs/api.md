# CodePulse API Reference

Base URL (local): `http://localhost:3001/api`
Base URL (production): `https://YOUR-CLOUD-RUN-URL/api`

---

## Reviews

### POST /api/reviews
Submit code for AI review.

**Request Body:**
```json
{
  "code": "string (required, max 50,000 chars)",
  "language": "string (optional, e.g. 'Python', 'JavaScript')",
  "filename": "string (optional, helps language detection)",
  "userId": "string (optional, defaults to 'default_user')",
  "projectId": "string (optional, defaults to 'default_project')"
}
```

**Response 201:**
```json
{
  "id": "firestore-doc-id",
  "userId": "string",
  "projectId": "string",
  "filename": "string",
  "language": "Python",
  "overallScore": 84,
  "qualityLabel": "Good",
  "summary": "...",
  "categories": {
    "correctness": 87,
    "security": 78,
    "performance": 82,
    "maintainability": 89,
    "readability": 86
  },
  "findings": [...],
  "strengths": [...],
  "priorityActions": [...],
  "createdAt": "ISO timestamp"
}
```

### GET /api/reviews
List recent reviews.

**Query Params:** `?userId=xxx&limit=20`

**Response 200:** Array of review documents.

### GET /api/reviews/:id
Get a specific review by Firestore ID.

**Response 200:** Review document.
**Response 404:** `{ "error": "..." }`

---

## Dashboard

### GET /api/dashboard
Dashboard summary for a user.

**Query Params:** `?userId=xxx`

**Response 200:**
```json
{
  "userId": "string",
  "totalReviews": 5,
  "averageScore": 79,
  "latestScore": 91,
  "scoreDelta": 15,
  "categoryAverages": { ... },
  "scoreTrajectory": [...],
  "recentReviews": [...]
}
```

---

## Historical Insights

### GET /api/insights
Retrieve stored historical intelligence for a user.

**Query Params:** `?userId=xxx`

**Response 200:**
```json
{
  "userId": "string",
  "currentReviewId": "string",
  "totalReviews": 3,
  "scoreTrajectory": [...],
  "totalGain": 29,
  "insight": {
    "improvements": [...],
    "regressions": [...],
    "recurringWeaknesses": [...],
    "resolvedWeaknesses": [...],
    "recommendation": "...",
    "overallTrend": "improving"
  }
}
```

**Response 404:** Not enough reviews yet.

### POST /api/insights/analyze
Manually trigger historical analysis for a user.

**Request Body:** `{ "userId": "string", "currentReviewId": "string" }`

**Response 200:** StoredHistoricalInsight object.

---

## Demo Endpoints

### GET /api/demo/reviews
Returns all three demo reviews (scores: 62, 76, 91).

### GET /api/demo/reviews/:version
Version must be `1`, `2`, or `3`.

### GET /api/demo/insights
Pre-computed historical insight for the demo story.

### GET /api/demo/dashboard
Demo dashboard data.

---

## Health

### GET /health
Returns server status.

```json
{
  "status": "OK",
  "service": "CodePulse API",
  "version": "1.0.0",
  "timestamp": "...",
  "environment": "production"
}
```

---

## Scoring Weights

The overall score is computed deterministically from category scores:

| Category | Weight |
|---|---|
| Correctness | 30% |
| Security | 25% |
| Performance | 20% |
| Maintainability | 15% |
| Readability | 10% |

`overallScore = Σ(categoryScore × weight)` — rounded to integer.
