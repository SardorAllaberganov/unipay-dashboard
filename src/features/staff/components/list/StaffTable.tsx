import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableState } from '@/components/shared/DataTable';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatRelative } from '@/lib/format';
import { useSession } from '@/lib/auth';
import type { StaffMember } from '@/types/domain';
import { StaffAvatar } from '../shared/StaffAvatar';
import { DepartmentsAccessChips } from '../shared/DepartmentsAccessChips';
import { StaffRowKebab } from './StaffRowKebab';
import { StaffMobileCard } from './StaffMobileCard';

interface Props {
  data: StaffMember[];
  state: DataTableState;
  onRetry: () => void;
  onInvite: () => void;
  partial?: { shown: number; total: number };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
  };
}

export function StaffTable({
  data,
  state,
  onRetry,
  onInvite,
  partial,
  pagination,
}: Props) {
  const { t } = useTranslation();
  const session = useSession();
  const location = useLocation();
  const currentUserId = session?.profile.id;

  const columns = useMemo<ColumnDef<StaffMember, unknown>[]>(
    () => [
      {
        id: 'name',
        header: () => t('staff.list.columns.name'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <StaffAvatar
              fullName={row.original.fullName}
              email={row.original.email}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {row.original.fullName || row.original.email}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'role',
        header: () => t('staff.list.columns.role'),
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: 'departments',
        header: () => t('staff.list.columns.departments'),
        cell: ({ row }) => (
          <DepartmentsAccessChips departmentIds={row.original.departmentIds} />
        ),
      },
      {
        id: 'lastLogin',
        header: () => t('staff.list.columns.lastLogin'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular">
            {row.original.lastLoginAt
              ? formatRelative(row.original.lastLoginAt)
              : t('staff.list.lastLoginNever')}
          </span>
        ),
      },
      {
        id: 'status',
        header: () => t('staff.list.columns.status'),
        // Pending rows merge the status + actions cells via cellColSpan=2 so the badge
        // and kebab share the right edge cleanly. Non-pending rows keep the standard
        // layout (badge in status td, kebab in actions td).
        meta: {
          cellColSpan: (row) => (row.status === 'pending' ? 2 : 1),
          cellClassName: 'pr-3',
        },
        cell: ({ row }) =>
          row.original.status === 'pending' ? (
            <div
              className="flex items-center justify-between gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <StatusBadge variant="pending" />
              <StaffRowKebab
                staff={row.original}
                currentUserId={currentUserId}
              />
            </div>
          ) : (
            <StatusBadge variant={row.original.status} />
          ),
      },
      {
        id: 'actions',
        // w-[1%] collapses the column to content-width so the kebab sits flush right against
        // the table's right edge across every row (otherwise table-layout: auto distributes
        // residual width here, which made the dots visually drift when other columns had
        // varying content). pr-3 trims the default px-4 right padding so the icon-only button
        // is closer to the edge while keeping a comfortable tap target.
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' },
        header: () => (
          <span className="sr-only">{t('staff.list.columns.actions')}</span>
        ),
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <StaffRowKebab
              staff={row.original}
              currentUserId={currentUserId}
            />
          </div>
        ),
      },
    ],
    [t, currentUserId]
  );

  return (
    <DataTable<StaffMember>
      columns={columns}
      data={data}
      state={state}
      onRetry={onRetry}
      emptyTitle={t('staff.list.emptyTitle')}
      emptyDescription={t('staff.list.emptyBody')}
      emptyAction={{ label: t('staff.list.inviteCta'), onClick: onInvite }}
      partial={partial}
      pagination={pagination}
      mobileCardRender={(row) => (
        <StaffMobileCard staff={row} currentUserId={currentUserId} />
      )}
      rowKey={(row) => row.id}
      rowHref={(row) => `/staff/${row.id}`}
      getRowAriaLabel={(row) => row.fullName || row.email}
      // Preserve the list view URL (search/role/status/page) so the detail page's
      // BackLink can return to the same scroll position + filter state.
      getRowNavigateState={() => ({
        from: `${location.pathname}${location.search}`,
      })}
      rowClassName={(row) =>
        row.status === 'pending'
          ? 'before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-warning-600 before:content-[""]'
          : undefined
      }
    />
  );
}
