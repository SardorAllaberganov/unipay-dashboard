import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  resolveDateRange,
  type DateRangeKey,
  type DateRangeValue,
} from '@/components/shared/dateRange';

const RANGE_KEYS: DateRangeKey[] = ['today', 'yesterday', '7d', '30d', 'custom'];
const DEFAULT_RANGE: DateRangeKey = '30d';

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseISODay(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseRangeKey(s: string | null): DateRangeKey {
  if (s && (RANGE_KEYS as string[]).includes(s)) return s as DateRangeKey;
  return DEFAULT_RANGE;
}

/**
 * Reads the canonical `?range=&from=&to=` triplet that both Reports tabs share.
 * Returns the picker value, the resolved ISO-day range for API calls, and an
 * onChange that pushes back to the URL (replace, not push, so the back-button
 * stays sane).
 */
export function useReportRangeParam() {
  const [searchParams, setSearchParams] = useSearchParams();

  const value: DateRangeValue = useMemo(() => {
    const rangeKey = parseRangeKey(searchParams.get('range'));
    if (rangeKey === 'custom') {
      const from = parseISODay(searchParams.get('from')) ?? undefined;
      const to = parseISODay(searchParams.get('to')) ?? undefined;
      return { range: 'custom', customFrom: from, customTo: to };
    }
    return { range: rangeKey };
  }, [searchParams]);

  const apiRange = useMemo(() => {
    const resolved = resolveDateRange(value);
    if (!resolved?.from || !resolved.to) return undefined;
    return { from: isoDay(resolved.from), to: isoDay(resolved.to) };
  }, [value]);

  const handleChange = useCallback(
    (next: DateRangeValue) => {
      const sp = new URLSearchParams(searchParams);
      sp.set('range', next.range);
      if (next.range === 'custom' && next.customFrom && next.customTo) {
        sp.set('from', isoDay(next.customFrom));
        sp.set('to', isoDay(next.customTo));
      } else {
        sp.delete('from');
        sp.delete('to');
      }
      setSearchParams(sp, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { value, apiRange, handleChange };
}
