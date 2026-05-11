// UI-side catalogue mirror of the backend `error_codes` table.
// See `.claude/rules/error-ux.md` — every failure carries category + retryable flag.
import type { FailureCode } from '@/types/domain';

export type ErrorCategory = 'acquiring' | 'provider' | 'compliance' | 'system';

export interface ErrorCodeEntry {
  code: FailureCode;
  category: ErrorCategory;
  retryable: boolean;
  titleKey: string;
  bodyKey: string;
}

export const ERROR_CODES: Record<FailureCode, ErrorCodeEntry> = {
  INSUFFICIENT_FUNDS: {
    code: 'INSUFFICIENT_FUNDS',
    category: 'acquiring',
    retryable: true,
    titleKey: 'errors.codes.INSUFFICIENT_FUNDS.title',
    bodyKey: 'errors.codes.INSUFFICIENT_FUNDS.body',
  },
  CARD_DECLINED: {
    code: 'CARD_DECLINED',
    category: 'acquiring',
    retryable: true,
    titleKey: 'errors.codes.CARD_DECLINED.title',
    bodyKey: 'errors.codes.CARD_DECLINED.body',
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    category: 'provider',
    retryable: true,
    titleKey: 'errors.codes.TIMEOUT.title',
    bodyKey: 'errors.codes.TIMEOUT.body',
  },
  INVALID_AMOUNT: {
    code: 'INVALID_AMOUNT',
    category: 'compliance',
    retryable: false,
    titleKey: 'errors.codes.INVALID_AMOUNT.title',
    bodyKey: 'errors.codes.INVALID_AMOUNT.body',
  },
};

export function lookupErrorCode(code: FailureCode | undefined): ErrorCodeEntry | undefined {
  if (!code) return undefined;
  return ERROR_CODES[code];
}
