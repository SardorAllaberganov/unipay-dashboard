// Manual payment entry — ResponsiveSheet with form. Student → schedule cascade.
// Required reason (note ≥20) per §0.9 destructive-action convention (manual entries
// are admin write actions affecting the ledger).
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WriteButton } from '@/components/unipay/WriteButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { manualPaymentSchema, parseAmountToUzs, type ManualPaymentValues } from '../schemas';
import { useManualPayment } from '../hooks/usePaymentsMutations';
import { useStudentSchedule } from '@/features/students/hooks/useStudentSchedule';
import { StudentSearchPicker } from './StudentSearchPicker';
import { MANUAL_PAYMENT_METHODS, type Student } from '@/types/domain';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedStudent?: Student;
  onSuccess?: () => void;
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualPaymentEntryDialog({
  open,
  onOpenChange,
  preselectedStudent,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const [student, setStudent] = useState<Student | null>(preselectedStudent ?? null);

  const form = useForm<ManualPaymentValues>({
    resolver: zodResolver(manualPaymentSchema(t)),
    defaultValues: {
      studentId: preselectedStudent?.id ?? '',
      amount: '',
      scheduleId: '',
      paymentMethod: 'cash',
      paymentDate: isoToday(),
      receiptNumber: '',
      note: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) {
      setStudent(preselectedStudent ?? null);
      form.reset({
        studentId: preselectedStudent?.id ?? '',
        amount: '',
        scheduleId: '',
        paymentMethod: 'cash',
        paymentDate: isoToday(),
        receiptNumber: '',
        note: '',
      });
    }
  }, [open, preselectedStudent, form]);

  useEffect(() => {
    form.setValue('studentId', student?.id ?? '', { shouldValidate: true });
    if (!student) {
      form.setValue('scheduleId', '');
    }
  }, [student, form]);

  const scheduleQuery = useStudentSchedule(student?.id);
  const openScheduleRows = useMemo(() => {
    const items = scheduleQuery.data?.items ?? [];
    return items.filter(
      (r) => r.status === 'pending' || r.status === 'partial' || r.status === 'overdue',
    );
  }, [scheduleQuery.data]);

  const mutation = useManualPayment();

  const onSubmit = form.handleSubmit(async (values) => {
    const amountUzs = parseAmountToUzs(values.amount);
    if (amountUzs === null) return;
    await mutation.mutateAsync({
      studentId: values.studentId,
      amountUzs,
      scheduleId: values.scheduleId,
      paymentMethod: values.paymentMethod,
      paymentDate: values.paymentDate,
      receiptNumber: values.receiptNumber || undefined,
      note: values.note,
    });
    onOpenChange(false);
    onSuccess?.();
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('payments.manualEntry.title')}
      description={t('payments.manualEntry.subtitle')}
      contentClassName="sm:max-w-xl"
    >
      <form id="manual-payment-form" onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t('payments.manualEntry.fields.student')}</Label>
          <StudentSearchPicker
            value={student}
            onChange={setStudent}
            disabled={!!preselectedStudent}
          />
          {form.formState.errors.studentId ? (
            <p className="text-sm text-destructive">{form.formState.errors.studentId.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mp-amount">{t('payments.manualEntry.fields.amount')}</Label>
          <Input
            id="mp-amount"
            inputMode="decimal"
            placeholder={t('payments.manualEntry.fields.amountPlaceholder')}
            className="font-mono tabular"
            {...form.register('amount')}
          />
          {form.formState.errors.amount ? (
            <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>{t('payments.manualEntry.fields.schedule')}</Label>
          <Controller
            control={form.control}
            name="scheduleId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!student || openScheduleRows.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('payments.manualEntry.fields.schedulePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {openScheduleRows.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {student && openScheduleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('payments.manualEntry.fields.noSchedules')}
            </p>
          ) : null}
          {form.formState.errors.scheduleId ? (
            <p className="text-sm text-destructive">{form.formState.errors.scheduleId.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>{t('payments.manualEntry.fields.paymentMethod')}</Label>
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex flex-wrap gap-3"
              >
                {MANUAL_PAYMENT_METHODS.map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <RadioGroupItem value={m} id={`mp-method-${m}`} />
                    <Label htmlFor={`mp-method-${m}`} className="font-normal">
                      {t(`payments.detail.paymentMethod.${m}`)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mp-date">{t('payments.manualEntry.fields.paymentDate')}</Label>
            <Input
              id="mp-date"
              type="date"
              max={isoToday()}
              {...form.register('paymentDate')}
            />
            {form.formState.errors.paymentDate ? (
              <p className="text-sm text-destructive">{form.formState.errors.paymentDate.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp-receipt">
              {t('payments.manualEntry.fields.receiptNumber')}
            </Label>
            <Input
              id="mp-receipt"
              placeholder={t('payments.manualEntry.fields.receiptNumberPlaceholder')}
              {...form.register('receiptNumber')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mp-note">{t('payments.manualEntry.fields.note')}</Label>
          <Textarea
            id="mp-note"
            rows={3}
            placeholder={t('payments.manualEntry.fields.noteHint')}
            {...form.register('note')}
          />
          {form.formState.errors.note ? (
            <p className="text-sm text-destructive">{form.formState.errors.note.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="submit"
            form="manual-payment-form"
            disabled={mutation.isPending}
          >
            {t('payments.manualEntry.submit')}
          </WriteButton>
        </div>
      </form>
    </ResponsiveSheet>
  );
}
