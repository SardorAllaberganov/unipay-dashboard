import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { CalendarRange, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import {
  resolveDateRange,
  useDateRangeLabel,
  type DateRangeValue,
} from '@/components/shared/dateRange';
import { useNetworkState } from '@/hooks/useNetworkState';
import type { StudentActivityAction, StudentActivityEntry } from '@/types/domain';
import { useStudentActivity } from '../../hooks/useStudentActivity';

const ACTION_FILTERS: Array<StudentActivityAction | 'all'> = [
  'all',
  'created',
  'updated',
  'profile_updated',
  'department_changed',
  'status_changed',
  'schedule_row_added',
  'schedule_row_updated',
  'schedule_row_removed',
  'template_applied',
  'note_added',
  'sms_sent',
  'deactivated',
  'reactivated',
  'imported',
];

interface Props {
  studentId: string;
}

export function ActivityLogTab({ studentId }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const [action, setAction] = useState<StudentActivityAction | 'all'>('all');
  const [range, setRange] = useState<DateRangeValue>({ range: '30d' });
  const [page, setPage] = useState(1);

  const resolved = useMemo(() => resolveDateRange(range), [range]);
  const rangeLabel = useDateRangeLabel(range);

  const params = {
    page,
    pageSize: 20,
    ...(action !== 'all' ? { action } : {}),
    ...(resolved?.from ? { from: resolved.from.toISOString() } : {}),
    ...(resolved?.to ? { to: resolved.to.toISOString() } : {}),
  };

  const query = useStudentActivity(studentId, params);
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const meta = query.data?._meta;

  const state: DataTableState = useMemo(() => {
    if (query.isLoading) return 'loading';
    if (query.isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (meta?.partial) return 'partial';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [query.isLoading, query.isError, online, items.length, meta?.partial]);

  const columns = useMemo<ColumnDef<StudentActivityEntry, unknown>[]>(
    () => [
      {
        id: 'actor',
        header: () => t('students.activity.columns.actor'),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.actorName ?? t('students.activity.system')}
          </span>
        ),
      },
      {
        id: 'action',
        header: () => t('students.activity.columns.action'),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {t(`students.activity.actions.${row.original.action}`)}
          </span>
        ),
      },
      {
        id: 'change',
        header: () => t('students.activity.columns.change'),
        cell: ({ row }) => {
          const { before, after, field } = row.original;
          if (!before && !after) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <div className="space-y-0.5 text-sm">
              {field ? <p className="text-xs uppercase tracking-wider text-muted-foreground">{field}</p> : null}
              {before ? (
                <p className="text-muted-foreground line-through">{before}</p>
              ) : null}
              {after ? <p className="text-foreground">{after}</p> : null}
            </div>
          );
        },
      },
      {
        id: 'date',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.activity.columns.date'),
        cell: ({ row }) => <DateDisplay value={row.original.createdAt} format="datetime" tooltip />,
      },
    ],
    [t],
  );

  const hasActiveFilters = action !== 'all' || range.range !== '30d';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-40 flex-1">
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              {t('students.activity.columns.action')}
            </p>
            <Select value={action} onValueChange={(v) => { setAction(v as StudentActivityAction | 'all'); setPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_FILTERS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a === 'all'
                      ? t('students.list.paymentStatus.all')
                      : t(`students.activity.actions.${a}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-44 flex-1">
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              {t('students.activity.columns.date')}
            </p>
            <DateRangePicker
              value={range}
              onChange={(next) => { setRange(next); setPage(1); }}
            >
              <Button
                variant="outline"
                type="button"
                className="w-full justify-between gap-2 overflow-hidden"
              >
                <span className="truncate">{rangeLabel}</span>
                <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Button>
            </DateRangePicker>
          </div>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setAction('all');
                setRange({ range: '30d' });
                setPage(1);
              }}
            >
              {t('students.filters.reset')}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {state === 'empty' && !hasActiveFilters ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-8 text-center">
          <History className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">{t('students.activity.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('students.activity.emptyBody')}</p>
        </div>
      ) : (
        <DataTable<StudentActivityEntry>
          columns={columns}
          data={items}
          state={state}
          onRetry={() => void query.refetch()}
          emptyTitle={t('students.activity.emptyTitle')}
          emptyDescription={t('students.activity.emptyBody')}
          partial={
            meta?.partial && meta.shown !== undefined && meta.total !== undefined
              ? { shown: meta.shown, total: meta.total }
              : undefined
          }
          pagination={
            total > 20
              ? { page, pageSize: 20, total, onPageChange: setPage }
              : undefined
          }
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
