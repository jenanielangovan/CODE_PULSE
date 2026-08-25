import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import type { ReviewDocument } from '../types';
import { getReview } from '../services/api';
import { ScoreRing } from '../components/ScoreRing';
import { CategoryScoreBars } from '../components/CategoryScoreBars';
import { FindingsList } from '../components/FindingCard';
import { LoadingSpinner, ErrorState } from '../components/UIStates';
import { timeAgo, getScoreColor, getLanguageColor } from '../utils/formatters';

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [review, setReview] = useState<ReviewDocument | null>(
    (location.state as any)?.review || null
  );
  const [loading, setLoading] = useState(!review);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (review) return;
    if (!id) {
      setError('No review ID provided.');
      setLoading(false);
      return;
    }

    getReview(id)
      .then(setReview)
      .catch(() => setError('We couldn\'t load this review. It may not exist.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner message="Loading review results..." size="lg" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="glass-card p-10 w-full max-w-lg">
          <ErrorState
            title="Review not found"
            message={error || 'This review could not be loaded.'}
            onRetry={() => navigate('/review')}
          />
        </div>
      </div>
    );
  }

  const criticalCount = review.findings.filter(f => f.severity === 'critical').length;
  const highCount = review.findings.filter(f => f.severity === 'high').length;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back nav */}
        <div className="mb-6 animate-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        </div>

        {/* Hero score section */}
        <div className="glass-card p-6 md:p-8 mb-6 animate-fade-up">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Score ring */}
            <div className="shrink-0">
              <ScoreRing score={review.overallScore} size={160} animated />
            </div>

            {/* Summary */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${getLanguageColor(review.language)}20`,
                    color: getLanguageColor(review.language),
                    border: `1px solid ${getLanguageColor(review.language)}40`,
                  }}
                >
                  {review.language}
                </span>
                <span className="text-xs text-slate-500">{review.filename}</span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">
                  {review.createdAt ? timeAgo(review.createdAt) : ''}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-200 mb-3">
                {review.qualityLabel || 'Review Complete'}
                <span
                  className="ml-3 text-4xl font-extrabold tabular-nums"
                  style={{ color: getScoreColor(review.overallScore) }}
                >
                  {review.overallScore}
                  <span className="text-slate-500 text-xl font-normal">/100</span>
                </span>
              </h1>

              <p className="text-slate-300 leading-relaxed mb-4">{review.summary}</p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5 text-red-400">
                    <AlertCircle size={14} />
                    {criticalCount} critical issue{criticalCount > 1 ? 's' : ''}
                  </div>
                )}
                {highCount > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <AlertCircle size={14} />
                    {highCount} high issue{highCount > 1 ? 's' : ''}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-400">
                  {review.findings.length} total finding{review.findings.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Category scores */}
            <div className="glass-card p-6 animate-fade-up">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                Quality Dimensions
              </h2>
              <CategoryScoreBars categories={review.categories} />
            </div>

            {/* Strengths */}
            {review.strengths && review.strengths.length > 0 && (
              <div className="glass-card p-6 animate-fade-up">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  Strengths
                </h2>
                <ul className="space-y-2">
                  {review.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Priority actions */}
            {review.priorityActions && review.priorityActions.length > 0 && (
              <div className="glass-card p-6 animate-fade-up">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  Priority Actions
                </h2>
                <ol className="space-y-3">
                  {review.priorityActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-300 leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Navigation */}
            <div className="space-y-2">
              <Link
                to="/review"
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                id="review-again-btn"
              >
                Review Another File
              </Link>
              <Link
                to="/history"
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                id="view-history-btn"
              >
                <TrendingUp size={14} />
                View History
              </Link>
            </div>
          </div>

          {/* Right column — findings */}
          <div className="lg:col-span-2 animate-fade-up">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
              Findings ({review.findings.length})
            </h2>
            <FindingsList findings={review.findings} />
          </div>
        </div>
      </div>
    </div>
  );
}
