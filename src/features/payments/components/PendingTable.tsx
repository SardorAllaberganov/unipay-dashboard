// Table for Pending / Overdue. Adds a Days-overdue column on the overdue tab.
// Row select drives the BulkActionBar in the page.
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import type { PendingRow } from '../api';
import { cn } from '@/lib/utils';

interface Props {
  tab: 'pending' | 'overdue';
  data: PendingRow[];
  state: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data';
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  onRetry: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, next: boolean) => void;
  onToggleSelectAll: (next: boolean) => void;
  selectAllChecked: boolean;
  selectAllIndeterminate: boolean;
}

export function PendingTable({
  tab,
  data,
  state,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  onRetry,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  selectAllChecked,
  selectAllIndeterminate,
}: Props) {
  const { t } = useTranslation();

  const columns: ColumnDef<PendingRow, unknown>[] = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          aria-label={t('common.actions.selectAll')}
          checked={selectAllIndeterminate ? 'indeterminate' : selectAllChecked}
          onCheckedChange={(c) => onToggleSelectAll(c === true)}
        />
      ),
      meta: { headerClassName: 'w-[1%]', cellClassName: 'w-[1%]' },
      cell: ({ row }) => (
        <Checkbox
          aria-label={row.original.studentName}
          checked={selectedIds.has(row.original.studentId)}
          onCheckedChange={(c) => onToggleSelect(row.original.studentId, c === true)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      id: 'student',
      header: () => t('payments.list.columns.student'),
      cell: ({ row }) => (
        <Link
          to={`/students/${encodeURIComponent(row.original.studentId)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-foreground hover:underline"
        >
          {row.original.studentName}
        </Link>
      ),
    },
    {
      id: 'department',
      header: () => t('payments.list.columns.department'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.departmentId}</span>
      ),
    },
    {
      id: 'period',
      header: () => t('payments.detail.scheduleLabel'),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.period}</span>
      ),
    },
    {
      id: 'remaining',
      header: () => t('payments.list.columns.amount'),
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span className="font-mono font-medium tabular text-foreground">
          <AmountDisplay value={row.original.remaining} />
        </span>
      ),
    },
    {
      id: 'dueDate',
      header: () => t('payments.list.columns.datetime'),
      meta: {
        headerClassName: 'w-[1%] whitespace-nowrap',
        cellClassName: 'whitespace-nowrap',
      },
      cell: ({ row }) => <DateDisplay value={row.original.dueDate} format="date" />,
    },
  ];

  if (tab === 'overdue') {
    columns.push({
      id: 'daysOverdue',
      header: () => t('payments.pending.columns.daysOverdue'),
      meta: {
        headerClassName: 'w-[1%] whitespace-nowrap text-right',
        cellClassName: 'pr-3 text-right whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span
          className={cn(
            'font-mono tabular',
            row.original.daysOverdue > 30 ? 'font-semibold text-destructive' : 'text-foreground',
          )}
        >
          {row.original.daysOverdue}
        </span>
      ),
    });
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      state={state}
      pagination={{ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions }}
      onRetry={onRetry}
      rowKey={(r) => `${r.studentId}-${r.scheduleId}`}
      emptyTitle={
        tab === 'pending'
          ? t('payments.pending.emptyPendingTitle')
          : t('payments.pending.emptyOverdueTitle')
      }
      emptyDescription={
        tab === 'pending'
          ? t('payments.pending.emptyPendingBody')
          : t('payments.pending.emptyOverdueBody')
      }
      mobileCardRender={(row) => (
        // No outer wrapper — DataTable's mobile path already wraps each row in <Card p-4>.
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <Link
                to={`/students/${encodeURIComponent(row.studentId)}`}
                className="block truncate text-sm font-medium text-foreground hover:underline"
              >
                {row.studentName}
              </Link>
              <p className="text-sm text-muted-foreground">{row.period}</p>
            </div>
            <span className="font-mono font-semibold tabular text-foreground">
              <AmountDisplay value={row.remaining} />
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <DateDisplay value={row.dueDate} format="date" className="text-muted-foreground" />
            {tab === 'overdue' ? (
              <span
                className={cn(
                  'font-mono tabular text-sm',
                  row.daysOverdue > 30 ? 'font-semibold text-destructive' : 'text-foreground',
                )}
              >
                {t('payments.pending.columns.daysOverdue')}: {row.daysOverdue}
              </span>
            ) : null}
          </div>
          <div className="mt-2">
            <Checkbox
              checked={selectedIds.has(row.studentId)}
              onCheckedChange={(c) => onToggleSelect(row.studentId, c === true)}
              aria-label={row.studentName}
            />
          </div>
        </div>
      )}
    />
  );
}
