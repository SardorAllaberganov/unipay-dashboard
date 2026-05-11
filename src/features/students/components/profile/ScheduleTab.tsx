import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import { DataTable, type DataTableState } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNetworkState } from '@/hooks/useNetworkState';
import { formatMoney } from '@/lib/format';
import type { Money, PaymentType, ScheduleRow, ScheduleRowStatus } from '@/types/domain';
import {
  useAddScheduleRow,
  useDeleteScheduleRow,
  usePatchScheduleRow,
  useStudentSchedule,
} from '../../hooks/useStudentSchedule';
import { useScheduleTemplates } from '../../hooks/useScheduleTemplates';
import { InlineEditCell } from './InlineEditCell';

interface Props {
  studentId: string;
}

const PAYMENT_TYPES: PaymentType[] = ['tuition', 'dormitory', 'other'];

function parseAmount(raw: string): Money {
  const cleaned = raw.replace(/[\s\u00a0]/g, '').replace(',', '.');
  const num = Number(cleaned);
  const safe = Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
  return { amount: BigInt(safe) * 100n, currency: 'UZS' };
}

function moneyToInputString(m: Money): string {
  return String(Number(m.amount) / 100);
}

function deriveRowStatus(amount: Money, paid: Money, dueDate: string): ScheduleRowStatus {
  const amt = Number(amount.amount);
  const pd = Number(paid.amount);
  if (pd >= amt && amt > 0) return 'paid';
  const dueMs = new Date(dueDate).getTime();
  const overdue = Number.isFinite(dueMs) && dueMs < Date.now();
  if (pd > 0 && pd < amt) return overdue ? 'overdue' : 'partial';
  return overdue ? 'overdue' : 'pending';
}

export function ScheduleTab({ studentId }: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const scheduleQuery = useStudentSchedule(studentId);
  const templatesQuery = useScheduleTemplates();
  const addRow = useAddScheduleRow(studentId);
  const patchRow = usePatchScheduleRow(studentId);
  const deleteRow = useDeleteScheduleRow(studentId);
  const items = scheduleQuery.data?.items ?? [];
  const meta = scheduleQuery.data?._meta;
  const [confirmDelete, setConfirmDelete] = useState<ScheduleRow | null>(null);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);

  const state: DataTableState = useMemo(() => {
    if (scheduleQuery.isLoading) return 'loading';
    if (scheduleQuery.isError) return online ? 'error' : 'offline';
    if (!online && items.length === 0) return 'offline';
    if (meta?.partial) return 'partial';
    if (items.length === 0) return 'empty';
    return 'data';
  }, [scheduleQuery.isLoading, scheduleQuery.isError, online, items.length, meta?.partial]);

  const savePatch = async (row: ScheduleRow, patch: Partial<ScheduleRow>) => {
    try {
      // Recompute derived status when amount / paid / dueDate change.
      const merged = { ...row, ...patch };
      const next = {
        ...patch,
        status: deriveRowStatus(merged.amount, merged.paid, merged.dueDate),
      };
      await patchRow.mutateAsync({ rowId: row.id, patch: next });
      toast.success(t('students.schedule.savedToast'));
    } catch {
      toast.error(t('students.schedule.errorToast'));
      throw new Error('save_failed');
    }
  };

  const columns = useMemo<ColumnDef<ScheduleRow, unknown>[]>(
    () => [
      {
        id: 'period',
        header: () => t('students.schedule.columns.period'),
        cell: ({ row }) => (
          <InlineEditCell
            value={row.original.period}
            ariaLabel={t('students.schedule.columns.period')}
            onSave={(next) => savePatch(row.original, { period: next })}
          />
        ),
      },
      {
        id: 'type',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.schedule.columns.type'),
        cell: ({ row }) => (
          <Select
            value={row.original.type}
            onValueChange={(next) =>
              void savePatch(row.original, { type: next as PaymentType })
            }
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPES.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`students.schedule.paymentTypes.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: 'amount',
        meta: { cellClassName: 'text-right' },
        header: () => t('students.schedule.columns.amount'),
        cell: ({ row }) => (
          <InlineEditCell
            value={moneyToInputString(row.original.amount)}
            display={() => formatMoney(row.original.amount)}
            inputMode="decimal"
            ariaLabel={t('students.schedule.columns.amount')}
            align="right"
            onSave={(next) => savePatch(row.original, { amount: parseAmount(next) })}
          />
        ),
      },
      {
        id: 'paid',
        meta: { cellClassName: 'text-right' },
        header: () => t('students.schedule.columns.paid'),
        cell: ({ row }) => (
          <InlineEditCell
            value={moneyToInputString(row.original.paid)}
            display={() => formatMoney(row.original.paid)}
            inputMode="decimal"
            ariaLabel={t('students.schedule.columns.paid')}
            align="right"
            onSave={(next) => savePatch(row.original, { paid: parseAmount(next) })}
          />
        ),
      },
      {
        id: 'remaining',
        meta: { cellClassName: 'text-right' },
        header: () => t('students.schedule.columns.remaining'),
        cell: ({ row }) => <AmountDisplay value={row.original.remaining} />,
      },
      {
        id: 'dueDate',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.schedule.columns.dueDate'),
        cell: ({ row }) => (
          <InlineEditCell
            value={row.original.dueDate}
            type="date"
            display={() => <DateDisplay value={row.original.dueDate} />}
            ariaLabel={t('students.schedule.columns.dueDate')}
            onSave={(next) => savePatch(row.original, { dueDate: next })}
          />
        ),
      },
      {
        id: 'status',
        meta: { headerClassName: 'w-[1%]' },
        header: () => t('students.schedule.columns.status'),
        cell: ({ row }) => <StatusBadge variant={row.original.status} />,
      },
      {
        id: 'actions',
        meta: { headerClassName: 'w-[1%]', cellClassName: 'pr-3' },
        header: () => (
          <span className="sr-only">{t('students.schedule.columns.actions')}</span>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-9 p-0 text-muted-foreground hover:text-danger-700"
              aria-label={t('common.actions.delete')}
              onClick={() => setConfirmDelete(row.original)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const addEmptyRow = () => {
    const today = new Date().toISOString().slice(0, 10);
    // Server requires non-empty period / type / amount / dueDate. Seed a localized
    // placeholder the user can immediately inline-edit; everything else uses zero
    // defaults that are still truthy objects.
    void addRow.mutateAsync({
      period: t('students.schedule.newRowPeriod'),
      type: 'tuition',
      amount: { amount: 0n, currency: 'UZS' },
      paid: { amount: 0n, currency: 'UZS' },
      remaining: { amount: 0n, currency: 'UZS' },
      dueDate: today,
      status: 'pending',
    });
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <WriteButton
          type="button"
          variant="outline"
          disabled={(templatesQuery.data?.items.length ?? 0) === 0}
          onClick={() => setApplyTemplateOpen(true)}
        >
          <FileSpreadsheet className="mr-1.5 size-4" aria-hidden />
          {t('students.schedule.applyTemplate')}
        </WriteButton>
      </div>

      <DataTable<ScheduleRow>
        columns={columns}
        data={items}
        state={state}
        onRetry={() => void scheduleQuery.refetch()}
        emptyTitle={t('students.schedule.emptyTitle')}
        emptyDescription={t('students.schedule.emptyBody')}
        partial={
          meta?.partial && meta.shown !== undefined && meta.total !== undefined
            ? { shown: meta.shown, total: meta.total }
            : undefined
        }
        rowKey={(row) => row.id}
      />

      <div className="mt-3 flex justify-start">
        <WriteButton type="button" variant="outline" onClick={addEmptyRow}>
          <Plus className="mr-1.5 size-4" aria-hidden />
          {t('students.schedule.addRow')}
        </WriteButton>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={t('students.schedule.removeTitle')}
        description={t('students.schedule.removeBody')}
        confirmLabel={t('common.actions.delete')}
        destructive
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteRow.mutateAsync(confirmDelete.id);
          toast.success(t('students.schedule.removeSuccess'));
          setConfirmDelete(null);
        }}
      />

      <ApplyTemplatePickDialog
        studentId={studentId}
        open={applyTemplateOpen}
        onOpenChange={setApplyTemplateOpen}
      />
    </>
  );
}

// ---- Apply-template picker (single-student scope) ----
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useApplyTemplate } from '../../hooks/useScheduleTemplates';

function ApplyTemplatePickDialog({
  studentId,
  open,
  onOpenChange,
}: {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const templates = useScheduleTemplates();
  const [picked, setPicked] = useState<string>('');
  const [reason, setReason] = useState('');
  const apply = useApplyTemplate(picked);

  const handleConfirm = async () => {
    if (!picked || reason.trim().length < 20) return;
    await apply.mutateAsync({ studentIds: [studentId], reason });
    onOpenChange(false);
    setPicked('');
    setReason('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setPicked('');
          setReason('');
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('students.schedules.apply.title')}</DialogTitle>
          <DialogDescription>{t('students.schedules.apply.reasonHint')}</DialogDescription>
        </DialogHeader>
        <Select value={picked} onValueChange={setPicked}>
          <SelectTrigger>
            <SelectValue placeholder={t('students.add.pickTemplate')} />
          </SelectTrigger>
          <SelectContent>
            {(templates.data?.items ?? []).map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id}>
                {tpl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={t('common.reasonPlaceholder')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
        />
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="button"
            disabled={!picked || reason.trim().length < 20 || apply.isPending}
            loading={apply.isPending}
            onClick={() => void handleConfirm()}
          >
            {t('students.schedules.apply.confirm')}
          </WriteButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
