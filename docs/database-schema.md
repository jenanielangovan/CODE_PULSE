# Database Schema

This document outlines the Firestore collection structure for Code Pulse.

## Collections

### 1. `users`
Stores user profile information.
- Document ID: `{userId}` (e.g. Firebase Auth UID)
- `email` (string): User's email address
- `displayName` (string): User's display name
- `avatarUrl` (string): Profile picture link
- `createdAt` (timestamp): Registration date

### 2. `projects`
Tracks projects integrated with Code Pulse.
- Document ID: `{projectId}` (e.g. `owner_repo` name or UUID)
- `name` (string): Project name
- `owner` (string): Owner identity/organization
- `url` (string): Repository clone/source URL
- `createdAt` (timestamp): Project creation timestamp

### 3. `reviews`
Stores historical code review outputs.
- Document ID: `{reviewId}` (auto-generated)
- `userId` (string): Reference to the user submitting the code
- `projectId` (string): Reference to the project being reviewed
- `language` (string): Programming language of the submitted code
- `score` (number): Overall code review score [0-100]
- `summary` (string): AI-generated high-level code review summary
- `categories` (map):
  - `correctness` (number)
  - `security` (number)
  - `performance` (number)
  - `maintainability` (number)
  - `readability` (number)
- `findings` (array of maps):
  - `severity` (string): `info` | `low` | `medium` | `high` | `critical`
  - `category` (string): correctness/security/performance/maintainability/readability
  - `line` (number): line number in the source file
  - `title` (string): summary of the warning
  - `explanation` (string): description of the issue
  - `suggestion` (string): recommended fix or code rewrite
- `commitHash` (string): Associated commit SHA
- `branch` (string): Associated branch name
- `createdAt` (timestamp): Submission timestamp

### 4. `developerInsights`
Maintains running aggregate metrics for each user to track developer trends.
- Document ID: `{userId}` (matches the user document)
- `userId` (string)
- `averageScore` (number): Running average score across all reviews
- `totalReviews` (number): Total number of reviews submitted by this user
- `totalFindings` (number): Aggregated issues count
- `severityBreakdown` (map): Count of issues by severity (`info`, `low`, `medium`, `high`, `critical`)
- `categoryBreakdown` (map): Count of issues by category (`correctness`, `security`, etc.)
- `categoryAverages` (map): Average score for each evaluation category
- `updatedAt` (timestamp): Last calculation timestamp

### 5. `qualitySnapshots`
Tracks historical snapshots of code quality over time for trend charts.
- Document ID: `{userId}` (matches the user document)
- `userId` (string)
- `history` (array of maps):
  - `reviewId` (string): Associated review document ID
  - `score` (number): Overall score of the review
  - `createdAt` (timestamp): Time of the review
