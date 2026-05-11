// /payments/pending — pending + overdue tabs with bulk SMS/Export/Manual actions.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Download, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useNetworkState } from '@/hooks/useNetworkState';
import { WriteButton } from '@/components/unipay/WriteButton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { BulkActionBar } from '@/components/shared/BulkActionBar';
import { useDebounce } from '@/hooks/use-debounce';
import { PendingTable } from '../components/PendingTable';
import { PendingOverdueStatsBanner } from '../components/PendingOverdueStatsBanner';
import { ManualPaymentEntryDialog } from '../components/ManualPaymentEntryDialog';
import { usePendingOverdue } from '../hooks/usePendingOverdue';
import { useBulkExport, useBulkRemind } from '../hooks/usePaymentsMutations';

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

export function PendingOverduePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const online = useNetworkState();
  const tab = (searchParams.get('tab') === 'overdue' ? 'overdue' : 'pending') as
    | 'pending'
    | 'overdue';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSizeParam = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSizeParam)
    ? pageSizeParam
    : DEFAULT_PAGE_SIZE;
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const search = useDebounce(searchInput, 200);

  // Push debounced search to URL.
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    const current = sp.get('search') ?? '';
    if (current !== search) {
      if (search) sp.set('search', search);
      else sp.delete('search');
      sp.set('page', '1');
      setSearchParams(sp, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = usePendingOverdue({ tab, search, page, pageSize });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [remindOpen, setRemindOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const remind = useBulkRemind();
  const exportMut = useBulkExport();

  const rows = useMemo(() => query.data?.items ?? [], [query.data]);
  const pageStudentIds = useMemo(() => new Set(rows.map((r) => r.studentId)), [rows]);
  const selectAllChecked =
    pageStudentIds.size > 0 && [...pageStudentIds].every((id) => selectedIds.has(id));
  const selectAllIndeterminate =
    !selectAllChecked && [...pageStudentIds].some((id) => selectedIds.has(id));

  function toggleSelect(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  }
  function toggleSelectAll(next: boolean) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (next) for (const id of pageStudentIds) s.add(id);
      else for (const id of pageStudentIds) s.delete(id);
      return s;
    });
  }

  function setTab(next: 'pending' | 'overdue') {
    const sp = new URLSearchParams(searchParams);
    sp.set('tab', next);
    sp.set('page', '1');
    setSearchParams(sp, { replace: true });
    setSelectedIds(new Set());
  }

  function setPage(next: number) {
    const sp = new URLSearchParams(searchParams);
    sp.set('page', String(next));
    setSearchParams(sp, { replace: true });
  }

  function setPageSize(next: number) {
    const sp = new URLSearchParams(searchParams);
    sp.set('pageSize', String(next));
    sp.set('page', '1');
    setSearchParams(sp, { replace: true });
  }

  const state: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data' = !online
    ? 'offline'
    : query.isLoading
      ? 'loading'
      : query.isError
        ? 'error'
        : rows.length === 0
          ? 'empty'
          : 'data';

  const selectedCount = selectedIds.size;

  return (
    <div className={selectedCount > 0 ? 'pb-28' : ''}>
      <PageHeader title={t('payments.pending.title')} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'overdue')}>
        <TabsList>
          <TabsTrigger value="pending">{t('payments.pending.tabPending')}</TabsTrigger>
          <TabsTrigger value="overdue">{t('payments.pending.tabOverdue')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.data ? (
        <div className="mt-4">
          <PendingOverdueStatsBanner
            tab={tab}
            studentsWithDebt={query.data.stats.studentsWithDebt}
            totalAmount={query.data.stats.totalAmount}
            overdueOver30={query.data.stats.overdueOver30}
          />
        </div>
      ) : null}

      <div className="mt-4 mb-3">
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('payments.filters.searchPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      <PendingTable
        tab={tab}
        data={rows}
        state={state}
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? pageSize}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        onRetry={() => query.refetch()}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        selectAllChecked={selectAllChecked}
        selectAllIndeterminate={selectAllIndeterminate}
      />

      <BulkActionBar
        count={selectedCount}
        onClear={() => setSelectedIds(new Set())}
        label={t('payments.pending.bulk.selectedCount', { count: selectedCount })}
      >
        <WriteButton
          type="button"
          variant="outline"
          onClick={() => setRemindOpen(true)}
          disabled={remind.isPending}
          className="flex-1 md:flex-none"
        >
          <Bell className="mr-1.5 size-4" aria-hidden />
          {t('payments.pending.bulk.remind')}
        </WriteButton>
        <WriteButton
          type="button"
          variant="outline"
          onClick={() =>
            exportMut.mutate({ studentIds: [...selectedIds] })
          }
          disabled={exportMut.isPending}
          className="flex-1 md:flex-none"
        >
          <Download className="mr-1.5 size-4" aria-hidden />
          {t('payments.pending.bulk.export')}
        </WriteButton>
        <WriteButton
          type="button"
          variant="outline"
          onClick={() => setManualOpen(true)}
          className="flex-1 md:flex-none"
        >
          <Pencil className="mr-1.5 size-4" aria-hidden />
          {t('payments.pending.bulk.manualEntry')}
        </WriteButton>
      </BulkActionBar>

      <ConfirmDialog
        open={remindOpen}
        onOpenChange={setRemindOpen}
        title={t('payments.pending.bulk.remindTitle')}
        description={t('payments.pending.bulk.remindBody', { count: selectedCount })}
        confirmLabel={t('payments.pending.bulk.remindConfirm')}
        requireReason={selectedCount > 50}
        minReasonLength={20}
        reasonPlaceholder={t('payments.pending.bulk.remindReasonHint')}
        onConfirm={async (reason) => {
          await remind.mutateAsync({
            studentIds: [...selectedIds],
            reason: reason ?? undefined,
          });
          setSelectedIds(new Set());
          setRemindOpen(false);
        }}
      />

      <ManualPaymentEntryDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
      />
    </div>
  );
}
