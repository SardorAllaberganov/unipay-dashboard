import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, RefreshCcw, XCircle } from 'lucide-react';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatDateTime } from '@/lib/format';
import type { WebhookDelivery } from '@/types/domain';
import {
  useRetryWebhookDelivery,
  useWebhookDeliveries,
} from '../hooks/useWebhook';

export function WebhookDeliveriesCard() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const { data, isPending, isError, refetch } = useWebhookDeliveries();
  const retry = useRetryWebhookDelivery();
  const items = useMemo(() => data?.items ?? [], [data]);

  const state: DataTableState = useMemo(() => {
    if (isPending) return 'loading';
    if (isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [isPending, isError, online, items.length]);

  const columns = useMemo<ColumnDef<WebhookDelivery, unknown>[]>(
    () => [
      {
        id: 'timestamp',
        header: () => t('settings.webhook.deliveries.cols.timestamp'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {formatDateTime(row.original.timestamp)}
          </span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'event',
        header: () => t('settings.webhook.deliveries.cols.event'),
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular text-foreground">
            {row.original.event}
          </span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'status',
        header: () => t('settings.webhook.deliveries.cols.status'),
        cell: ({ row }) =>
          row.original.status === 'success' ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-success-700">
              <CheckCircle2 className="size-4" aria-hidden />
              {t('settings.webhook.deliveries.success')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <XCircle className="size-4" aria-hidden />
              {t('settings.webhook.deliveries.failed')}
            </span>
          ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'responseCode',
        header: () => t('settings.webhook.deliveries.cols.responseCode'),
        cell: ({ row }) => (
          <span className="font-mono text-sm tabular text-muted-foreground">
            {row.original.responseCode ?? '—'}
          </span>
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap text-right',
          cellClassName: 'pr-3 text-right whitespace-nowrap',
        },
      },
      {
        id: 'duration',
        header: () => t('settings.webhook.deliveries.cols.duration'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {row.original.durationMs ? `${row.original.durationMs} ms` : '—'}
          </span>
        ),
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap text-right',
          cellClassName: 'pr-3 text-right whitespace-nowrap',
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('common.actions.actions')}</span>
        ),
        cell: ({ row }) =>
          row.original.status === 'failed' ? (
            <div className="flex justify-end">
              <WriteButton
                size="sm"
                variant="outline"
                onClick={() => retry.mutate(row.original.id)}
                loading={retry.isPending && retry.variables === row.original.id}
              >
                <RefreshCcw className="size-3.5" aria-hidden />
                {t('settings.webhook.deliveries.retryCta')}
              </WriteButton>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' },
      },
    ],
    [t, retry],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.webhook.deliveries.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('settings.webhook.deliveries.subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <DataTable<WebhookDelivery>
          columns={columns}
          data={items}
          state={state}
          onRetry={() => void refetch()}
          emptyTitle={t('settings.webhook.deliveries.emptyTitle')}
          emptyDescription={t('settings.webhook.deliveries.emptyBody')}
          rowKey={(row) => row.id}
          mobileCardRender={(row) => (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground tabular">
                  {formatDateTime(row.timestamp)}
                </p>
                {row.status === 'success' ? (
                  <span className="inline-flex items-center gap-1 text-sm text-success-700">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {row.responseCode}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-destructive">
                    <XCircle className="size-3.5" aria-hidden />
                    {row.responseCode}
                  </span>
                )}
              </div>
              <p className="font-mono text-xs tabular text-muted-foreground">{row.event}</p>
              <p className="text-sm text-muted-foreground tabular">
                {row.durationMs ? `${row.durationMs} ms` : '—'}
              </p>
              {row.status === 'failed' ? (
                <div className="pt-2">
                  <WriteButton
                    size="sm"
                    variant="outline"
                    onClick={() => retry.mutate(row.id)}
                    loading={retry.isPending && retry.variables === row.id}
                  >
                    <RefreshCcw className="size-3.5" aria-hidden />
                    {t('settings.webhook.deliveries.retryCta')}
                  </WriteButton>
                </div>
              ) : null}
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
