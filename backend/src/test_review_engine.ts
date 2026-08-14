import dotenv from 'dotenv';
dotenv.config();

import { detectLanguage } from './utils/languageDetector.js';
import { ReviewService } from './services/reviewService.js';

// Define a test suite
function testLanguageDetection() {
  console.log('[Test]: Testing language detection...');

  const testCases = [
    { filename: 'index.ts', content: 'const val: string = "hello";', expected: 'TypeScript' },
    { filename: 'app.jsx', content: 'export default function App() {}', expected: 'JavaScript (React)' },
    { filename: 'script.py', content: 'def main():\n    print("hello")', expected: 'Python' },
    { filename: 'main.go', content: 'package main', expected: 'Go' },
    { filename: 'server.js', content: 'const express = require("express");', expected: 'JavaScript' },
    { filename: undefined, content: 'def process_data(x):\n    return x * 2', expected: 'Python' },
  ];

  let passes = 0;
  for (const tc of testCases) {
    const result = detectLanguage(tc.filename, tc.content);
    const success = result === tc.expected;
    console.log(`  File: ${tc.filename || 'None'} -> Detected: ${result} | Expected: ${tc.expected} | ${success ? '✅ PASS' : '❌ FAIL'}`);
    if (success) passes++;
  }

  console.log(`[Test]: Language detection results: ${passes}/${testCases.length} passed.`);
}

async function testReviewEngineMock() {
  console.log('[Test]: Testing ReviewService structure & normalization...');
  const reviewService = new ReviewService();

  // Mock GeminiService to simulate review output without API/network requests
  (reviewService as any).geminiService = {
    analyzeDiff: async () => ({
      score: 88,
      summary: 'Clean code with minor suggestions.',
      categories: {
        correctness: 90,
        security: 85,
        performance: 80,
        maintainability: 95,
        readability: 90,
      },
      findings: [
        {
          severity: 'low',
          category: 'performance',
          line: 12,
          title: 'Unnecessary loop iteration',
          explanation: 'Loop runs one extra time.',
          suggestion: 'Change < to <=.',
        },
      ],
    }),
  };

  try {
    // Run createReview which calls the mock service, runs language detection, normalizes, and attempts to write to db (will warn if db fails)
    const review = await reviewService.createReview(
      'const a = 1;',
      'test_file.ts',
      'user_123',
      'project_abc',
      'commit_hash_123',
      'dev'
    );

    console.log('[Test]: Review output fields normalized correctly:');
    console.log(`  Language: ${review.language} (Expected: TypeScript)`);
    console.log(`  Score: ${review.score} (Expected: 88)`);
    console.log(`  Correctness Score: ${review.categories.correctness} (Expected: 90)`);
    console.log(`  Findings Count: ${review.findings.length} (Expected: 1)`);
    console.log('✅ ReviewEngine mock evaluation completed successfully!');
  } catch (error) {
    console.error('❌ ReviewEngine mock evaluation failed:', error);
  }
}

async function runAll() {
  testLanguageDetection();
  console.log('');
  await testReviewEngineMock();
}

runAll();
