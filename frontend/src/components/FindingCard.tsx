import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import type { Finding, Severity } from '../types';
import { getSeverityClasses } from '../utils/formatters';

interface FindingCardProps {
  finding: Finding;
  index: number;
}

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const SEVERITY_ICONS: Record<Severity, ReactNode> = {
  critical: <AlertTriangle size={12} />,
  high: <AlertTriangle size={12} />,
  medium: <AlertTriangle size={12} />,
  low: <Info size={12} />,
  info: <Info size={12} />,
};

export function FindingCard({ finding, index }: FindingCardProps) {
  const [expanded, setExpanded] = useState(index < 2); // First 2 open by default

  return (
    <div className="glass-card overflow-hidden transition-all duration-200">
      <button
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        id={`finding-${index}`}
      >
        {/* Severity badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5 ${getSeverityClasses(finding.severity)}`}
        >
          {SEVERITY_ICONS[finding.severity]}
          {SEVERITY_LABELS[finding.severity]}
        </span>

        {/* Title and location */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-200 text-sm leading-tight">{finding.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 capitalize">{finding.category}</span>
            {finding.line > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500 font-mono">Line {finding.line}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand icon */}
        <span className="text-slate-500 shrink-0 mt-0.5">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-3 border-t border-indigo-500/10"
          role="region"
          aria-labelledby={`finding-${index}`}
        >
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Why it matters
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">{finding.explanation}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Recommended fix
              </h4>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('open-gemini-chat', {
                      detail: {
                        initialPrompt: `Can you explain why "${finding.title}" is an issue and provide a complete, drop-in refactored code fix?`,
                        context: { finding },
                        autoSend: true,
                      },
                    })
                  );
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all hover:scale-105"
                title="Open interactive discussion with Gemini AI for this finding"
              >
                <span>✨ Ask Gemini to Fix</span>
              </button>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-3 border border-indigo-500/10">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                {finding.suggestion}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FindingsListProps {
  findings: Finding[];
}

export function FindingsList({ findings }: FindingsListProps) {
  if (findings.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">✓</span>
        </div>
        <p className="text-slate-300 font-medium">No significant issues found</p>
        <p className="text-slate-500 text-sm mt-1">This code looks clean!</p>
      </div>
    );
  }

  // Group by severity
  const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const grouped = severityOrder.reduce((acc, sev) => {
    const items = findings.filter(f => f.severity === sev);
    if (items.length > 0) acc[sev] = items;
    return acc;
  }, {} as Record<Severity, Finding[]>);

  let globalIndex = 0;

  return (
    <div className="space-y-6">
      {severityOrder.map(severity => {
        const group = grouped[severity];
        if (!group) return null;

        const labels: Record<Severity, string> = {
          critical: '🔴 Critical',
          high: '🟠 High',
          medium: '🟡 Medium',
          low: '🔵 Low',
          info: '⚪ Info',
        };

        return (
          <div key={severity}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {labels[severity]} · {group.length} issue{group.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-2">
              {group.map(finding => {
                const idx = globalIndex++;
                return <FindingCard key={idx} finding={finding} index={idx} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
