import { GeminiService } from './gemini/geminiService.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const mockDiff = `
diff --git a/index.js b/index.js
index e69de29..9bc2133 100644
--- a/index.js
+++ b/index.js
@@ -10,6 +10,12 @@
+function getUser(userId) {
+  // Vulnerable SQL query
+  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
+  return db.execute(query);
+}
`;

async function testReview() {
  console.log('[Test]: Initializing GeminiService...');
  const gemini = new GeminiService();

  console.log('[Test]: Submitting mock diff for code review...');
  try {
    const result = await gemini.analyzeDiff(mockDiff);
    console.log('[Test]: Received structured review successfully!');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('[Test]: Failed to review diff:', error);
  }
}

testReview();
