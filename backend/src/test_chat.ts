import { GeminiService } from './gemini/geminiService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testChat() {
  console.log('[Test]: Initializing GeminiService for Chat...');
  const gemini = new GeminiService();

  const messages = [
    { role: 'user' as const, content: 'How do I fix a SQL injection vulnerability in JavaScript?' }
  ];

  const context = {
    code: `const query = "SELECT * FROM users WHERE id = '" + userId + "'";\ndb.execute(query);`,
    language: 'JavaScript',
    finding: {
      title: 'SQL Injection Vulnerability',
      severity: 'critical',
      category: 'security',
      explanation: 'Concatenating userId directly into SQL allows attackers to alter query logic.',
      suggestion: 'Use parameterized query: db.execute("SELECT * FROM users WHERE id = ?", [userId]);'
    }
  };

  console.log('[Test]: Sending chat prompt to Gemini...');
  try {
    const result = await gemini.chat(messages, context);
    console.log('[Test]: Chat response received successfully!');
    console.log('Model Used:', result.model);
    console.log('Response:\n', result.reply);
  } catch (error) {
    console.error('[Test]: Chat failed:', error);
  }
}

testChat();
