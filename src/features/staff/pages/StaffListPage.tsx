import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import type { DataTableState } from '@/components/shared/DataTable';
import type { Role, StaffStatus } from '@/types/domain';
import { useStaff } from '../hooks/useStaff';
import {
  StaffFilters,
  type StaffFiltersValue,
} from '../components/list/StaffFilters';
import { StaffTable } from '../components/list/StaffTable';
import { InviteStaffDialog } from '../components/list/InviteStaffDialog';

const ALLOWED_ROLES: Array<Role | 'all'> = [
  'all',
  'owner',
  'finance_manager',
  'operator',
  'viewer',
];
const ALLOWED_STATUSES: Array<StaffStatus | 'all'> = [
  'all',
  'active',
  'inactive',
  'pending',
];

function clampRole(v: string | null): Role | 'all' {
  return ALLOWED_ROLES.includes(v as Role | 'all') ? (v as Role | 'all') : 'all';
}
function clampStatus(v: string | null): StaffStatus | 'all' {
  return ALLOWED_STATUSES.includes(v as StaffStatus | 'all')
    ? (v as StaffStatus | 'all')
    : 'all';
}

export default function StaffListPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const online = useNetworkState();

  const filters: StaffFiltersValue = useMemo(
    () => ({
      search: params.get('q') ?? '',
      role: clampRole(params.get('role')),
      status: clampStatus(params.get('status')),
    }),
    [params]
  );
  const page = Math.max(1, Number(params.get('page') ?? '1'));

  const updateParams = useCallback(
    (next: Partial<StaffFiltersValue & { page: number }>) => {
      setParams((prev) => {
        const sp = new URLSearchParams(prev);
        if (next.search !== undefined) {
          if (next.search) sp.set('q', next.search);
          else sp.delete('q');
        }
        if (next.role !== undefined) {
          if (next.role !== 'all') sp.set('role', next.role);
          else sp.delete('role');
        }
        if (next.status !== undefined) {
          if (next.status !== 'all') sp.set('status', next.status);
          else sp.delete('status');
        }
        if (next.page !== undefined) {
          if (next.page > 1) sp.set('page', String(next.page));
          else sp.delete('page');
        }
        if (
          next.page === undefined &&
          (next.search !== undefined ||
            next.role !== undefined ||
            next.status !== undefined)
        ) {
          sp.delete('page');
        }
        return sp;
      });
    },
    [setParams]
  );

  const { data, isLoading, isError, refetch } = useStaff({
    role: filters.role,
    status: filters.status,
    search: filters.search,
    page,
    pageSize: 50,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const meta = data?._meta;

  const state: DataTableState = useMemo(() => {
    if (isLoading) return 'loading';
    if (isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (meta?.partial) return 'partial';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [isLoading, isError, online, items.length, meta?.partial]);

  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="pb-8">
      <PageHeader
        title={t('staff.title')}
        actions={
          <WriteButton type="button" onClick={() => setInviteOpen(true)}>
            <Plus className="mr-1 size-4" aria-hidden />
            {t('staff.list.inviteCta')}
          </WriteButton>
        }
      />

      <StaffFilters value={filters} onChange={(next) => updateParams(next)} />

      <StaffTable
        data={items}
        state={state}
        onRetry={() => void refetch()}
        onInvite={() => setInviteOpen(true)}
        partial={
          meta?.partial && meta.shown !== undefined && meta.total !== undefined
            ? { shown: meta.shown, total: meta.total }
            : undefined
        }
        pagination={
          total > 50
            ? {
                page,
                pageSize: 50,
                total,
                onPageChange: (p) => updateParams({ page: p }),
              }
            : undefined
        }
      />

      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
