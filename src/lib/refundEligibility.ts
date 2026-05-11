// Refund eligibility — paid + age <90d. Returns localized-i18n-key reasons when not eligible
// so callers can render an explanatory tooltip on the disabled <WriteButton>.
import type { Transaction } from '@/types/domain';

export type RefundIneligibleReason = 'not_paid' | 'too_old' | 'already_refunded';

export interface RefundEligibility {
  eligible: boolean;
  reason: RefundIneligibleReason | null;
  reasonKey: string | null;
}

const MAX_AGE_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getRefundEligibility(
  transaction: Pick<Transaction, 'status' | 'createdAt'>,
  now: Date = new Date(),
): RefundEligibility {
  if (transaction.status === 'refunded') {
    return {
      eligible: false,
      reason: 'already_refunded',
      reasonKey: 'payments.refund.ineligible.alreadyRefunded',
    };
  }
  if (transaction.status !== 'paid') {
    return {
      eligible: false,
      reason: 'not_paid',
      reasonKey: 'payments.refund.ineligible.notPaid',
    };
  }
  const ageDays = (now.getTime() - new Date(transaction.createdAt).getTime()) / MS_PER_DAY;
  if (ageDays > MAX_AGE_DAYS) {
    return {
      eligible: false,
      reason: 'too_old',
      reasonKey: 'payments.refund.ineligible.tooOld',
    };
  }
  return { eligible: true, reason: null, reasonKey: null };
}
