import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card } from '@/components/ui/card';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatRelative } from '@/lib/format';
import type { StaffSession } from '@/types/domain';
import { useStaffSessions } from '../../hooks/useStaffSessions';
import { RevokeSessionDialog } from '../dialogs/RevokeSessionDialog';
import { RevokeAllOthersDialog } from '../dialogs/RevokeAllOthersDialog';

interface Props {
  staffId: string;
}

export function SessionsTab({ staffId }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const { data, isPending, isError, refetch } = useStaffSessions(staffId);

  const items = useMemo(() => data?.items ?? [], [data]);
  const [revokeTarget, setRevokeTarget] = useState<StaffSession | null>(null);
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
    [items]
  );

  const columns = useMemo<ColumnDef<StaffSession, unknown>[]>(
    () => [
      {
        id: 'device',
        header: () => t('staff.sessions.columns.device'),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate">{row.original.device}</span>
              {row.original.current ? (
                <span className="inline-flex items-center rounded-md bg-success-light px-2 py-0.5 text-xs font-medium text-success-foreground">
                  {t('staff.sessions.currentBadge')}
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
        header: () => t('staff.sessions.columns.ip'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {row.original.ip}
          </span>
        ),
      },
      {
        id: 'location',
        header: () => t('staff.sessions.columns.location'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.location ?? '—'}
          </span>
        ),
      },
      {
        id: 'lastActive',
        header: () => t('staff.sessions.columns.lastActive'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {formatRelative(row.original.lastActiveAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('staff.sessions.columns.actions')}</span>
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
                {t('staff.sessions.revokeOne')}
              </WriteButton>
            </div>
          ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">
            {t('staff.sessions.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('staff.sessions.visibilityLocked')}
          </p>
        </div>
        {otherSessionsCount > 0 ? (
          <WriteButton
            type="button"
            variant="destructive"
            onClick={() => setRevokeAllOpen(true)}
          >
            {t('staff.sessions.revokeAllOthers')}
          </WriteButton>
        ) : null}
      </Card>

      <DataTable<StaffSession>
        columns={columns}
        data={items}
        state={state}
        onRetry={() => void refetch()}
        emptyTitle={t('staff.sessions.emptyTitle')}
        emptyDescription={t('staff.sessions.emptyBody')}
        rowKey={(row) => row.id}
        mobileCardRender={(row) => (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.device}
                </p>
                {row.browser ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {row.browser}
                  </p>
                ) : null}
              </div>
              {row.current ? (
                <span className="inline-flex items-center rounded-md bg-success-light px-2 py-0.5 text-xs font-medium text-success-foreground">
                  {t('staff.sessions.currentBadge')}
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
                  {t('staff.sessions.revokeOne')}
                </WriteButton>
              </div>
            ) : null}
          </div>
        )}
      />

      {revokeTarget ? (
        <RevokeSessionDialog
          open={!!revokeTarget}
          onOpenChange={(o) => {
            if (!o) setRevokeTarget(null);
          }}
          staffId={staffId}
          session={revokeTarget}
        />
      ) : null}

      <RevokeAllOthersDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        staffId={staffId}
      />
    </div>
  );
}
