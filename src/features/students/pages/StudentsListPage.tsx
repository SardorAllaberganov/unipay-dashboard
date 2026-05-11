import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Upload } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import type { DataTableState } from '@/components/shared/DataTable';
import type { EducationType, Student, StudentPaymentStatus } from '@/types/domain';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import { useStudents } from '../hooks/useStudents';
import { useBulkChangeDept } from '../hooks/useStudentMutations';
import { StudentsFilters, type StudentsFiltersValue } from '../components/list/StudentsFilters';
import { StudentsTable } from '../components/list/StudentsTable';
import { BulkActionBar } from '../components/list/BulkActionBar';
import { ChangeDepartmentDialog } from '../components/list/ChangeDepartmentDialog';

const VALID_PAYMENT_STATUSES = new Set<StudentPaymentStatus>(['paid', 'partial', 'pending', 'overdue']);
const VALID_EDU_TYPES = new Set<EducationType>(['full-time', 'part-time', 'evening', 'remote']);

function parseListFromParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

function parseFiltersFromParams(params: URLSearchParams): StudentsFiltersValue {
  const departmentIds = parseListFromParam(params.get('dept'));
  const years = parseListFromParam(params.get('year'))
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 6);
  const paymentStatuses = parseListFromParam(params.get('status')).filter((s): s is StudentPaymentStatus =>
    VALID_PAYMENT_STATUSES.has(s as StudentPaymentStatus),
  );
  const educationTypes = parseListFromParam(params.get('edu')).filter((s): s is EducationType =>
    VALID_EDU_TYPES.has(s as EducationType),
  );
  return {
    search: params.get('q') ?? '',
    departmentIds,
    years,
    paymentStatuses,
    educationTypes,
  };
}

function writeFiltersToParams(prev: URLSearchParams, next: StudentsFiltersValue, resetPage = true): URLSearchParams {
  const sp = new URLSearchParams(prev);
  if (next.search) sp.set('q', next.search);
  else sp.delete('q');
  if (next.departmentIds.length) sp.set('dept', next.departmentIds.join(','));
  else sp.delete('dept');
  if (next.years.length) sp.set('year', next.years.join(','));
  else sp.delete('year');
  if (next.paymentStatuses.length) sp.set('status', next.paymentStatuses.join(','));
  else sp.delete('status');
  if (next.educationTypes.length) sp.set('edu', next.educationTypes.join(','));
  else sp.delete('edu');
  if (resetPage) sp.delete('page');
  return sp;
}

export default function StudentsListPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const online = useNetworkState();

  const filters = useMemo(() => parseFiltersFromParams(params), [params]);
  const page = Math.max(1, Number(params.get('page') ?? '1'));

  const setFilters = useCallback(
    (next: StudentsFiltersValue) => {
      setParams((prev) => writeFiltersToParams(prev, next));
    },
    [setParams],
  );

  const setPage = useCallback(
    (next: number) => {
      setParams((prev) => {
        const sp = new URLSearchParams(prev);
        if (next > 1) sp.set('page', String(next));
        else sp.delete('page');
        return sp;
      });
    },
    [setParams],
  );

  const departmentsQuery = useDepartments();
  const departments = departmentsQuery.data?.items ?? [];

  const studentsQuery = useStudents({
    search: filters.search,
    departmentIds: filters.departmentIds,
    years: filters.years,
    paymentStatuses: filters.paymentStatuses,
    educationTypes: filters.educationTypes,
    page,
    pageSize: 50,
  });

  const items = studentsQuery.data?.items ?? [];
  const total = studentsQuery.data?.total ?? 0;
  const meta = studentsQuery.data?._meta;

  const state: DataTableState = useMemo(() => {
    if (studentsQuery.isLoading) return 'loading';
    if (studentsQuery.isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (meta?.partial) return 'partial';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [studentsQuery.isLoading, studentsQuery.isError, online, items.length, meta?.partial]);

  // ---- bulk selection ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = (on: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) for (const s of items) next.add(s.id);
      else for (const s of items) next.delete(s.id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  // ---- change-department flow (bulk OR single-row via kebab) ----
  const [changeDeptOpen, setChangeDeptOpen] = useState(false);
  const [changeDeptScope, setChangeDeptScope] = useState<{ ids: string[] } | null>(null);
  const bulkChangeDept = useBulkChangeDept();

  const openBulkChangeDept = () => {
    setChangeDeptScope({ ids: [...selectedIds] });
    setChangeDeptOpen(true);
  };
  const openSingleChangeDept = (student: Student) => {
    setChangeDeptScope({ ids: [student.id] });
    setChangeDeptOpen(true);
  };
  const confirmChangeDept = async (departmentId: string) => {
    const ids = changeDeptScope?.ids ?? [];
    if (ids.length === 0) return;
    await bulkChangeDept.mutateAsync({ studentIds: ids, departmentId });
    setChangeDeptScope(null);
    if (ids.length > 1) clearSelection();
  };

  const showBulkBar = selectedIds.size > 0;

  return (
    <div className={showBulkBar ? 'pb-28' : 'pb-8'}>
      <PageHeader
        title={t('students.title')}
        actions={
          // Mobile: full-width row, each button 50% via flex-1. Desktop (md+): content-sized
          // and right-aligned by the PageHeader's flex-row layout.
          <div className="flex w-full gap-2 md:w-auto">
            <Button asChild variant="outline" type="button" className="flex-1 md:flex-none">
              <Link to="/students/import">
                <Upload className="mr-1 size-4" aria-hidden />
                {t('students.list.importCta')}
              </Link>
            </Button>
            <WriteButton asChild type="button" className="flex-1 md:flex-none">
              <Link to="/students/new">
                <Plus className="mr-1 size-4" aria-hidden />
                {t('students.list.addCta')}
              </Link>
            </WriteButton>
          </div>
        }
      />

      <StudentsFilters
        value={filters}
        onChange={setFilters}
        departments={departments}
        isDepartmentsLoading={departmentsQuery.isLoading}
      />

      <StudentsTable
        data={items}
        departments={departments}
        state={state}
        onRetry={() => void studentsQuery.refetch()}
        partial={
          meta?.partial && meta.shown !== undefined && meta.total !== undefined
            ? { shown: meta.shown, total: meta.total }
            : undefined
        }
        pagination={
          total > 50
            ? { page, pageSize: 50, total, onPageChange: setPage }
            : undefined
        }
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        onChangeDept={openSingleChangeDept}
      />

      <BulkActionBar
        selectedIds={[...selectedIds]}
        onChangeDept={openBulkChangeDept}
        onClear={clearSelection}
      />

      <ChangeDepartmentDialog
        open={changeDeptOpen}
        onOpenChange={(open) => {
          setChangeDeptOpen(open);
          if (!open) setChangeDeptScope(null);
        }}
        count={changeDeptScope?.ids.length ?? 0}
        departments={departments}
        isDepartmentsLoading={departmentsQuery.isLoading}
        onConfirm={confirmChangeDept}
      />
    </div>
  );
}
