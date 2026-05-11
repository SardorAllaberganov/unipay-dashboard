import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import {
  resolveDateRange,
  useDateRangeLabel,
  type DateRangeValue,
} from '@/components/shared/dateRange';
import { Label } from '@/components/ui/label';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatDateTime } from '@/lib/format';
import type {
  StaffActivityAction,
  StaffActivityEntry,
} from '@/types/domain';
import { useStaffActivity } from '../../hooks/useStaffActivity';

interface Props {
  staffId: string;
}

const ACTION_VALUES: Array<StaffActivityAction | 'all'> = [
  'all',
  'login',
  'role_changed',
  'access_changed',
  'contact_updated',
  'invite_sent',
  'invite_resent',
  'invite_cancelled',
  'password_reset',
  'session_revoked',
  'sessions_revoked_all_others',
  'student_added',
  'transaction_created',
  'report_exported',
  'deactivated',
  'reactivated',
];

const PAGE_SIZE = 20;

function actionLabelKey(a: StaffActivityAction): string {
  // First check the extended namespace, then the original activity actions.
  // The unified key is `staff.activity.actions.<a>` OR `staff.extendedActivity.actions.<a>`.
  const extended = [
    'contact_updated',
    'invite_resent',
    'invite_cancelled',
    'password_reset',
    'session_revoked',
    'sessions_revoked_all_others',
  ];
  return extended.includes(a)
    ? `staff.extendedActivity.actions.${a}`
    : `staff.activity.actions.${a}`;
}

export function ActivityLogTab({ staffId }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<StaffActivityAction | 'all'>(
    'all'
  );
  const [range, setRange] = useState<DateRangeValue>({ range: '30d' });
  const rangeLabel = useDateRangeLabel(range);

  const resolved = useMemo(() => resolveDateRange(range), [range]);

  const { data, isPending, isError, refetch } = useStaffActivity(staffId, {
    page,
    pageSize: PAGE_SIZE,
    action: actionFilter === 'all' ? undefined : actionFilter,
    from: resolved?.from ? resolved.from.toISOString() : undefined,
    to: resolved?.to ? resolved.to.toISOString() : undefined,
  });

  const items = data?.items ?? [];
  const meta = data?._meta;
  const total = data?.total ?? 0;
  const filtersActive = actionFilter !== 'all' || range.range !== '30d';

  const state: DataTableState = useMemo(() => {
    if (isPending) return 'loading';
    if (isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (meta?.partial) return 'partial';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [isPending, isError, online, items.length, meta?.partial]);

  const resetFilters = useCallback(() => {
    setActionFilter('all');
    setRange({ range: '30d' });
    setPage(1);
  }, []);

  const columns = useMemo<ColumnDef<StaffActivityEntry, unknown>[]>(
    () => [
      {
        id: 'createdAt',
        header: () => t('staff.activity.columns.createdAt'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'action',
        header: () => t('staff.activity.columns.action'),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {t(actionLabelKey(row.original.action))}
          </span>
        ),
      },
      {
        id: 'target',
        header: () => t('staff.activity.columns.target'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.target ?? '—'}
          </span>
        ),
      },
      {
        id: 'ip',
        header: () => t('staff.extendedActivity.columns.ip'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {row.original.ip ?? '—'}
          </span>
        ),
      },
      {
        id: 'device',
        header: () => t('staff.extendedActivity.columns.device'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.device ?? '—'}
          </span>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="activity-action">
              {t('staff.activityFilters.actionLabel')}
            </Label>
            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v as StaffActivityAction | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger id="activity-action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_VALUES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a === 'all'
                      ? t('staff.activityFilters.actionAll')
                      : t(actionLabelKey(a))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('staff.activityFilters.dateLabel')}</Label>
            <DateRangePicker
              value={range}
              onChange={(next) => {
                setRange(next);
                setPage(1);
              }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start font-normal"
              >
                <CalendarDays className="mr-2 size-4" aria-hidden />
                <span className="truncate">{rangeLabel}</span>
              </Button>
            </DateRangePicker>
          </div>
        </div>

        {filtersActive ? (
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              {t('staff.activityFilters.reset')}
            </Button>
          </div>
        ) : null}
      </Card>

      <DataTable<StaffActivityEntry>
        columns={columns}
        data={items}
        state={state}
        onRetry={() => void refetch()}
        emptyTitle={
          filtersActive
            ? t('staff.activityFilters.emptyFiltered')
            : t('staff.activity.emptyTitle')
        }
        emptyDescription={
          filtersActive ? undefined : t('staff.activity.emptyBody')
        }
        emptyAction={
          filtersActive
            ? {
                label: t('staff.activityFilters.emptyResetCta'),
                onClick: resetFilters,
              }
            : undefined
        }
        partial={
          meta?.partial && meta.shown !== undefined && meta.total !== undefined
            ? { shown: meta.shown, total: meta.total }
            : undefined
        }
        rowKey={(row) => row.id}
        pagination={
          total > PAGE_SIZE
            ? {
                page,
                pageSize: PAGE_SIZE,
                total,
                onPageChange: setPage,
              }
            : undefined
        }
        mobileCardRender={(row) => (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {t(actionLabelKey(row.action))}
              </p>
              {row.target ? (
                <p className="shrink-0 text-sm text-muted-foreground">
                  {row.target}
                </p>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground tabular">
              {formatDateTime(row.createdAt)}
            </p>
            {row.ip || row.device ? (
              <p className="text-sm text-muted-foreground">
                {[row.device, row.ip].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
