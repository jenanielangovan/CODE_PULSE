import type { Severity, Category, CategoryScores } from '../types';

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
 * Returns a color class based on score value.
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#6366f1';
  if (score >= 70) return '#eab308';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

/**
 * Returns Tailwind color classes for severity badges.
 */
export function getSeverityClasses(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'badge-critical';
    case 'high': return 'badge-high';
    case 'medium': return 'badge-medium';
    case 'low': return 'badge-low';
    default: return 'badge-info';
  }
}

/**
 * Returns an emoji indicator for severity.
 */
export function getSeverityIcon(severity: Severity): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
}

/**
 * Returns a descriptive label for score delta.
 */
export function formatScoreDelta(delta: number | null): string {
  if (delta === null) return '';
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

/**
 * Returns a relative time string, e.g. "2 days ago".
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

/**
 * Formats a date for display.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Returns categories sorted by score (lowest first — for priority display).
 */
export function getSortedCategoriesByScore(categories: CategoryScores): [Category, number][] {
  return (Object.entries(categories) as [Category, number][]).sort(([, a], [, b]) => a - b);
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Returns the stroke-dashoffset for a circular SVG progress ring.
 * circumference = 2π * radius
 */
export function getCircleDashOffset(score: number, radius = 45): number {
  const circumference = 2 * Math.PI * radius;
  return circumference * (1 - clamp(score) / 100);
}

/**
 * Returns category color for charts.
 */
export const CATEGORY_COLORS: Record<Category, string> = {
  correctness: '#6366f1',
  security: '#ef4444',
  performance: '#f97316',
  maintainability: '#22c55e',
  readability: '#a78bfa',
};

/**
 * Returns a language badge color.
 */
export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    Python: '#3b82f6',
    JavaScript: '#eab308',
    TypeScript: '#6366f1',
    Java: '#f97316',
    Go: '#06b6d4',
    'C++': '#8b5cf6',
    'C#': '#10b981',
    Rust: '#f59e0b',
    Ruby: '#ef4444',
    PHP: '#8b5cf6',
  };
  return colors[language] || '#6b7280';
}
