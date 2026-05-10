import { type DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/format';

export type DateRangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface DateRangeValue {
  range: DateRangeKey;
  customFrom?: Date;
  customTo?: Date;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Resolve a `DateRangeValue` to a concrete [from, to] pair for calendar
 * highlighting and API filtering. Keeps preset semantics in one place — no
 * separate range computation lives outside this primitive.
 */
export function resolveDateRange(value: DateRangeValue): DateRange | undefined {
  const today = startOfDay(new Date());
  if (value.range === 'today') return { from: today, to: today };
  if (value.range === 'yesterday') {
    const y = addDays(today, -1);
    return { from: y, to: y };
  }
  if (value.range === '7d') return { from: addDays(today, -6), to: today };
  if (value.range === '30d') return { from: addDays(today, -29), to: today };
  if (value.range === 'custom') {
    if (value.customFrom && value.customTo) {
      return { from: value.customFrom, to: value.customTo };
    }
    if (value.customFrom) return { from: value.customFrom, to: value.customFrom };
    return undefined;
  }
  return undefined;
}

/** Localized label for the active range — used by the trigger button. */
export function useDateRangeLabel(value: DateRangeValue): string {
  const { t } = useTranslation();
  if (value.range === 'custom') {
    if (value.customFrom && value.customTo) {
      return `${formatDate(value.customFrom)} – ${formatDate(value.customTo)}`;
    }
    return t('common.daterange.custom');
  }
  return t(`common.daterange.${value.range}`);
}
