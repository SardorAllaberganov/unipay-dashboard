// 2-step <AlertDialog> for confirming a pending payout. Per spec §11.2:
// Step 1 — review (amount, bank account, period). Step 2 — type the exact amount
// + reason ≥20 chars. The amount-typed check parses the user's string the same
// way the user sees the displayed value (with NBSP allowed) so paste-from-screen
// works without surprises (per LESSONS 2026-05-11 on NBSP in regex).
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaskedAccount } from '@/components/unipay/MaskedAccount';
import { formatDate, formatMoney } from '@/lib/format';
import { REASON_MIN_LENGTH } from '../api';
import { useConfirmPayout } from '../hooks/useConfirmPayout';
import type { BankAccount } from '@/types/domain';
import type { PayoutJson } from '../api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payout: PayoutJson;
  bankAccount?: BankAccount;
  onSuccess?: (updated: PayoutJson) => void;
}

type Step = 'review' | 'confirm';

// Parse a user-typed amount that may contain space / NBSP digit grouping or comma
// decimals. Returns NaN on failure. NBSP escape per LESSONS 2026-05-11 — never put
// a literal NBSP in the source character class.
function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[\s\u00A0]/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function ConfirmPayoutDialog({
  open,
  onOpenChange,
  payout,
  bankAccount,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('review');
  const [typedAmount, setTypedAmount] = useState('');
  const [reason, setReason] = useState('');
  const confirm = useConfirmPayout(payout.id);

  const expectedUzs = useMemo(() => Number(payout.net.amount) / 100, [payout.net.amount]);

  useEffect(() => {
    if (!open) {
      setStep('review');
      setTypedAmount('');
      setReason('');
    }
  }, [open]);

  const parsed = parseAmount(typedAmount);
  const amountOk = !Number.isNaN(parsed) && parsed === expectedUzs;
  const reasonOk = reason.trim().length >= REASON_MIN_LENGTH;

  const onSubmit = () => {
    if (!amountOk || !reasonOk) return;
    confirm.mutate(
      { amount: expectedUzs, reason: reason.trim() },
      {
        onSuccess: (updated) => {
          toast.success(t('payouts.confirm.successToast'));
          onSuccess?.(updated);
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : t('errors.generic');
          toast.error(msg);
        },
      },
    );
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (confirm.isPending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {step === 'review'
              ? t('payouts.confirm.step1.title')
              : t('payouts.confirm.step2.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === 'review'
              ? t('payouts.confirm.step1.body')
              : t('payouts.confirm.step2.body')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 'review' ? (
          <dl className="grid grid-cols-3 gap-x-4 gap-y-3 rounded-md border border-border bg-muted/20 p-4 text-sm">
            <dt className="col-span-1 text-muted-foreground">
              {t('payouts.confirm.step1.amountLabel')}
            </dt>
            <dd className="col-span-2 tabular font-mono text-base font-semibold text-foreground">
              {formatMoney(payout.net)}
            </dd>
            <dt className="col-span-1 text-muted-foreground">
              {t('payouts.confirm.step1.periodLabel')}
            </dt>
            <dd className="col-span-2 tabular text-foreground">
              {formatDate(payout.periodFrom)} – {formatDate(payout.periodTo)}
            </dd>
            <dt className="col-span-1 text-muted-foreground">
              {t('payouts.confirm.step1.bankLabel')}
            </dt>
            <dd className="col-span-2 text-foreground">
              {bankAccount ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  <span>{bankAccount.bankName}</span>
                  <MaskedAccount value={bankAccount.accountNumber} className="text-xs" />
                </span>
              ) : (
                '—'
              )}
            </dd>
          </dl>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="payout-confirm-amount">
                {t('payouts.confirm.step2.amountLabel', {
                  amount: formatMoney(payout.net),
                })}
              </Label>
              <Input
                id="payout-confirm-amount"
                inputMode="decimal"
                value={typedAmount}
                onChange={(e) => setTypedAmount(e.target.value)}
                placeholder={String(expectedUzs)}
                className="tabular font-mono"
                aria-invalid={typedAmount.length > 0 && !amountOk}
                disabled={confirm.isPending}
              />
              {typedAmount.length > 0 && !amountOk ? (
                <p className="text-sm text-danger-700">
                  {t('payouts.confirm.errors.amountMismatch')}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="payout-confirm-reason">
                {t('payouts.confirm.step2.reasonLabel', { count: REASON_MIN_LENGTH })}
              </Label>
              <Textarea
                id="payout-confirm-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('payouts.confirm.step2.reasonPlaceholder')}
                disabled={confirm.isPending}
              />
              {reason.length > 0 && !reasonOk ? (
                <p className="text-sm text-muted-foreground">
                  {t('payouts.confirm.errors.reasonTooShort', { min: REASON_MIN_LENGTH })}
                </p>
              ) : null}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          {step === 'review' ? (
            <>
              <AlertDialogCancel disabled={confirm.isPending}>
                {t('common.actions.cancel')}
              </AlertDialogCancel>
              <Button type="button" onClick={() => setStep('confirm')}>
                {t('payouts.confirm.step1.next')}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('review')}
                disabled={confirm.isPending}
              >
                {t('common.actions.back')}
              </Button>
              <AlertDialogAction asChild>
                <WriteButton
                  type="button"
                  onClick={onSubmit}
                  disabled={!amountOk || !reasonOk || confirm.isPending}
                >
                  {confirm.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                      {t('payouts.confirm.step2.submitting')}
                    </>
                  ) : (
                    t('payouts.confirm.step2.submit')
                  )}
                </WriteButton>
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
