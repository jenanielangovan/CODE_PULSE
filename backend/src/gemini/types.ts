export interface CodeReviewCategoryScores {
  correctness: number;
  security: number;
  performance: number;
  maintainability: number;
  readability: number;
}

export interface CodeReviewFinding {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: 'correctness' | 'security' | 'performance' | 'maintainability' | 'readability';
  line: number;
  title: string;
  explanation: string;
  suggestion: string;
}

export interface CodeReviewResponse {
  overallScore: number;
  language: string;
  summary: string;
  categories: CodeReviewCategoryScores;
  findings: CodeReviewFinding[];
  strengths: string[];
  priorityActions: string[];
}

export interface HistoricalInsight {
  improvements: string[];
  regressions: string[];
  recurringWeaknesses: RecurringWeakness[];
  resolvedWeaknesses: string[];
  recommendation: string;
  overallTrend: 'improving' | 'declining' | 'stable';
}

export interface RecurringWeakness {
  topic: string;
  count: number;
  severity: string;
}
