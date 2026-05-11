import { z } from 'zod';
import { MANUAL_PAYMENT_METHODS, REFUND_REASONS, type ManualPaymentMethod, type RefundReason } from '@/types/domain';

type Translate = (key: string, opts?: Record<string, unknown>) => string;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Amount input accepts digits with locale-aware separators (NBSP + regular space + comma/period).
// NBSP escape per LESSONS 2026-05-11.
const AMOUNT_RE = /^[\d \u00a0]+(?:[.,]\d{1,2})?$/;

export function parseAmountToUzs(input: string): number | null {
  if (!input) return null;
  const cleaned = input.replace(/[\s\u00a0]/g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// -------- Manual Payment Entry --------

export const manualPaymentSchema = (t: Translate) =>
  z.object({
    studentId: z
      .string()
      .trim()
      .min(1, t('payments.manualEntry.validation.studentRequired')),
    amount: z
      .string()
      .trim()
      .min(1, t('payments.manualEntry.validation.amountPositive'))
      .regex(AMOUNT_RE, t('payments.manualEntry.validation.amountPositive'))
      .refine((v) => {
        const n = parseAmountToUzs(v);
        return n !== null && n > 0;
      }, { message: t('payments.manualEntry.validation.amountPositive') }),
    scheduleId: z
      .string()
      .trim()
      .min(1, t('payments.manualEntry.validation.scheduleRequired')),
    paymentMethod: z.enum([...MANUAL_PAYMENT_METHODS] as [ManualPaymentMethod, ...ManualPaymentMethod[]]),
    paymentDate: z
      .string()
      .min(1, t('payments.manualEntry.validation.dateRequired'))
      .regex(ISO_DATE_RE, t('payments.manualEntry.validation.dateRequired'))
      .refine((v) => new Date(v).getTime() <= Date.now(), {
        message: t('payments.manualEntry.validation.dateFuture'),
      }),
    receiptNumber: z.string().trim().optional(),
    note: z
      .string()
      .trim()
      .min(20, t('payments.manualEntry.validation.noteMinLength')),
  });

export type ManualPaymentValues = z.infer<ReturnType<typeof manualPaymentSchema>>;

// -------- Refund Dialog --------

export const refundSchema = (t: Translate, originalAmountUzs: number) =>
  z.object({
    amount: z
      .string()
      .trim()
      .min(1, t('payments.refund.dialog.validation.amountPositive'))
      .regex(AMOUNT_RE, t('payments.refund.dialog.validation.amountPositive'))
      .refine((v) => {
        const n = parseAmountToUzs(v);
        return n !== null && n > 0;
      }, { message: t('payments.refund.dialog.validation.amountPositive') })
      .refine((v) => {
        const n = parseAmountToUzs(v);
        return n !== null && n <= originalAmountUzs;
      }, { message: t('payments.refund.dialog.validation.amountExceedsOriginal') }),
    reason: z.enum([...REFUND_REASONS] as [RefundReason, ...RefundReason[]]),
    note: z
      .string()
      .trim()
      .min(20, t('payments.refund.dialog.validation.noteMinLength')),
    typePhrase: z
      .string()
      .superRefine((v, ctx) => {
        if (v !== 'REFUND') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('payments.refund.dialog.validation.typePhraseMismatch'),
          });
        }
      }),
  });

export type RefundValues = z.infer<ReturnType<typeof refundSchema>>;
