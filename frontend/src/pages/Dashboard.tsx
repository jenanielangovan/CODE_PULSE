import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DashboardData } from '../types';
import { getDashboard, getDemoDashboard } from '../services/api';
import { ScoreRing } from '../components/ScoreRing';
import { CategoryScoreBars } from '../components/CategoryScoreBars';
import { QualityTrajectoryChart } from '../components/QualityTrajectoryChart';
import { LoadingSpinner, ErrorState, DemoAlert } from '../components/UIStates';
import { timeAgo, formatScoreDelta, getScoreColor, getLanguageColor } from '../utils/formatters';

const USER_ID = 'default_user';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchData = async (useDemo = false) => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = useDemo
        ? await getDemoDashboard()
        : await getDashboard(USER_ID);
      setData(dashboard);
      setIsDemo(useDemo || !!dashboard.isDemo);
    } catch (err: any) {
      if (!useDemo) {
        // Auto-fallback to demo if backend is unavailable
        try {
          const demoData = await getDemoDashboard();
          setData(demoData);
          setIsDemo(true);
        } catch {
          setError('Dashboard unavailable. Please check your connection.');
        }
      } else {
        setError('Failed to load demo dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <LoadingSpinner message="Loading dashboard..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="glass-card p-10 w-full max-w-lg">
          <ErrorState title="Dashboard unavailable" message={error} onRetry={() => fetchData()} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreDeltaStr = formatScoreDelta(data.scoreDelta);
  const trend = data.scoreDelta !== null
    ? data.scoreDelta > 0 ? 'up' : data.scoreDelta < 0 ? 'down' : 'stable'
    : 'stable';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-slate-200 mb-1">Dashboard</h1>
            <p className="text-slate-400">Your code quality overview</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(false)}
              className="btn-secondary flex items-center gap-2 text-sm"
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link to="/review" className="btn-primary flex items-center gap-2 text-sm" id="dashboard-new-review">
              <Zap size={14} />
              New Review
            </Link>
          </div>
        </div>

        {isDemo && <DemoAlert />}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {/* Latest score */}
          <div className="glass-card p-5 col-span-2 md:col-span-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Latest Score</p>
            <ScoreRing score={data.latestScore} size={96} />
          </div>

          {/* Score delta */}
          <div className="glass-card p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">vs. Previous</p>
            <div className="mt-4">
              <div className={`flex items-center gap-2 ${trendColor}`}>
                <TrendIcon size={20} />
                <span className="text-3xl font-bold tabular-nums">{scoreDeltaStr || '—'}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">points</p>
            </div>
          </div>

          {/* Total reviews */}
          <div className="glass-card p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviews</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-200 tabular-nums">{data.totalReviews}</span>
              <p className="text-xs text-slate-600 mt-1">total submitted</p>
            </div>
          </div>

          {/* Average score */}
          <div className="glass-card p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average</p>
            <div className="mt-4">
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: getScoreColor(data.averageScore) }}
              >
                {data.averageScore}
              </span>
              <p className="text-xs text-slate-600 mt-1">quality score</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Category averages */}
            {data.categoryAverages && Object.keys(data.categoryAverages).length > 0 && (
              <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  Quality Dimensions
                </h2>
                <CategoryScoreBars categories={data.categoryAverages} />
              </div>
            )}

            {/* Recent reviews */}
            {data.recentReviews && data.recentReviews.length > 0 && (
              <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Recent Reviews
                </h2>
                <div className="space-y-3">
                  {data.recentReviews.slice(0, 4).map((review, i) => (
                    <Link
                      key={review.id || i}
                      to={review.id ? `/results/${review.id}` : '/review'}
                      state={{ review }}
                      className="flex items-center justify-between py-2.5 border-b border-indigo-500/8 last:border-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: getLanguageColor(review.language) }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 truncate">{review.filename}</p>
                          <p className="text-xs text-slate-500">{timeAgo(review.createdAt)}</p>
                        </div>
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums shrink-0 ml-2"
                        style={{ color: getScoreColor(review.overallScore) }}
                      >
                        {review.overallScore}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — trajectory */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Quality Trajectory
                </h2>
                {data.scoreTrajectory.length >= 2 && (
                  <div className="text-xs text-slate-500">
                    {data.scoreTrajectory[0].score}
                    {' → '}
                    <span style={{ color: getScoreColor(data.scoreTrajectory[data.scoreTrajectory.length - 1].score) }}>
                      {data.scoreTrajectory[data.scoreTrajectory.length - 1].score}
                    </span>
                  </div>
                )}
              </div>
              <QualityTrajectoryChart snapshots={data.scoreTrajectory} height={240} />
            </div>

            {/* CTA to history */}
            <Link
              to="/history"
              className="glass-card p-6 flex items-center justify-between hover:border-indigo-500/30 transition-colors group cursor-pointer"
              id="dashboard-view-history"
            >
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Historical Intelligence</h3>
                <p className="text-sm text-slate-400">
                  See recurring patterns, improvements, and Gemini's personalized recommendation.
                </p>
              </div>
              <TrendingUp size={24} className="text-indigo-400 shrink-0 ml-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
