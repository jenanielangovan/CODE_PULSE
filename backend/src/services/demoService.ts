/**
 * DemoService — Deterministic demo reviews for reliable screentests.
 *
 * These three snapshots simulate the CodePulse story:
 *   Version 1 (62): Flawed code — SQL injection, missing error handling, poor structure
 *   Version 2 (76): Improved — SQL injection fixed, better structure, some issues remain
 *   Version 3 (91): Well-written — clean, secure, fast, maintainable
 *
 * Demo data is clearly labeled and never stored to production Firestore.
 */

import { FullReviewDocument } from './reviewService.js';
import { StoredHistoricalInsight } from './historicalAnalysisService.js';

const DEMO_USER_ID = 'demo_user';

function makeDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export const DEMO_REVIEWS: FullReviewDocument[] = [
  {
    id: 'demo_review_1',
    userId: DEMO_USER_ID,
    projectId: 'demo_project',
    filename: 'user_service.py',
    language: 'Python',
    overallScore: 62,
    qualityLabel: 'Needs Improvement',
    summary: 'The code has significant security vulnerabilities including SQL injection risk and missing input validation. Error handling is absent, and the structure is difficult to maintain. Several critical issues require immediate attention.',
    categories: {
      correctness: 58,
      security: 45,
      performance: 70,
      maintainability: 65,
      readability: 72,
    },
    findings: [
      {
        severity: 'critical',
        category: 'security',
        line: 12,
        title: 'SQL Injection Vulnerability',
        explanation: 'User input is concatenated directly into a SQL query string without parameterization. An attacker can manipulate the query to extract, modify, or delete data.',
        suggestion: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))',
      },
      {
        severity: 'high',
        category: 'correctness',
        line: 28,
        title: 'Missing Error Handling',
        explanation: 'Database operations and external calls have no try/except blocks. Any failure will cause an unhandled exception and crash the service.',
        suggestion: 'Wrap database calls in try/except blocks and return appropriate error responses.',
      },
      {
        severity: 'high',
        category: 'security',
        line: 5,
        title: 'Missing Input Validation',
        explanation: 'No input sanitization or validation before processing user-supplied data. Malformed inputs can cause unexpected behavior.',
        suggestion: 'Validate all inputs at the entry point using a validation library like Pydantic or marshmallow.',
      },
      {
        severity: 'medium',
        category: 'maintainability',
        line: 35,
        title: 'Magic Numbers',
        explanation: 'Numeric literals are scattered throughout the code without context, making it hard to understand their purpose.',
        suggestion: 'Define constants with descriptive names at the top of the module.',
      },
    ],
    strengths: ['Basic function structure is in place', 'Variable names are somewhat descriptive'],
    priorityActions: [
      'Fix SQL injection by using parameterized queries immediately',
      'Add comprehensive error handling and logging',
      'Implement input validation at all entry points',
    ],
    createdAt: makeDate(14),
  },
  {
    id: 'demo_review_2',
    userId: DEMO_USER_ID,
    projectId: 'demo_project',
    filename: 'user_service.py',
    language: 'Python',
    overallScore: 76,
    qualityLabel: 'Fair',
    summary: 'Significant improvement from the previous version. SQL injection has been fixed using parameterized queries. Error handling has been added to most operations. Input validation is still incomplete and some edge cases are not handled.',
    categories: {
      correctness: 75,
      security: 72,
      performance: 78,
      maintainability: 80,
      readability: 82,
    },
    findings: [
      {
        severity: 'high',
        category: 'security',
        line: 8,
        title: 'Incomplete Input Validation',
        explanation: 'While SQL injection was fixed, input validation is still missing for several endpoints. Type checking and boundary validation are not enforced.',
        suggestion: 'Use Pydantic models for all incoming data to enforce types and constraints automatically.',
      },
      {
        severity: 'medium',
        category: 'correctness',
        line: 45,
        title: 'Unhandled Edge Case: Empty Result Set',
        explanation: 'When the database returns no results, the function attempts to access index 0 which raises an IndexError.',
        suggestion: 'Check if the result set is empty before accessing elements: if not results: return None',
      },
      {
        severity: 'low',
        category: 'performance',
        line: 60,
        title: 'N+1 Query Pattern',
        explanation: 'A query inside a loop causes N+1 database calls. This will degrade significantly as data grows.',
        suggestion: 'Fetch all needed data in a single query using JOIN or IN clause before the loop.',
      },
    ],
    strengths: [
      'SQL injection fixed with parameterized queries',
      'Error handling added to critical paths',
      'Code structure is improving',
      'Better variable naming',
    ],
    priorityActions: [
      'Complete input validation for all endpoints',
      'Fix the N+1 query pattern for performance',
      'Handle empty result sets explicitly',
    ],
    createdAt: makeDate(7),
  },
  {
    id: 'demo_review_3',
    userId: DEMO_USER_ID,
    projectId: 'demo_project',
    filename: 'user_service.py',
    language: 'Python',
    overallScore: 91,
    qualityLabel: 'Excellent',
    summary: 'Excellent code quality. The service is now secure, maintainable, and well-structured. All critical issues from previous reviews have been resolved. Pydantic validation, parameterized queries, and comprehensive error handling are in place.',
    categories: {
      correctness: 93,
      security: 95,
      performance: 88,
      maintainability: 91,
      readability: 92,
    },
    findings: [
      {
        severity: 'low',
        category: 'performance',
        line: 72,
        title: 'Consider Caching for Frequently Accessed Data',
        explanation: 'The user lookup is called frequently and could benefit from a short-lived cache to reduce database load.',
        suggestion: 'Use functools.lru_cache or Redis for frequently accessed, rarely changing data.',
      },
      {
        severity: 'info',
        category: 'readability',
        line: 15,
        title: 'Docstring Could Be More Detailed',
        explanation: 'The function docstring is present but could include parameter types and return value documentation.',
        suggestion: 'Use Google or NumPy style docstrings with Args: and Returns: sections.',
      },
    ],
    strengths: [
      'Comprehensive Pydantic input validation',
      'Parameterized queries — no SQL injection risk',
      'Excellent error handling with proper logging',
      'Clean separation of concerns',
      'Good test coverage indicators',
      'Readable and well-documented code',
    ],
    priorityActions: [
      'Consider adding caching for high-traffic paths',
      'Enhance docstrings for better developer experience',
    ],
    createdAt: makeDate(1),
  },
];

export const DEMO_HISTORICAL_INSIGHT: StoredHistoricalInsight = {
  userId: DEMO_USER_ID,
  currentReviewId: 'demo_review_3',
  totalReviews: 3,
  totalGain: 29,
  scoreTrajectory: [
    { reviewId: 'demo_review_1', score: 62, createdAt: makeDate(14) },
    { reviewId: 'demo_review_2', score: 76, createdAt: makeDate(7) },
    { reviewId: 'demo_review_3', score: 91, createdAt: makeDate(1) },
  ],
  insight: {
    improvements: [
      'Security improved dramatically from 45 → 72 → 95 (+50 points)',
      'Error handling resolved — no longer present in review 3',
      'SQL injection vulnerability fixed in review 2 and maintained',
      'Code structure and maintainability steadily improved',
    ],
    regressions: [],
    recurringWeaknesses: [
      { topic: 'Input validation', count: 2, severity: 'high' },
    ],
    resolvedWeaknesses: [
      'SQL Injection Vulnerability',
      'Missing Error Handling',
      'Magic Numbers',
    ],
    recommendation: 'Outstanding progress over 3 reviews — you\'ve improved by 29 points. Your biggest strength is the dramatic security improvement (45 → 95). Your next opportunity is optimizing performance by implementing caching for frequently accessed data, which could push your score above 95.',
    overallTrend: 'improving',
  },
  updatedAt: makeDate(1),
};

export class DemoService {
  /**
   * Returns the three demo reviews simulating a developer's journey.
   */
  getReviews(): FullReviewDocument[] {
    return DEMO_REVIEWS;
  }

  /**
   * Returns a specific demo review by version (1, 2, or 3).
   */
  getReviewByVersion(version: 1 | 2 | 3): FullReviewDocument {
    return DEMO_REVIEWS[version - 1];
  }

  /**
   * Returns the pre-computed historical insight for the demo.
   */
  getHistoricalInsight(): StoredHistoricalInsight {
    return DEMO_HISTORICAL_INSIGHT;
  }

  /**
   * Returns a demo dashboard combining all three reviews.
   */
  getDashboard(): any {
    return {
      userId: DEMO_USER_ID,
      isDemo: true,
      totalReviews: 3,
      averageScore: 76,
      latestScore: 91,
      scoreDelta: 15,
      categoryAverages: {
        correctness: 75,
        security: 71,
        performance: 79,
        maintainability: 79,
        readability: 82,
      },
      scoreTrajectory: DEMO_REVIEWS.map(r => ({
        reviewId: r.id,
        score: r.overallScore,
        createdAt: r.createdAt,
      })),
      recentReviews: DEMO_REVIEWS.slice().reverse(),
    };
  }
}
