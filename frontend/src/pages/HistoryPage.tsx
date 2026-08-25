import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle,
  Zap, RefreshCw, Brain, ChevronRight
} from 'lucide-react';
import type { StoredHistoricalInsight } from '../types';
import { getHistoricalInsights, getDemoInsights } from '../services/api';
import { QualityTrajectoryChart } from '../components/QualityTrajectoryChart';
import { LoadingSpinner, ErrorState, DemoAlert, EmptyState } from '../components/UIStates';
import { getScoreColor, formatDate } from '../utils/formatters';

const USER_ID = 'default_user';

export default function HistoryPage() {
  const [data, setData] = useState<StoredHistoricalInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchData = async (useDemo = false) => {
    setLoading(true);
    setError(null);
    try {
      const insight = useDemo
        ? await getDemoInsights()
        : await getHistoricalInsights(USER_ID);
      setData(insight);
      setIsDemo(useDemo || !!insight.isDemo);
    } catch {
      // Auto-fallback to demo
      try {
        const demo = await getDemoInsights();
        setData(demo);
        setIsDemo(true);
      } catch {
        setError('Historical insights unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner message="Loading your development journey..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="glass-card p-10 w-full max-w-lg">
          <ErrorState title="History unavailable" message={error} onRetry={() => fetchData()} />
        </div>
      </div>
    );
  }

  if (!data || data.totalReviews < 2) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-200 mb-2">Historical Intelligence</h1>
            <p className="text-slate-400">Your development journey over time</p>
          </div>
          <div className="glass-card p-10">
            <EmptyState
              icon="🧠"
              title="Not enough history yet"
              description="Submit at least 2 code reviews to unlock historical intelligence — recurring patterns, trend analysis, and personalized recommendations."
              action={
                <Link to="/review" className="btn-primary flex items-center gap-2 mt-4">
                  <Zap size={15} />
                  Submit a Review
                </Link>
              }
            />
          </div>
          <div className="mt-6">
            <button
              onClick={() => fetchData(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Brain size={15} />
              View Demo Historical Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { insight, scoreTrajectory, totalGain, totalReviews } = data;

  const TrendIcon = insight.overallTrend === 'improving' ? TrendingUp
    : insight.overallTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = insight.overallTrend === 'improving' ? '#22c55e'
    : insight.overallTrend === 'declining' ? '#ef4444' : '#94a3b8';
  const trendLabel = insight.overallTrend === 'improving' ? 'Improving'
    : insight.overallTrend === 'declining' ? 'Declining' : 'Stable';

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-slate-200 mb-1">Your Development Journey</h1>
            <p className="text-slate-400">Historical intelligence powered by Gemini</p>
          </div>
          <button
            onClick={() => fetchData(false)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {isDemo && <DemoAlert />}

        {/* Trajectory hero */}
        <div className="glass-card p-6 md:p-8 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Journey */}
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Score Journey
              </p>
              <div className="flex items-center flex-wrap gap-2">
                {scoreTrajectory.map((snap, i) => (
                  <Fragment key={snap.reviewId}>
                    <div className="flex flex-col items-center">
                      <span
                        className="text-2xl md:text-3xl font-bold tabular-nums"
                        style={{ color: getScoreColor(snap.score) }}
                      >
                        {snap.score}
                      </span>
                      <span className="text-xs text-slate-600 mt-0.5">
                        {formatDate(snap.createdAt)}
                      </span>
                    </div>
                    {i < scoreTrajectory.length - 1 && (
                      <ChevronRight size={20} className="text-slate-600" />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-row md:flex-col gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Change</p>
                <p
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: totalGain >= 0 ? '#22c55e' : '#ef4444' }}
                >
                  {totalGain >= 0 ? '+' : ''}{totalGain}
                </p>
                <p className="text-xs text-slate-600">points</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Reviews</p>
                <p className="text-3xl font-bold text-slate-200">{totalReviews}</p>
                <p className="text-xs text-slate-600">submitted</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Trend</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <TrendIcon size={18} style={{ color: trendColor }} />
                  <span className="text-sm font-semibold" style={{ color: trendColor }}>
                    {trendLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <QualityTrajectoryChart snapshots={scoreTrajectory} height={200} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Improvements */}
          {insight.improvements.length > 0 && (
            <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={14} />
                What Improved
              </h2>
              <ul className="space-y-3">
                {insight.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regressions */}
          {insight.regressions.length > 0 && (
            <div className="glass-card p-6 animate-fade-up border-red-500/10" style={{ animationDelay: '0.15s' }}>
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingDown size={14} />
                Regressions Detected
              </h2>
              <ul className="space-y-3">
                {insight.regressions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recurring weaknesses */}
          {insight.recurringWeaknesses.length > 0 && (
            <div className="glass-card p-6 animate-fade-up border-yellow-500/10" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle size={14} />
                Recurring Patterns
              </h2>
              <div className="space-y-3">
                {insight.recurringWeaknesses.map((weakness, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-yellow-500/10 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-sm text-slate-200">{weakness.topic}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: weakness.severity === 'critical' ? 'rgba(220,38,38,0.15)' :
                            weakness.severity === 'high' ? 'rgba(249,115,22,0.15)' : 'rgba(234,179,8,0.15)',
                          color: weakness.severity === 'critical' ? '#f87171' :
                            weakness.severity === 'high' ? '#fb923c' : '#fbbf24',
                        }}
                      >
                        {weakness.severity}
                      </span>
                      <span className="text-xs text-slate-500">{weakness.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved issues */}
          {insight.resolvedWeaknesses.length > 0 && (
            <div className="glass-card p-6 animate-fade-up border-green-500/10" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 size={14} />
                Resolved Issues
              </h2>
              <ul className="space-y-2">
                {insight.resolvedWeaknesses.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm text-slate-300 line-through opacity-60">{item}</span>
                    <span className="text-xs text-green-400 font-medium ml-1">Fixed</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Gemini Recommendation — featured section */}
        <div
          className="mt-6 glass-card p-6 md:p-8 relative overflow-hidden animate-fade-up border-indigo-500/20"
          style={{ animationDelay: '0.25s' }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-[40px]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Brain size={16} className="text-indigo-400" />
              </div>
              <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
                Gemini's Recommendation
              </h2>
            </div>
            <p className="text-slate-200 text-lg leading-relaxed max-w-3xl">
              "{insight.recommendation}"
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Link to="/review" className="btn-primary flex-1 flex items-center justify-center gap-2 py-3" id="history-new-review">
            <Zap size={16} />
            Review More Code
          </Link>
          <Link to="/dashboard" className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
