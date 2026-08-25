import { getScoreColor, getQualityLabel } from '../utils/formatters';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  animated = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = getScoreColor(score);
  const label = getQualityLabel(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={animated ? 'animate-fade-up' : ''}
        role="img"
        aria-label={`Quality score: ${score} out of 100 — ${label}`}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(99,102,241,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: animated ? 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            filter: `drop-shadow(0 0 6px ${color}66)`,
          }}
        />
        {/* Glow dot at the tip */}
        {score > 0 && (
          <circle
            cx={cx + radius * Math.cos((dashOffset / circumference) * 2 * Math.PI - Math.PI / 2)}
            cy={cy + radius * Math.sin((dashOffset / circumference) * 2 * Math.PI - Math.PI / 2)}
            r={strokeWidth / 2}
            fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        )}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums"
          style={{ color, fontSize: size * 0.22, lineHeight: 1 }}
        >
          {score}
        </span>
        {showLabel && (
          <span className="text-slate-400 mt-0.5" style={{ fontSize: size * 0.09 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
