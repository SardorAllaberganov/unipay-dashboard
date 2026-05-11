import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableState } from '@/components/shared/DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import type { Department, Student } from '@/types/domain';
import { StudentAvatar } from '../shared/StudentAvatar';
import { StudentRowKebab } from './StudentRowKebab';
import { StudentMobileCard } from './StudentMobileCard';

interface Props {
  data: Student[];
  departments: Department[];
  state: DataTableState;
  onRetry: () => void;
  partial?: { shown: number; total: number };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
  };
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: (next: boolean) => void;
  onChangeDept: (student: Student) => void;
}

export function StudentsTable({
  data,
  departments,
  state,
  onRetry,
  partial,
  pagination,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onChangeDept,
}: Props) {
  const { t } = useTranslation();
  const location = useLocation();

  const deptIndex = useMemo(() => {
    const map = new Map<string, Department>();
    for (const d of departments) map.set(d.id, d);
    return map;
  }, [departments]);

  const departmentLabel = (departmentId: string): string => {
    const node = deptIndex.get(departmentId);
    if (!node) return '—';
    // Walk up ancestors to build "Faculty / Department / Year / Group" path.
    const parts: string[] = [];
    let current: Department | undefined = node;
    let safety = 0;
    while (current && safety++ < 6) {
      parts.unshift(current.name.ru);
      current = current.parentId ? deptIndex.get(current.parentId) : undefined;
    }
    return parts.slice(-2).join(' / ');
  };

  const allSelected = data.length > 0 && data.every((s) => selectedIds.has(s.id));
  const someSelected = !allSelected && data.some((s) => selectedIds.has(s.id));

  const columns = useMemo<ColumnDef<Student, unknown>[]>(
    () => [
      {
        id: 'select',
        // Tight column for the checkbox.
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-0' },
        header: () => (
          <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={(v) => onToggleAll(v === true)}
            aria-label={t('common.actions.toggleAll', 'Toggle all')}
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className="pr-2">
            <Checkbox
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={() => onToggleRow(row.original.id)}
              aria-label={`${row.original.lastName} ${row.original.firstName}`}
            />
          </div>
        ),
      },
      {
        id: 'name',
        header: () => t('students.list.columns.name'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <StudentAvatar
              firstName={row.original.firstName}
              lastName={row.original.lastName}
              avatarUrl={row.original.avatarUrl}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {row.original.lastName} {row.original.firstName}
              </p>
              <p className="mono truncate text-xs text-muted-foreground">
                {row.original.studentId}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'department',
        header: () => t('students.list.columns.department'),
        cell: ({ row }) => (
          <span className="truncate text-sm text-muted-foreground">
            {departmentLabel(row.original.departmentId)}
          </span>
        ),
      },
      {
        id: 'year',
        meta: { headerClassName: 'w-[1%]', cellClassName: 'text-right tabular' },
        header: () => t('students.list.columns.year'),
        cell: ({ row }) => (
          <span className="tabular">{row.original.year ?? '—'}</span>
        ),
      },
      {
        id: 'amount',
        meta: {
          headerClassName: 'text-right',
          cellClassName: 'text-right whitespace-nowrap',
        },
        header: () => t('students.list.columns.amount'),
        cell: ({ row }) => <AmountDisplay value={row.original.currentBalance} />,
      },
      {
        id: 'status',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.list.columns.status'),
        cell: ({ row }) => <StatusBadge variant={row.original.paymentStatus} />,
      },
      {
        id: 'lastPayment',
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'whitespace-nowrap',
        },
        header: () => t('students.list.columns.lastPayment'),
        cell: ({ row }) =>
          row.original.lastPaymentAt ? (
            <DateDisplay value={row.original.lastPaymentAt} />
          ) : (
            <span className="text-sm text-muted-foreground">
              {t('students.list.lastPaymentNever')}
            </span>
          ),
      },
      {
        id: 'actions',
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' },
        header: () => (
          <span className="sr-only">{t('students.list.columns.actions')}</span>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <StudentRowKebab student={row.original} onChangeDept={onChangeDept} />
          </div>
        ),
      },
    ],
    // departmentLabel is recomputed when deptIndex changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, selectedIds, allSelected, someSelected, onToggleRow, onToggleAll, onChangeDept, deptIndex],
  );

  return (
    <DataTable<Student>
      columns={columns}
      data={data}
      state={state}
      onRetry={onRetry}
      emptyTitle={t('students.list.emptyTitle')}
      emptyDescription={t('students.list.emptyBody')}
      partial={partial}
      pagination={pagination}
      mobileCardRender={(row) => (
        <StudentMobileCard
          student={row}
          departmentLabel={departmentLabel(row.departmentId)}
          selected={selectedIds.has(row.id)}
          onToggleSelect={onToggleRow}
          onChangeDept={onChangeDept}
        />
      )}
      rowKey={(row) => row.id}
      rowHref={(row) => `/students/${row.id}`}
      getRowAriaLabel={(row) => `${row.lastName} ${row.firstName}`}
      getRowNavigateState={() => ({
        from: `${location.pathname}${location.search}`,
      })}
    />
  );
}
