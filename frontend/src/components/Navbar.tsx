import { Link, useLocation } from 'react-router-dom';
import { Activity, Code2, LayoutDashboard, TrendingUp, Zap } from 'lucide-react';

const NAV_LINKS = [
  { href: '/review', label: 'Review', icon: Code2 },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/history', label: 'History', icon: TrendingUp },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-indigo-500/10 bg-[#0a0a14]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Activity className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <div className="absolute inset-0 rounded-lg bg-indigo-500/20 blur-sm group-hover:blur-md transition-all" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">Code</span>
              <span className="text-slate-200">Pulse</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = location.pathname === href || location.pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <Link
            to="/review"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:-translate-y-px"
          >
            <Zap size={15} />
            <span className="hidden sm:inline">Start Review</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
