// ============================================================
// Shared types — mirror the backend type definitions
// ============================================================

export interface CategoryScores {
  correctness: number;
  security: number;
  performance: number;
  maintainability: number;
  readability: number;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'correctness' | 'security' | 'performance' | 'maintainability' | 'readability';
export type QualityTrend = 'improving' | 'declining' | 'stable';

export interface Finding {
  severity: Severity;
  category: Category;
  line: number;
  title: string;
  explanation: string;
  suggestion: string;
}

export interface ReviewDocument {
  id?: string;
  userId: string;
  projectId: string;
  filename: string;
  language: string;
  overallScore: number;
  qualityLabel: string;
  summary: string;
  categories: CategoryScores;
  findings: Finding[];
  strengths: string[];
  priorityActions: string[];
  createdAt: string | Date;
  isDemo?: boolean;
}

export interface RecurringWeakness {
  topic: string;
  count: number;
  severity: string;
}

export interface HistoricalInsight {
  improvements: string[];
  regressions: string[];
  recurringWeaknesses: RecurringWeakness[];
  resolvedWeaknesses: string[];
  recommendation: string;
  overallTrend: QualityTrend;
}

export interface ScoreSnapshot {
  reviewId: string;
  score: number;
  createdAt: string | Date;
}

export interface StoredHistoricalInsight {
  userId: string;
  currentReviewId: string;
  totalReviews: number;
  scoreTrajectory: ScoreSnapshot[];
  totalGain: number;
  insight: HistoricalInsight;
  updatedAt: string | Date;
  isDemo?: boolean;
}

export interface DashboardData {
  userId: string;
  totalReviews: number;
  averageScore: number;
  latestScore: number;
  scoreDelta: number | null;
  categoryAverages: CategoryScores;
  scoreTrajectory: ScoreSnapshot[];
  recentReviews: ReviewDocument[];
  updatedAt: string | Date;
  isDemo?: boolean;
}

// ============================================================
// UI state types
// ============================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ReviewRequest {
  code: string;
  language: string;
  filename?: string;
  userId?: string;
  projectId?: string;
}

// ============================================================
// Language options
// ============================================================

export const SUPPORTED_LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'Python', label: 'Python' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Java', label: 'Java' },
  { value: 'Go', label: 'Go' },
  { value: 'C++', label: 'C++' },
  { value: 'C#', label: 'C#' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Swift', label: 'Swift' },
  { value: 'Kotlin', label: 'Kotlin' },
] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  correctness: 'Correctness',
  security: 'Security',
  performance: 'Performance',
  maintainability: 'Maintainability',
  readability: 'Readability',
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  correctness: 'Logic, edge cases & type safety',
  security: 'Vulnerabilities & secure patterns',
  performance: 'Efficiency & resource usage',
  maintainability: 'Structure, modularity & coupling',
  readability: 'Clarity, naming & documentation',
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};
