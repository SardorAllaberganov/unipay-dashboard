import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatRelative } from '@/lib/format';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { MySession } from '@/types/domain';
import {
  useMyActiveSessions,
  useRevokeAllOtherSessions,
  useRevokeSession,
} from '../hooks/useMyActiveSessions';

export function ActiveSessionsCard() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const { data, isPending, isError, refetch } = useMyActiveSessions();
  const revokeOne = useRevokeSession();
  const revokeAll = useRevokeAllOtherSessions();

  const items = useMemo(() => data?.items ?? [], [data]);
  const [revokeTarget, setRevokeTarget] = useState<MySession | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  const state: DataTableState = useMemo(() => {
    if (isPending) return 'loading';
    if (isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [isPending, isError, online, items.length]);

  const otherSessionsCount = useMemo(
    () => items.filter((s) => !s.current).length,
    [items],
  );

  const columns = useMemo<ColumnDef<MySession, unknown>[]>(
    () => [
      {
        id: 'device',
        header: () => t('settings.security.sessions.cols.device'),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate">{row.original.device}</span>
              {row.original.current ? (
                <span className="inline-flex items-center rounded-md bg-success-light px-2 py-0.5 text-xs font-medium text-success-foreground">
                  {t('settings.security.sessions.currentBadge')}
                </span>
              ) : null}
            </div>
            {row.original.browser ? (
              <p className="text-sm text-muted-foreground">{row.original.browser}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'ip',
        header: () => t('settings.security.sessions.cols.ip'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">{row.original.ip}</span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'location',
        header: () => t('settings.security.sessions.cols.location'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.location ?? '—'}
          </span>
        ),
      },
      {
        id: 'lastActive',
        header: () => t('settings.security.sessions.cols.lastActive'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {formatRelative(row.original.lastActiveAt)}
          </span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('settings.security.sessions.cols.actions')}</span>
        ),
        cell: ({ row }) =>
          row.original.current ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <div className="flex justify-end">
              <WriteButton
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setRevokeTarget(row.original)}
              >
                {t('settings.security.sessions.revokeOne')}
              </WriteButton>
            </div>
          ),
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' },
      },
    ],
    [t],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>{t('settings.security.sessions.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('settings.security.sessions.subtitle')}
            </p>
          </div>
          {otherSessionsCount > 0 ? (
            <WriteButton
              type="button"
              variant="destructive"
              onClick={() => setRevokeAllOpen(true)}
            >
              {t('settings.security.sessions.revokeAll')}
            </WriteButton>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <DataTable<MySession>
          columns={columns}
          data={items}
          state={state}
          onRetry={() => void refetch()}
          emptyTitle={t('settings.security.sessions.emptyTitle')}
          emptyDescription={t('settings.security.sessions.emptyBody')}
          rowKey={(row) => row.id}
          mobileCardRender={(row) => (
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.device}
                  </p>
                  {row.browser ? (
                    <p className="truncate text-sm text-muted-foreground">{row.browser}</p>
                  ) : null}
                </div>
                {row.current ? (
                  <span className="inline-flex items-center rounded-md bg-success-light px-2 py-0.5 text-xs font-medium text-success-foreground">
                    {t('settings.security.sessions.currentBadge')}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground tabular">
                {row.ip} · {row.location ?? '—'}
              </p>
              <p className="text-sm text-muted-foreground tabular">
                {formatRelative(row.lastActiveAt)}
              </p>
              {!row.current ? (
                <div className="pt-2">
                  <WriteButton
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setRevokeTarget(row)}
                  >
                    {t('settings.security.sessions.revokeOne')}
                  </WriteButton>
                </div>
              ) : null}
            </div>
          )}
        />
      </CardContent>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
        title={t('settings.security.sessions.revokeTitle', {
          device: revokeTarget?.device ?? '',
        })}
        description={t('settings.security.sessions.revokeDescription')}
        destructive
        requireReason
        confirmLabel={t('settings.security.sessions.revokeCta')}
        loading={revokeOne.isPending}
        onConfirm={(reason) => {
          if (!revokeTarget) return;
          revokeOne.mutate(
            { id: revokeTarget.id, reason: reason ?? '' },
            { onSuccess: () => setRevokeTarget(null) },
          );
        }}
      />

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title={t('settings.security.sessions.revokeAllTitle')}
        description={t('settings.security.sessions.revokeAllDescription', {
          count: otherSessionsCount,
        })}
        destructive
        requireReason
        confirmLabel={t('settings.security.sessions.revokeAllCta')}
        loading={revokeAll.isPending}
        onConfirm={(reason) => {
          revokeAll.mutate(reason ?? '', {
            onSuccess: () => setRevokeAllOpen(false),
          });
        }}
      />
    </Card>
  );
}
