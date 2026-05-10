import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface Props {
  data: number[];
  height?: number;
  className?: string;
  ariaLabel?: string;
}

// Recharts renders the chart's vector internally — no hand-authored vector markup here (§0.9).
export function KpiSparkline({ data, height = 32, className, ariaLabel }: Props) {
  if (data.length < 2) {
    return <div className={cn('w-full', className)} style={{ height }} aria-hidden />;
  }

  const series = data.map((value, index) => ({ index, value }));
  const gradientId = `kpi-spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn('w-full', className)}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--brand-600))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--brand-600))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--brand-600))"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
