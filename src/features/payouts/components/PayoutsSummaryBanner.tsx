// 3-metric KPI banner above the payouts list. Matches the dashboard KPI rhythm
// (icon + uppercase tracking-wider label + large tabular value) and the Pending-stats
// banner pattern (per 2026-05-11 polish round). All 6 states handled inline.
import { CalendarClock, Coins, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PanelErrorState, PanelOfflineState } from '@/components/shared/PanelStates';
import { formatDate, formatMoney, formatRelative } from '@/lib/format';
import type { PayoutJson } from '../api';

type State = 'loading' | 'empty' | 'error' | 'offline' | 'data';

interface Props {
  state: State;
  /** Sum of all settled payouts in the current calendar month (UZS tiyins). */
  receivedThisMonth?: number;
  lastPayout?: Pick<PayoutJson, 'completedAt' | 'net'> | null;
  nextExpectedAt?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function PayoutsSummaryBanner({
  state,
  receivedThisMonth,
  lastPayout,
  nextExpectedAt,
  onRetry,
  className,
}: Props) {
  const { t } = useTranslation();

  if (state === 'error') {
    return <PanelErrorState onRetry={onRetry} className={className} />;
  }
  if (state === 'offline') {
    return <PanelOfflineState className={className} />;
  }
  if (state === 'loading') {
    return <BannerSkeleton className={className} />;
  }
  if (state === 'empty') {
    return (
      <Card className={className}>
        <p className="p-5 text-sm text-muted-foreground">{t('payouts.summary.empty')}</p>
      </Card>
    );
  }

  const lastAmount = lastPayout?.net
    ? formatMoney(lastPayout.net)
    : t('payouts.summary.noLastPayout');
  const lastDate = lastPayout?.completedAt
    ? formatDate(lastPayout.completedAt)
    : '—';
  const nextDate = nextExpectedAt ? formatDate(nextExpectedAt) : '—';
  const nextRelative = nextExpectedAt ? formatRelative(nextExpectedAt) : null;

  return (
    <Card className={className}>
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        <Stat
          icon={<Coins className="size-5 text-brand-600" aria-hidden />}
          label={t('payouts.summary.receivedThisMonth')}
          value={receivedThisMonth !== undefined ? formatMoney({ amount: receivedThisMonth, currency: 'UZS' }) : '—'}
        />
        <Stat
          icon={<Wallet className="size-5 text-success-600" aria-hidden />}
          label={t('payouts.summary.lastPayout')}
          value={lastAmount}
          subtitle={lastDate}
        />
        <Stat
          icon={<CalendarClock className="size-5 text-info-600" aria-hidden />}
          label={t('payouts.summary.nextExpected')}
          value={nextDate}
          subtitle={nextRelative}
        />
      </div>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 p-5 md:p-6">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-2xl font-semibold tabular font-mono leading-tight text-foreground md:text-3xl md:leading-none">
        {value}
      </p>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

function BannerSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 p-5 md:p-6">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </Card>
  );
}
