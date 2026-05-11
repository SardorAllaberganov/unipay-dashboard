import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDelta } from '@/lib/format';
import { KpiSparkline } from './KpiSparkline';

interface Props {
  label: string;
  value: string;
  valueTone?: 'default' | 'destructive';
  delta?: number;
  deltaLabel?: string;
  subtitle?: string;
  spark?: number[];
  icon?: LucideIcon;
  to?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  valueTone = 'default',
  delta,
  deltaLabel,
  subtitle,
  spark,
  icon: Icon,
  to,
  className,
}: Props) {
  const inner = (
    <Card
      className={cn(
        'flex h-full flex-col gap-3 p-5 transition-colors',
        to && 'hover:bg-muted/40 focus-visible:bg-muted/40',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {Icon ? <Icon className="size-4" aria-hidden /> : null}
        <span>{label}</span>
      </div>

      <div
        className={cn(
          // Wrap at the UZS space separators on narrow cards instead of clipping with ellipsis.
          'text-2xl font-semibold font-mono tabular leading-tight md:text-3xl md:leading-none',
          valueTone === 'destructive' ? 'text-destructive' : 'text-foreground',
        )}
      >
        {value}
      </div>

      {delta !== undefined ? (
        <DeltaRow delta={delta} deltaLabel={deltaLabel} />
      ) : subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}

      {subtitle && delta !== undefined ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}

      {spark && spark.length > 1 ? (
        <div className="mt-auto">
          <KpiSparkline data={spark} height={32} ariaLabel={`${label} — спарклайн`} />
        </div>
      ) : null}
    </Card>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function DeltaRow({ delta, deltaLabel }: { delta: number; deltaLabel?: string }) {
  const TrendIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const trendColor =
    delta > 0
      ? 'text-success-700 dark:text-success-400'
      : delta < 0
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <div className={cn('inline-flex items-center gap-1 text-sm tabular', trendColor)}>
      <TrendIcon className="size-4" aria-hidden />
      <span>{formatDelta(delta)}</span>
      {deltaLabel ? <span className="text-muted-foreground"> · {deltaLabel}</span> : null}
    </div>
  );
}
