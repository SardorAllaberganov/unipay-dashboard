import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Sparkline } from './Sparkline';
import { cn } from '@/lib/utils';
import { formatDelta } from '@/lib/format';

interface Props {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  spark?: number[];
  icon?: LucideIcon;
  className?: string;
}

export function KpiCard({ label, value, delta, deltaLabel, spark, icon: Icon, className }: Props) {
  const trend = delta === undefined ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
        ? 'text-danger'
        : 'text-muted-foreground';

  return (
    <Card className={cn('p-4 md:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {Icon ? <Icon className="size-4" aria-hidden /> : null}
            <span>{label}</span>
          </div>
          <div className="mt-2 truncate text-3xl font-semibold tabular text-foreground">
            {value}
          </div>
          {delta !== undefined ? (
            <div className={cn('mt-1 inline-flex items-center gap-1 text-sm tabular', trendColor)}>
              <TrendIcon className="size-4" aria-hidden />
              <span>{formatDelta(delta)}</span>
              {deltaLabel ? (
                <span className="text-muted-foreground"> · {deltaLabel}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        {spark && spark.length > 1 ? (
          <Sparkline data={spark} width={80} height={32} className="shrink-0" />
        ) : null}
      </div>
    </Card>
  );
}
