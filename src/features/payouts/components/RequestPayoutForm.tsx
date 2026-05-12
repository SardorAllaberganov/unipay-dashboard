// Manual payout request form — spec §11.3. RHF + Zod. The submit button is a
// <WriteButton> (auto-disables offline) and opens the 2-step <ConfirmPayoutDialog>
// before any state-changing POST fires. Bank account dropdown lists verified
// accounts only. Read-only amount = full available balance from /api/payouts/balance.
// Below-minimum balance disables submit with a Tooltip explaining the threshold.
import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { MaskedAccount } from '@/components/unipay/MaskedAccount';
import { ListRowSkeleton, PanelErrorState } from '@/components/shared/PanelStates';
import { formatMoney } from '@/lib/format';
import { requestPayoutSchema, type RequestPayoutValues } from '../schemas';
import { useRequestPayout } from '../hooks/useRequestPayout';
import { useVerifiedBankAccounts } from '../hooks/usePayoutBalance';
import { MIN_PAYOUT_UZS } from '../api';
import type { PayoutBalanceJson } from '../api';

interface Props {
  balance: PayoutBalanceJson;
}

export function RequestPayoutForm({ balance }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const banks = useVerifiedBankAccounts();
  const requestMut = useRequestPayout();
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const availableUzs = Number(balance.available.amount) / 100;
  const belowMinimum = availableUzs < MIN_PAYOUT_UZS;

  const form = useForm<RequestPayoutValues>({
    resolver: zodResolver(requestPayoutSchema(t)),
    defaultValues: {
      bankAccountId: '',
      amount: availableUzs,
      note: '',
    },
    mode: 'onChange',
  });

  // Sync the form's amount with the live balance — important if the balance refetch
  // surfaces an updated number while the user is still on the page.
  useEffect(() => {
    form.setValue('amount', availableUzs, { shouldValidate: false });
  }, [availableUzs, form]);

  // Auto-select the default bank account once verified accounts load.
  useEffect(() => {
    if (!banks.data?.items.length) return;
    const current = form.getValues('bankAccountId');
    if (current) return;
    const def = banks.data.items.find((b) => b.isDefault) ?? banks.data.items[0];
    if (def) form.setValue('bankAccountId', def.id, { shouldDirty: false });
  }, [banks.data, form]);

  const onSubmit = (values: RequestPayoutValues) => {
    setPendingSubmit(true);
    requestMut.mutate(
      {
        bankAccountId: values.bankAccountId,
        amount: values.amount,
        note: values.note?.trim() || undefined,
      },
      {
        onSuccess: (created) => {
          toast.success(t('payouts.request.successToast'));
          navigate(`/payouts/${created.id}`);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : t('errors.generic');
          toast.error(msg);
          setPendingSubmit(false);
        },
      },
    );
  };

  const isSubmitting = pendingSubmit || requestMut.isPending;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex max-w-2xl flex-col gap-6"
      noValidate
    >
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-brand-600" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('payouts.request.availableLabel')}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular font-mono text-foreground">
          {formatMoney(balance.available)}
        </p>
        {belowMinimum ? (
          <div
            role="status"
            className="rounded-md border border-warning-600/30 bg-warning-50 p-3 text-sm text-warning-700 dark:bg-warning-700/10 dark:text-warning-400"
          >
            {t('payouts.request.belowMinimumBanner', {
              min: formatMoney({ amount: MIN_PAYOUT_UZS * 100, currency: 'UZS' }),
              available: formatMoney(balance.available),
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('payouts.request.amountHint', {
              min: formatMoney({ amount: MIN_PAYOUT_UZS * 100, currency: 'UZS' }),
            })}
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-2">
        <Label htmlFor="request-bank">{t('payouts.request.bankAccountLabel')}</Label>
        {banks.isLoading ? (
          <ListRowSkeleton />
        ) : banks.isError ? (
          <PanelErrorState onRetry={() => banks.refetch()} />
        ) : !banks.data || banks.data.items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
            {t('payouts.request.noVerifiedAccounts')}
          </div>
        ) : (
          <Select
            value={form.watch('bankAccountId')}
            onValueChange={(v) =>
              form.setValue('bankAccountId', v, { shouldDirty: true, shouldValidate: true })
            }
          >
            <SelectTrigger id="request-bank" aria-invalid={!!form.formState.errors.bankAccountId}>
              <SelectValue placeholder={t('payouts.request.bankAccountPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {banks.data.items.map((ba) => (
                <SelectItem key={ba.id} value={ba.id}>
                  <span className="flex items-center gap-2">
                    <span>{ba.bankName}</span>
                    <MaskedAccount value={ba.accountNumber} className="text-xs" />
                    {ba.isDefault ? (
                      <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                        {t('payouts.request.defaultLabel')}
                      </span>
                    ) : null}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {form.formState.errors.bankAccountId ? (
          <p className="text-sm text-danger-700">
            {form.formState.errors.bankAccountId.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="request-note">{t('payouts.request.noteLabel')}</Label>
        <Textarea
          id="request-note"
          rows={3}
          {...form.register('note')}
          placeholder={t('payouts.request.notePlaceholder')}
          maxLength={500}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/payouts')}
          disabled={isSubmitting}
        >
          {t('common.actions.cancel')}
        </Button>
        {belowMinimum ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <WriteButton type="button" disabled>
                  {t('payouts.request.submit')}
                </WriteButton>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t('payouts.request.belowMinimumTooltip', {
                min: formatMoney({ amount: MIN_PAYOUT_UZS * 100, currency: 'UZS' }),
                available: formatMoney(balance.available),
              })}
            </TooltipContent>
          </Tooltip>
        ) : (
          <WriteButton
            type="submit"
            disabled={
              isSubmitting ||
              !form.formState.isValid ||
              !banks.data?.items.length
            }
          >
            {isSubmitting ? t('payouts.request.submitting') : t('payouts.request.submit')}
          </WriteButton>
        )}
      </div>
    </form>
  );
}
