import { CodeReviewCategoryScores } from '../gemini/types.js';

/**
 * Scoring weights — documented for transparency and competition submission.
 *
 * Weights chosen to emphasize correctness and security as the highest impact dimensions:
 *   Correctness    30% — buggy code is fundamentally broken
 *   Security       25% — vulnerabilities have real-world impact
 *   Performance    20% — efficiency matters in production
 *   Maintainability 15% — long-term health of the codebase
 *   Readability    10% — important but least critical
 */
const SCORING_WEIGHTS = {
  correctness: 0.30,
  security: 0.25,
  performance: 0.20,
  maintainability: 0.15,
  readability: 0.10,
} as const;

export interface WeightedScore {
  overallScore: number;
  breakdown: {
    category: keyof CodeReviewCategoryScores;
    rawScore: number;
    weight: number;
    contribution: number;
  }[];
}

/**
 * Deterministic weighted scoring layer.
 *
 * We do NOT blindly trust the single Gemini-generated overall score.
 * Instead, we use category scores + documented weights to produce
 * a consistent, auditable overall score.
 *
 * Given identical category scores, this always returns the same overall score.
 */
export function computeWeightedScore(categories: CodeReviewCategoryScores): WeightedScore {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const breakdown = (Object.entries(SCORING_WEIGHTS) as [keyof CodeReviewCategoryScores, number][]).map(
    ([category, weight]) => {
      const rawScore = clamp(categories[category] ?? 70);
      return {
        category,
        rawScore,
        weight,
        contribution: rawScore * weight,
      };
    }
  );

  const overallScore = Math.round(breakdown.reduce((sum, b) => sum + b.contribution, 0));

  return { overallScore, breakdown };
}

/**
 * Returns a human-readable quality label for a given score.
 */
export function getQualityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Returns a CSS color class tag for a severity level.
 */
export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'blue';
    default: return 'gray';
  }
}
