// Zod factories for the Payouts module. `t`-aware so error messages are localized.
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { MIN_PAYOUT_UZS, REASON_MIN_LENGTH } from './api';

export function requestPayoutSchema(t: TFunction) {
  return z.object({
    bankAccountId: z.string().min(1, t('payouts.request.errors.bankAccountRequired')),
    amount: z
      .number({ invalid_type_error: t('payouts.request.errors.amountInvalid') })
      .min(MIN_PAYOUT_UZS, t('payouts.request.errors.amountBelowMin', { min: MIN_PAYOUT_UZS })),
    note: z.string().max(500).optional().or(z.literal('')),
  });
}

export type RequestPayoutValues = z.infer<ReturnType<typeof requestPayoutSchema>>;

export function confirmPayoutSchema(t: TFunction, expectedAmountUzs: number) {
  return z.object({
    amount: z
      .number({ invalid_type_error: t('payouts.confirm.errors.amountInvalid') })
      .refine(
        (v) => v === expectedAmountUzs,
        t('payouts.confirm.errors.amountMismatch'),
      ),
    reason: z
      .string()
      .trim()
      .min(REASON_MIN_LENGTH, t('payouts.confirm.errors.reasonTooShort', { min: REASON_MIN_LENGTH })),
  });
}

export type ConfirmPayoutValues = z.infer<ReturnType<typeof confirmPayoutSchema>>;

export function cancelPayoutSchema(t: TFunction) {
  return z.object({
    reason: z
      .string()
      .trim()
      .min(REASON_MIN_LENGTH, t('payouts.cancel.errors.reasonTooShort', { min: REASON_MIN_LENGTH })),
  });
}

export type CancelPayoutValues = z.infer<ReturnType<typeof cancelPayoutSchema>>;
