/**
 * Manual integration test for ReviewService.
 * Run with: npx tsx src/test_review_engine.ts
 *
 * Prerequisites:
 *   - GCP_PROJECT_ID set in .env
 *   - Valid Vertex AI credentials
 *   - Firestore enabled on the project
 */
import dotenv from 'dotenv';
dotenv.config();

import { ReviewService } from './services/reviewService.js';

const SAMPLE_PYTHON_CODE = `
import sqlite3

def get_user(user_id):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # SQL injection vulnerability
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    return cursor.fetchone()
`;

async function runTest() {
  const service = new ReviewService();
  console.log('[Test]: Running code review...');

  try {
    const review = await service.createReview(
      SAMPLE_PYTHON_CODE,
      'Python',
      'test_user_service.py',
      'test_user',
      'test_project'
    );

    console.log('[Test]: Review completed!');
    console.log(`[Test]: Score: ${review.overallScore} (${review.qualityLabel})`);
    console.log(`[Test]: Language: ${review.language}`);
    console.log(`[Test]: Findings: ${review.findings.length}`);
    console.log(`[Test]: Strengths: ${review.strengths.length}`);
    console.log('[Test]: Summary:', review.summary);
  } catch (error) {
    console.error('[Test]: FAILED:', error);
    process.exit(1);
  }
}

runTest();
