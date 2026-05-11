// 2-step refund flow per spec §9.4. Single AlertDialog with internal step state — review
// → confirm. Step 2 requires typing "REFUND" as a verification phrase. Reason ≥20 chars.
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Undo2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WriteButton } from '@/components/unipay/WriteButton';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { refundSchema, type RefundValues, parseAmountToUzs } from '../schemas';
import { useInitiateRefund } from '../hooks/usePaymentsMutations';
import { REFUND_REASONS, type Transaction } from '@/types/domain';
import { formatNumber } from '@/lib/format';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onSuccess?: () => void;
}

export function RefundDialog({ open, onOpenChange, transaction, onSuccess }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'review' | 'confirm'>('review');
  const originalAmountUzs = useMemo(
    // MSW collapses Money.amount bigint -> number on the wire (BigInt.prototype.toJSON in
    // main.tsx). Use Number() then divide by 100 to avoid mixed-type errors that throw
    // when the runtime value is already a number.
    () => Number(transaction.amount.amount) / 100,
    [transaction.amount.amount],
  );
  const mutation = useInitiateRefund(transaction.id);

  const form = useForm<RefundValues>({
    resolver: zodResolver(refundSchema(t, originalAmountUzs)),
    defaultValues: {
      amount: formatNumber(originalAmountUzs),
      reason: 'other',
      note: '',
      typePhrase: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) {
      setStep('review');
      form.reset({
        amount: formatNumber(originalAmountUzs),
        reason: 'other',
        note: '',
        typePhrase: '',
      });
    }
  }, [open, originalAmountUzs, form]);

  const handleNext = form.handleSubmit(() => {
    setStep('confirm');
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const amountUzs = parseAmountToUzs(values.amount);
    if (amountUzs === null) return;
    await mutation.mutateAsync({
      amountUzs,
      reason: values.reason,
      note: values.note,
      typePhrase: 'REFUND',
    });
    onSuccess?.();
  });

  const isStep1 = step === 'review';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" aria-hidden />
            {isStep1
              ? t('payments.refund.dialog.step1Title')
              : t('payments.refund.dialog.step2Title')}
          </DialogTitle>
          {isStep1 ? (
            <DialogDescription>
              <span className="block">
                {t('payments.refund.dialog.originalSummary')}: {transaction.studentName} ·{' '}
                <span className="font-mono tabular">
                  <AmountDisplay value={transaction.amount} />
                </span>
              </span>
            </DialogDescription>
          ) : (
            <DialogDescription>{t('payments.refund.dialog.step2Body')}</DialogDescription>
          )}
        </DialogHeader>

        {isStep1 ? (
          <form
            id="refund-step1"
            onSubmit={handleNext}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="refund-amount">{t('payments.refund.dialog.amountField')}</Label>
              <Input
                id="refund-amount"
                inputMode="decimal"
                className="font-mono tabular"
                {...form.register('amount')}
              />
              <p className="text-sm text-muted-foreground">
                {t('payments.refund.dialog.amountHint')}
              </p>
              {form.formState.errors.amount ? (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{t('payments.refund.dialog.reasonField')}</Label>
              <Controller
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REFUND_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {t(`payments.refund.dialog.reasonOption.${r}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-note">{t('payments.refund.dialog.noteField')}</Label>
              <Textarea
                id="refund-note"
                rows={3}
                placeholder={t('payments.refund.dialog.noteHint')}
                {...form.register('note')}
              />
              {form.formState.errors.note ? (
                <p className="text-sm text-destructive">{form.formState.errors.note.message}</p>
              ) : null}
            </div>
          </form>
        ) : (
          <form
            id="refund-step2"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="text-muted-foreground">{t('payments.refund.dialog.amountField')}:</p>
              <p className="font-mono font-semibold tabular text-foreground">
                {formatNumber(parseAmountToUzs(form.getValues('amount')) ?? 0)} UZS
              </p>
              <p className="mt-2 text-muted-foreground">{t('payments.refund.dialog.reasonField')}:</p>
              <p className="text-foreground">
                {t(`payments.refund.dialog.reasonOption.${form.getValues('reason')}`)}
              </p>
              <p className="mt-2 text-muted-foreground">{t('payments.refund.dialog.noteField')}:</p>
              <p className="whitespace-pre-wrap text-foreground">{form.getValues('note')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-type">
                {t('payments.refund.dialog.typePhrase')}
              </Label>
              <Input
                id="refund-type"
                autoComplete="off"
                placeholder={t('payments.refund.dialog.typePhrasePlaceholder')}
                {...form.register('typePhrase')}
              />
              {form.formState.errors.typePhrase ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.typePhrase.message}
                </p>
              ) : null}
            </div>
          </form>
        )}

        <DialogFooter className="gap-2">
          {isStep1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" form="refund-step1">
                {t('payments.refund.dialog.nextCta')}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('review')}
              >
                {t('payments.refund.dialog.backCta')}
              </Button>
              <WriteButton
                type="submit"
                form="refund-step2"
                variant="destructive"
                disabled={mutation.isPending}
              >
                <Undo2 className="mr-1.5 size-4" aria-hidden />
                {t('payments.refund.dialog.submitCta')}
              </WriteButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
