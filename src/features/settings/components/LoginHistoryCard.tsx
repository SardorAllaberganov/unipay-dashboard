import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, XCircle } from 'lucide-react';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatDateTime } from '@/lib/format';
import type { LoginHistoryEntry } from '@/types/domain';
import { useLoginHistory } from '../hooks/useLoginHistory';

export function LoginHistoryCard() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const { data, isPending, isError, refetch } = useLoginHistory(30);
  const items = useMemo(() => data?.items ?? [], [data]);

  const state: DataTableState = useMemo(() => {
    if (isPending) return 'loading';
    if (isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [isPending, isError, online, items.length]);

  const columns = useMemo<ColumnDef<LoginHistoryEntry, unknown>[]>(
    () => [
      {
        id: 'timestamp',
        header: () => t('settings.security.history.cols.timestamp'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {formatDateTime(row.original.timestamp)}
          </span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'ip',
        header: () => t('settings.security.history.cols.ip'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">{row.original.ip}</span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'device',
        header: () => t('settings.security.history.cols.device'),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.device}</span>
        ),
      },
      {
        id: 'outcome',
        header: () => t('settings.security.history.cols.outcome'),
        cell: ({ row }) =>
          row.original.outcome === 'success' ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-success-700">
              <CheckCircle2 className="size-4" aria-hidden />
              {t('settings.security.history.success')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <XCircle className="size-4" aria-hidden />
              {t('settings.security.history.failed')}
            </span>
          ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
    ],
    [t],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.security.history.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('settings.security.history.subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <DataTable<LoginHistoryEntry>
          columns={columns}
          data={items}
          state={state}
          onRetry={() => void refetch()}
          emptyTitle={t('settings.security.history.emptyTitle')}
          emptyDescription={t('settings.security.history.emptyBody')}
          rowKey={(row) => row.id}
          mobileCardRender={(row) => (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground tabular">
                  {formatDateTime(row.timestamp)}
                </p>
                {row.outcome === 'success' ? (
                  <span className="inline-flex items-center gap-1 text-sm text-success-700">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {t('settings.security.history.success')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-destructive">
                    <XCircle className="size-3.5" aria-hidden />
                    {t('settings.security.history.failed')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{row.device}</p>
              <p className="text-sm text-muted-foreground tabular">{row.ip}</p>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
