import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChannelBadge } from '@/components/shared/ChannelBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Money } from '@/components/unipay/Money';
import { formatRelative } from '@/lib/format';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useRecentTransactions } from '../hooks/useRecentTransactions';
import {
  ListRowSkeleton,
  PanelEmptyState,
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

export function RecentTransactions() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useRecentTransactions(10);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t('dashboard.recent.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {!online && !query.isError ? <PanelOfflineNote /> : null}

        {query.isPending ? (
          <ul className="divide-y divide-border">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i}>
                <ListRowSkeleton />
              </li>
            ))}
          </ul>
        ) : query.isError ? (
          !online ? (
            <PanelOfflineState />
          ) : (
            <PanelErrorState onRetry={() => query.refetch()} />
          )
        ) : !query.data || query.data.items.length === 0 ? (
          <PanelEmptyState body={t('dashboard.empty.noData')} />
        ) : (
          <>
            {query.data._meta?.partial ? (
              <PanelPartialNote
                shown={query.data._meta.shown ?? query.data.items.length}
                total={query.data._meta.total ?? query.data.items.length}
              />
            ) : null}
            <ul className="divide-y divide-border">
              {query.data.items.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {initialsFromName(tx.studentName)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {tx.studentName}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <ChannelBadge channel={tx.channel} />
                    <span>{formatRelative(tx.createdAt)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Money
                    value={{ amount: BigInt(tx.amount), currency: tx.currency }}
                  />
                  <StatusBadge variant={tx.status} />
                </div>
              </li>
            ))}
            </ul>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Link
          to="/payments/transactions"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
        >
          {t('dashboard.recent.viewAll')}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardFooter>
    </Card>
  );
}
