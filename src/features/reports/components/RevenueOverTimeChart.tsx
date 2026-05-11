import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type Granularity = 'daily' | 'weekly' | 'monthly';

interface Props {
  range?: ReportDateRange;
}

const tiyinsToUzs = (n: number) => Math.round(n / 100);

export function RevenueOverTimeChart({ range }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const query = useSummary(range);

  const series = useMemo(() => {
    if (!query.data) return [];
    const raw =
      granularity === 'daily'
        ? query.data.revenueDaily
        : granularity === 'weekly'
          ? query.data.revenueWeekly
          : query.data.revenueMonthly;
    return raw.map((p) => ({ label: p.label, display: tiyinsToUzs(p.value) }));
  }, [query.data, granularity]);

  const body = (() => {
    if (query.isPending) return <ChartSkeleton heightClassName="h-72" />;
    if (query.isError) {
      if (!online) return <PanelOfflineState className="h-72" />;
      return <PanelErrorState className="h-72" onRetry={() => query.refetch()} />;
    }
    if (series.length === 0) {
      return (
        <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-card/40 text-center text-sm text-muted-foreground">
          {t('reports.byDay.emptyBody')}
        </div>
      );
    }
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={series}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap="22%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 13, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(v: number) => formatCompact(v)}
              width={72}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [formatUZS(value), t('reports.charts.revenue.tooltipAmount')]}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Bar
              dataKey="display"
              fill="hsl(var(--brand-600))"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  })();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>{t('reports.charts.revenue.title')}</CardTitle>
        <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
          <TabsList>
            <TabsTrigger value="daily">{t('reports.charts.revenue.daily')}</TabsTrigger>
            <TabsTrigger value="weekly">{t('reports.charts.revenue.weekly')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('reports.charts.revenue.monthly')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-2">
        {!online && !query.isError ? <PanelOfflineNote /> : null}
        {query.data?._meta?.partial ? (
          <PanelPartialNote
            shown={query.data._meta.shown ?? series.length}
            total={query.data._meta.total ?? series.length}
          />
        ) : null}
        {body}
      </CardContent>
    </Card>
  );
}
