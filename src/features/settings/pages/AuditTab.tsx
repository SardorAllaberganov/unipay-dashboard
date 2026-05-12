import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatDateTime } from '@/lib/format';
import type { AuditLogEntry } from '@/types/domain';
import {
  AUDIT_PAGE_SIZE,
  useAuditFiltersFromUrl,
  useAuditLog,
} from '../hooks/useAuditLog';
import { AuditFiltersBar } from '../components/AuditFiltersBar';

export default function AuditTab() {
  const { t } = useTranslation();
  const online = useNetworkState();
  const { filters, setFilters } = useAuditFiltersFromUrl();
  const { data, isPending, isError, refetch } = useAuditLog(filters);
  const items = useMemo(() => data?.items ?? [], [data]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const state: DataTableState = useMemo(() => {
    if (isPending) return 'loading';
    if (isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [isPending, isError, online, items.length]);

  const columns = useMemo<ColumnDef<AuditLogEntry, unknown>[]>(
    () => [
      {
        id: 'timestamp',
        header: () => t('settings.audit.cols.timestamp'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {formatDateTime(row.original.timestamp)}
          </span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'actor',
        header: () => t('settings.audit.cols.actor'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-7 shrink-0">
              <AvatarFallback>{initials(row.original.actor.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-foreground">
              {row.original.actor.name}
            </span>
          </div>
        ),
      },
      {
        id: 'action',
        header: () => t('settings.audit.cols.action'),
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular text-foreground">
            {t(`settings.audit.actions.${row.original.action}`, row.original.action)}
          </span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'target',
        header: () => t('settings.audit.cols.target'),
        cell: ({ row }) =>
          row.original.target ? (
            <span className="text-sm text-foreground">{row.original.target.label}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        id: 'ip',
        header: () => t('settings.audit.cols.ip'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">{row.original.ip}</span>
        ),
        meta: { headerClassName: 'whitespace-nowrap', cellClassName: 'whitespace-nowrap' },
      },
      {
        id: 'expand',
        header: () => <span className="sr-only">{t('settings.audit.cols.expand')}</span>,
        cell: ({ row }) => {
          if (!row.original.reason) return <span className="text-sm text-muted-foreground">—</span>;
          const isOpen = expandedId === row.original.id;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedId(isOpen ? null : row.original.id);
              }}
              aria-expanded={isOpen}
              aria-label={t('settings.audit.toggleReasonAria')}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {isOpen ? (
                <ChevronDown className="size-4" aria-hidden />
              ) : (
                <ChevronRight className="size-4" aria-hidden />
              )}
              {t('settings.audit.reasonNote')}
            </button>
          );
        },
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' },
      },
    ],
    [t, expandedId],
  );

  const expandedEntry = items.find((e) => e.id === expandedId);
  const total = data?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.audit.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('settings.audit.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuditFiltersBar />

        {expandedEntry?.reason ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('settings.audit.reasonNote')}
            </p>
            <p className="mt-1 text-sm text-foreground">{expandedEntry.reason}</p>
          </div>
        ) : null}

        <DataTable<AuditLogEntry>
          columns={columns}
          data={items}
          state={state}
          onRetry={() => void refetch()}
          emptyTitle={t('settings.audit.emptyTitle')}
          emptyDescription={t('settings.audit.emptyBody')}
          rowKey={(row) => row.id}
          pagination={{
            page: filters.page,
            pageSize: AUDIT_PAGE_SIZE,
            total,
            onPageChange: (page) => setFilters({ page }),
          }}
          mobileCardRender={(row) => (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground tabular">
                  {formatDateTime(row.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback>{initials(row.actor.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">{row.actor.name}</span>
              </div>
              <p className="font-mono text-xs tabular text-foreground">
                {t(`settings.audit.actions.${row.action}`, row.action)}
              </p>
              {row.target ? (
                <p className="text-sm text-muted-foreground">{row.target.label}</p>
              ) : null}
              <p className="text-sm text-muted-foreground tabular">{row.ip}</p>
              {row.reason ? (
                <details className="rounded-md bg-muted/30 px-2 py-1.5">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider text-muted-foreground">
                    {t('settings.audit.reasonNote')}
                  </summary>
                  <p className="mt-1 text-sm text-foreground">{row.reason}</p>
                </details>
              ) : null}
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
