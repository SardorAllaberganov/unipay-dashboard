import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import {
  resolveDateRange,
  useDateRangeLabel,
  type DateRangeKey,
  type DateRangeValue,
} from '@/components/shared/dateRange';
import { KpiRow } from '../components/KpiRow';
import { RevenueChart } from '../components/RevenueChart';
import { PaymentStatusChart } from '../components/PaymentStatusChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { UnpaidStudents } from '../components/UnpaidStudents';
import { GreetingTitle } from '../components/GreetingTitle';
import { AIInsightsTeaser } from '@/features/coming-soon/components/AIInsightsTeaser';

// Institution copy is a placeholder until /api/organization is wired (tracked in AI_CONTEXT open work).
const PLACEHOLDER_INSTITUTION = 'УНИПЭЙ · Университет';
const RANGE_KEYS: DateRangeKey[] = ['today', 'yesterday', '7d', '30d', 'custom'];
const DEFAULT_RANGE: DateRangeKey = '30d';

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseISODay(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseRangeKey(s: string | null): DateRangeKey {
  if (s && (RANGE_KEYS as string[]).includes(s)) return s as DateRangeKey;
  return DEFAULT_RANGE;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const value: DateRangeValue = useMemo(() => {
    const rangeKey = parseRangeKey(searchParams.get('range'));
    if (rangeKey === 'custom') {
      const from = parseISODay(searchParams.get('from')) ?? undefined;
      const to = parseISODay(searchParams.get('to')) ?? undefined;
      return { range: 'custom', customFrom: from, customTo: to };
    }
    return { range: rangeKey };
  }, [searchParams]);

  const dateRangeLabel = useDateRangeLabel(value);

  const apiRange = useMemo(() => {
    const resolved = resolveDateRange(value);
    if (!resolved?.from || !resolved.to) return undefined;
    return { from: isoDay(resolved.from), to: isoDay(resolved.to) };
  }, [value]);

  const handleRangeChange = useCallback(
    (next: DateRangeValue) => {
      const sp = new URLSearchParams(searchParams);
      sp.set('range', next.range);
      if (next.range === 'custom' && next.customFrom && next.customTo) {
        sp.set('from', isoDay(next.customFrom));
        sp.set('to', isoDay(next.customTo));
      } else {
        sp.delete('from');
        sp.delete('to');
      }
      setSearchParams(sp, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={<GreetingTitle />}
        description={t('dashboard.subtitle', {
          name: PLACEHOLDER_INSTITUTION.split(' · ')[0],
          type: PLACEHOLDER_INSTITUTION.split(' · ')[1],
        })}
        actions={
          <DateRangePicker value={value} onChange={handleRangeChange}>
            <Button variant="outline" className="justify-between gap-2 font-normal tabular">
              <span className="truncate">{dateRangeLabel}</span>
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Button>
          </DateRangePicker>
        }
      />

      <KpiRow range={apiRange} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart range={apiRange} />
        </div>
        <div className="lg:col-span-1">
          <PaymentStatusChart range={apiRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentTransactions />
        <UnpaidStudents />
      </div>

      <AIInsightsTeaser />
    </div>
  );
}
