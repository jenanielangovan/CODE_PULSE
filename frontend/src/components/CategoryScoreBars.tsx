import type { Category, CategoryScores } from '../types';
import { CATEGORY_COLORS, getScoreColor } from '../utils/formatters';

const CATEGORY_LABELS: Record<Category, string> = {
  correctness: 'Correctness',
  security: 'Security',
  performance: 'Performance',
  maintainability: 'Maintainability',
  readability: 'Readability',
};

interface CategoryScoreBarsProps {
  categories: CategoryScores;
}

export function CategoryScoreBars({ categories }: CategoryScoreBarsProps) {
  const entries = Object.entries(categories) as [Category, number][];
  // Sort by score ascending to highlight weakest areas first
  const sorted = [...entries].sort(([, a], [, b]) => a - b);

  return (
    <div className="space-y-4" role="list" aria-label="Category scores">
      {sorted.map(([category, score]) => {
        const color = CATEGORY_COLORS[category];
        return (
          <div key={category} role="listitem">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-300">
                {CATEGORY_LABELS[category]}
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: getScoreColor(score) }}
                aria-label={`${score} out of 100`}
              >
                {score}
              </span>
            </div>
            {/* Progress bar track */}
            <div
              className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${score}%`,
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                  boxShadow: `0 0 8px ${color}44`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
