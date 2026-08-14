# Database Schema

This document outlines the Firestore collection structure for Code Pulse.

## Collections

### 1. `repositories`
Tracks repositories integrated with Code Pulse.
- `id` (string): Unique identifier (e.g. `owner_repo`)
- `owner` (string): GitHub owner
- `name` (string): GitHub repo name
- `url` (string): GitHub clone/html URL
- `createdAt` (timestamp): Integration timestamp
- `lastScannedAt` (timestamp): Last analysis timestamp

### 2. `reviews`
Stores historical code review outputs.
- `id` (string)
- `repositoryId` (string, ref)
- `commitHash` (string)
- `branch` (string)
- `metrics` (map):
  - `qualityScore` (number)
  - `issuesCount` (number)
- `feedback` (array of maps):
  - `filePath` (string)
  - `line` (number)
  - `type` (warning/info/error)
  - `message` (string)
- `reviewedAt` (timestamp)

### 3. `pulses`
Stores aggregated daily metrics for trend analysis.
- `id` (string)
- `repositoryId` (string, ref)
- `date` (string, e.g. YYYY-MM-DD)
- `commitsCount` (number)
- `linesAdded` (number)
- `linesDeleted` (number)
- `averageQualityScore` (number)
