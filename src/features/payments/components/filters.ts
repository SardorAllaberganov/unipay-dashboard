// Helpers for TransactionFilters. Lives outside the component file so
// react-refresh/only-export-components stays happy.
import { resolveDateRange } from '@/components/shared/dateRange';
import type { TransactionFiltersValue } from './TransactionFilters';

export function resolveFilters(v: TransactionFiltersValue): {
  from?: string;
  to?: string;
} {
  const range = resolveDateRange(v.dateRange);
  if (!range) return {};
  return { from: range.from?.toISOString(), to: range.to?.toISOString() };
}
