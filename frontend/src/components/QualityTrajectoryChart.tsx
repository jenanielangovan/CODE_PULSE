import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ScoreSnapshot } from '../types';
import { formatDate, getScoreColor } from '../utils/formatters';

interface QualityTrajectoryChartProps {
  snapshots: ScoreSnapshot[];
  height?: number;
}

interface ChartDataPoint {
  date: string;
  score: number;
  reviewId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const score = payload[0].value;
  return (
    <div className="glass-card px-3 py-2.5 text-xs shadow-xl border-indigo-500/30">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-bold text-lg" style={{ color: getScoreColor(score) }}>
        {score}
        <span className="text-slate-400 text-xs font-normal ml-1">/ 100</span>
      </p>
    </div>
  );
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const color = getScoreColor(payload.score);
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke="rgba(10,10,20,0.8)"
        strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
    </g>
  );
};

export function QualityTrajectoryChart({ snapshots, height = 220 }: QualityTrajectoryChartProps) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        No review history yet. Submit your first review to start tracking.
      </div>
    );
  }

  const data: ChartDataPoint[] = snapshots.map(s => ({
    date: formatDate(s.createdAt),
    score: s.score,
    reviewId: s.reviewId,
  }));

  const minScore = Math.max(0, Math.min(...data.map(d => d.score)) - 10);
  const maxScore = Math.min(100, Math.max(...data.map(d => d.score)) + 10);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="trajectoryGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(99,102,241,0.08)"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          domain={[minScore, maxScore]}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Reference zones */}
        <ReferenceLine y={90} stroke="rgba(34,197,94,0.15)" strokeDasharray="4 4" label="" />
        <ReferenceLine y={70} stroke="rgba(234,179,8,0.15)" strokeDasharray="4 4" label="" />

        <Line
          type="monotone"
          dataKey="score"
          stroke="url(#trajectoryGradient)"
          strokeWidth={2.5}
          dot={<CustomDot />}
          activeDot={{ r: 7, fill: '#818cf8', stroke: 'rgba(10,10,20,0.8)', strokeWidth: 2 }}
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
