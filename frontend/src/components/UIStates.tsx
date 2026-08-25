import type { ReactNode } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ============================================================
// Loading spinner
// ============================================================
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizes = { sm: 16, md: 24, lg: 36 };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status" aria-live="polite">
      <Loader2
        size={sizes[size]}
        className="text-indigo-400 animate-spin"
        aria-hidden="true"
      />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

// ============================================================
// Analyzing loader (for code review)
// ============================================================
export function AnalyzingLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      {/* Animated pulse rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-500/40 animate-ping" style={{ animationDelay: '0.3s' }} />
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 animate-pulse">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2 10 L6 6 L8 12 L11 4 L14 14 L16 10 L18 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-slate-200 font-semibold text-lg">Analyzing your code...</p>
        <p className="text-slate-400 text-sm mt-1">Gemini is reviewing across 5 quality dimensions</p>
      </div>

      {/* Steps */}
      <div className="space-y-2 text-sm w-full max-w-xs">
        {[
          'Detecting language patterns',
          'Checking for security vulnerabilities',
          'Analyzing code structure',
          'Generating personalized insights',
        ].map((step, i) => (
          <div
            key={step}
            className="flex items-center gap-2 text-slate-400"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Error state
// ============================================================
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center" role="alert">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-200">{title}</p>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}

// ============================================================
// Demo mode alert banner
// ============================================================
export function DemoAlert() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20 mb-6">
      <span className="demo-badge shrink-0">Demo</span>
      <p className="text-sm text-yellow-200/80">
        This is demonstration data showing the CodePulse historical learning story (62 → 76 → 91).
        Connect your GCP account to review real code.
      </p>
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '📋', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <div>
        <p className="font-semibold text-slate-200">{title}</p>
        <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>
      </div>
      {action}
    </div>
  );
}
