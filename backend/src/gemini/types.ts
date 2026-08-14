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
  summary: string;
  categories: CodeReviewCategoryScores;
  findings: CodeReviewFinding[];
}
