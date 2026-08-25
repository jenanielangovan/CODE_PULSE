import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Shield, Zap, TrendingUp, Brain, Code2,
  ChevronRight, CheckCircle2, GitBranch
} from 'lucide-react';

const FEATURES = [
  {
    icon: Code2,
    title: 'Multi-Language Reviews',
    description: 'Python, JavaScript, TypeScript, Java, Go, C++, Rust and more. One review engine, every language.',
    color: '#6366f1',
  },
  {
    icon: Shield,
    title: 'Security Analysis',
    description: 'OWASP Top 10 vulnerability detection. SQL injection, XSS, unsafe patterns caught before they ship.',
    color: '#ef4444',
  },
  {
    icon: Zap,
    title: 'Quality Scoring',
    description: 'Five-dimensional scoring across Correctness, Security, Performance, Maintainability, and Readability.',
    color: '#eab308',
  },
  {
    icon: Brain,
    title: 'Historical Intelligence',
    description: 'The key differentiator. CodePulse remembers how you code — and builds a personal intelligence profile over time.',
    color: '#22c55e',
  },
  {
    icon: TrendingUp,
    title: 'Growth Trajectory',
    description: 'Watch your quality score evolve. See where you improved, what patterns recur, and what to tackle next.',
    color: '#a78bfa',
  },
  {
    icon: GitBranch,
    title: 'Pattern Detection',
    description: 'CodePulse detects issues that appear across multiple reviews — and tells you when you\'ve finally resolved them.',
    color: '#06b6d4',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Submit Code', description: 'Paste your code or select a language. CodePulse accepts any source file.' },
  { step: '02', title: 'Gemini Reviews', description: 'Vertex AI Gemini analyzes across 5 quality dimensions in seconds.' },
  { step: '03', title: 'Structured Results', description: 'Get an explainable score, severity-grouped findings, and actionable recommendations.' },
  { step: '04', title: 'Historical Learning', description: 'With each review, CodePulse builds a profile of your patterns, improvements, and recurring issues.' },
  { step: '05', title: 'Personalized Intelligence', description: 'Gemini synthesizes your entire history into targeted advice — just for you.' },
];

const GCP_SERVICES = [
  { name: 'Vertex AI', purpose: 'Gemini inference', icon: '🧠' },
  { name: 'Cloud Run', purpose: 'Serverless API', icon: '🚀' },
  { name: 'Firestore', purpose: 'Review persistence', icon: '🗄️' },
  { name: 'Cloud Build', purpose: 'CI/CD pipeline', icon: '🔧' },
  { name: 'Artifact Registry', purpose: 'Container images', icon: '📦' },
  { name: 'Firebase Auth', purpose: 'Authentication', icon: '🔐' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center animate-fade-up">
          {/* Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide mb-8">
            <Activity size={12} className="animate-pulse" />
            AIM Code Kitchen Season 01 · Powered by Google Cloud
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <span className="gradient-text">CodePulse</span>
            <br />
            <span className="text-slate-200 text-4xl sm:text-5xl font-bold">
              Your code review never sleeps.
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered code review that doesn't just evaluate your code —{' '}
            <strong className="text-slate-200">it remembers how you improve.</strong>
            {' '}Built on Google Cloud, powered by Gemini.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/review"
              className="btn-primary flex items-center gap-2 text-base px-8 py-3.5"
              id="hero-start-reviewing"
            >
              <Zap size={18} />
              Start Reviewing
            </Link>
            <Link
              to="/dashboard"
              className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5"
              id="hero-explore-dashboard"
            >
              Explore Dashboard
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Trajectory preview */}
          <div className="mt-16 inline-flex items-center gap-3 glass-card px-6 py-4">
            <span className="text-slate-500 text-sm">Developer journey</span>
            {[62, 76, 84, 91].map((score, i) => (
              <Fragment key={score}>
                <div className="flex flex-col items-center">
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: score >= 90 ? '#22c55e' : score >= 80 ? '#6366f1' : score >= 70 ? '#eab308' : '#f97316' }}
                  >
                    {score}
                  </span>
                  <span className="text-xs text-slate-600">v{i + 1}</span>
                </div>
                {i < 3 && (
                  <span className="text-slate-600 text-lg">→</span>
                )}
              </Fragment>
            ))}
            <div className="ml-2 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
              +29 pts
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-20 px-4 border-t border-indigo-500/8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-200 mb-4">
            Traditional AI reviewers have a problem
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            They evaluate code in isolation. Submit the same issue twice and you'll get the same generic advice.
            They don't know you. They don't learn with you.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { issue: 'No memory', detail: 'Each review starts from zero. Your history is invisible.' },
              { issue: 'Generic advice', detail: 'Recommendations ignore your specific recurring patterns.' },
              { issue: 'No growth signal', detail: 'You can\'t see whether you\'re actually improving over time.' },
            ].map(({ issue, detail }) => (
              <div key={issue} className="glass-card p-6 border-red-500/10 text-left">
                <div className="text-red-400 font-semibold mb-2">✗ {issue}</div>
                <p className="text-slate-400 text-sm">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-2xl font-bold text-indigo-300">
            CodePulse is different.
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-200 mb-4">How CodePulse works</h2>
            <p className="text-slate-400">From code submission to personalized developer intelligence</p>
          </div>

          <div className="flex flex-col gap-0">
            {HOW_IT_WORKS.map(({ step, title, description }, i) => (
              <div key={step} className="flex gap-6 relative">
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 to-transparent" />
                )}
                {/* Step number */}
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 z-10">
                  {step}
                </div>
                {/* Content */}
                <div className="pb-10">
                  <h3 className="font-semibold text-slate-200 mb-1">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 border-t border-indigo-500/8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-200 mb-4">Built for engineering excellence</h2>
            <p className="text-slate-400">Every feature designed around developer growth</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="glass-card p-6 hover:border-indigo-500/30 transition-colors group">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="font-semibold text-slate-200 mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Historical Intelligence highlight ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 md:p-12 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-indigo-500/10 blur-[60px]" />

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold mb-6">
                  <Brain size={12} />
                  Historical Intelligence
                </div>
                <h2 className="text-3xl font-bold text-slate-200 mb-4">
                  The code reviewer that grows with you
                </h2>
                <p className="text-slate-400 leading-relaxed mb-6">
                  After each review, CodePulse analyzes your complete history.
                  It identifies what you consistently get right, what trips you up repeatedly,
                  and generates a personal recommendation — from Gemini — based on your specific journey.
                </p>
                <div className="space-y-3">
                  {[
                    'Detect recurring weaknesses across reviews',
                    'Celebrate resolved issues',
                    'Identify category-level improvements and regressions',
                    'Personalized Gemini recommendation every time',
                  ].map(point => (
                    <div key={point} className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual example */}
              <div className="space-y-4">
                <div className="glass-card p-4 border-green-500/20">
                  <p className="text-xs text-slate-500 mb-2">IMPROVEMENT DETECTED</p>
                  <p className="text-sm text-green-400 font-medium">✓ Security improved 45 → 95 (+50 pts)</p>
                </div>
                <div className="glass-card p-4 border-yellow-500/20">
                  <p className="text-xs text-slate-500 mb-2">RECURRING PATTERN</p>
                  <p className="text-sm text-yellow-400 font-medium">⚠ Input validation · appeared in 3 reviews</p>
                </div>
                <div className="glass-card p-4 border-blue-500/20">
                  <p className="text-xs text-slate-500 mb-2">RESOLVED ISSUE</p>
                  <p className="text-sm text-blue-400 font-medium">✓ SQL injection — fixed and gone</p>
                </div>
                <div className="glass-card p-4 border-indigo-500/20">
                  <p className="text-xs text-slate-500 mb-2">GEMINI'S RECOMMENDATION</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    "Your security has improved dramatically. Focus next on defensive input validation — it's appeared in your last 3 reviews."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GCP Architecture ── */}
      <section className="py-20 px-4 border-t border-indigo-500/8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-200 mb-4">Built on Google Cloud</h2>
          <p className="text-slate-400 mb-12">
            Every component is a native GCP service. No hybrid clouds, no vendor mixing.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {GCP_SERVICES.map(({ name, purpose, icon }) => (
              <div key={name} className="glass-card p-4 flex flex-col items-center gap-2 hover:border-indigo-500/30 transition-colors">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold text-slate-200">{name}</span>
                <span className="text-xs text-slate-500 text-center">{purpose}</span>
              </div>
            ))}
          </div>

          {/* Architecture flow */}
          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-2 text-sm">
            {['Browser', 'Cloud Run', 'Vertex AI', 'Gemini', 'Firestore'].map((service, i) => (
              <Fragment key={service}>
                <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                  {service}
                </span>
                {i < 4 && <ChevronRight size={16} className="text-slate-600" />}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-indigo-500/15 blur-[40px]" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-slate-200 mb-4">
                Ready to see how you code?
              </h2>
              <p className="text-slate-400 mb-8">
                Submit your first review and start building your development intelligence profile.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/review"
                  className="btn-primary flex items-center gap-2 text-base px-8 py-3.5"
                  id="cta-start-reviewing"
                >
                  <Zap size={18} />
                  Start Reviewing
                </Link>
                <Link
                  to="/history"
                  className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5"
                  id="cta-see-demo"
                >
                  See Demo History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-indigo-500/10 py-8 px-4 text-center">
        <p className="text-slate-500 text-sm">
          CodePulse · Built for AIM Code Kitchen Season 01, Presented by Google Cloud
        </p>
        <p className="text-slate-600 text-xs mt-2">
          Powered by Vertex AI · Gemini · Cloud Run · Firestore
        </p>
      </footer>
    </div>
  );
}
