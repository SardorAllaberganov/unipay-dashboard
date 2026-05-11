import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompact, formatUZS } from '@/lib/format';
import { useNetworkState } from '@/hooks/useNetworkState';
import {
  ChartSkeleton,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';
import { useSummary } from '../hooks/useSummary';
import type { ReportDateRange } from '../api';

interface Props {
  range?: ReportDateRange;
}

const tiyinsToUzs = (n: number) => Math.round(n / 100);

// Brand-led palette via scale tokens (§0.1) — no hex. Cycles when departments > 6.
const SLICE_COLORS = [
  'hsl(var(--brand-600))',
  'hsl(var(--brand-400))',
  'hsl(var(--success-600))',
  'hsl(var(--warning-600))',
  'hsl(var(--info-600))',
  'hsl(var(--slate-400))',
];

export function DepartmentBreakdownChart({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useSummary(range);

  const departments = useMemo(() => query.data?.departments ?? [], [query.data]);
  const total = useMemo(
    () => departments.reduce((s, d) => s + d.amount, 0),
    [departments],
  );

  const slices = useMemo(
    () =>
      departments.map((d, idx) => ({
        ...d,
        value: tiyinsToUzs(d.amount),
        color: SLICE_COLORS[idx % SLICE_COLORS.length],
      })),
    [departments],
  );

  const body = (() => {
    if (query.isPending) return <ChartSkeleton heightClassName="h-72" />;
    if (query.isError) {
      if (!online) return <PanelOfflineState className="h-72" />;
      return <PanelErrorState className="h-72" onRetry={() => query.refetch()} />;
    }
    if (slices.length === 0 || total === 0) {
      return (
        <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-card/40 text-center text-sm text-muted-foreground">
          {t('reports.byDay.emptyBody')}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="relative h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                stroke="hsl(var(--card))"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.id} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [formatUZS(value), t('reports.charts.departments.tooltipAmount')]}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label is clamped to the donut hole (innerRadius × 2 = 160px) so
              long UZS amounts can't overflow into the slice area. Compact
              notation ("298,4 млн") keeps the number short; the currency code
              lives on the small line below. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="max-w-[9.5rem] truncate text-2xl tabular font-semibold text-foreground md:text-3xl">
              {formatCompact(tiyinsToUzs(total))}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('reports.charts.departments.totalLabel')} · UZS
            </span>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          {slices.map((slice) => (
            <li key={slice.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block size-2.5 shrink-0 rounded-sm"
                style={{ background: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {slice.name}
              </span>
              <span className="whitespace-nowrap tabular text-muted-foreground">
                {formatUZS(slice.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  })();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t('reports.charts.departments.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!online && !query.isError ? <PanelOfflineNote /> : null}
        {query.data?._meta?.partial ? (
          <PanelPartialNote
            shown={query.data._meta.shown ?? slices.length}
            total={query.data._meta.total ?? 3}
          />
        ) : null}
        {body}
      </CardContent>
    </Card>
  );
}
