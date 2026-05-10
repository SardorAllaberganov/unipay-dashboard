import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface Props {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

// Recharts renders the SVG internally so we never author it in source (§0.9 icon discipline).
export function Sparkline({ data, width = 80, height = 24, className }: Props) {
  if (data.length < 2) {
    return <span className={cn('inline-block', className)} aria-hidden style={{ width, height }} />;
  }

  const last = data[data.length - 1] ?? 0;
  const first = data[0] ?? 0;
  const trendUp = last >= first;
  const stroke = trendUp ? 'hsl(var(--success))' : 'hsl(var(--danger))';

  const series = data.map((value, index) => ({ index, value }));

  return (
    <div
      role="img"
      aria-label={trendUp ? 'Восходящий тренд' : 'Нисходящий тренд'}
      className={cn('inline-block', className)}
      style={{ width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
