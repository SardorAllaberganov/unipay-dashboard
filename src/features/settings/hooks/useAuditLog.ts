import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { settingsApi, type AuditListParams } from '../api';
import type { AuditAction } from '@/types/domain';

export const AUDIT_QUERY_KEY = ['settings', 'audit'] as const;
export const AUDIT_PAGE_SIZE = 50;

export interface AuditFilters {
  actor: string;
  action: AuditAction | '';
  from: string;
  to: string;
  page: number;
}

export function useAuditFiltersFromUrl(): {
  filters: AuditFilters;
  setFilters: (next: Partial<AuditFilters>) => void;
  reset: () => void;
} {
  const [params, setParams] = useSearchParams();
  const filters: AuditFilters = {
    actor: params.get('actor') ?? '',
    action: (params.get('action') as AuditAction | '' | null) ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    page: Math.max(1, Number(params.get('page') ?? '1') || 1),
  };

  const setFilters = (next: Partial<AuditFilters>) => {
    const merged = { ...filters, ...next };
    const sp = new URLSearchParams();
    if (merged.actor) sp.set('actor', merged.actor);
    if (merged.action) sp.set('action', merged.action);
    if (merged.from) sp.set('from', merged.from);
    if (merged.to) sp.set('to', merged.to);
    // Reset page on filter change unless the caller explicitly set one.
    if (next.page !== undefined) {
      if (merged.page > 1) sp.set('page', String(merged.page));
    }
    setParams(sp, { replace: true });
  };

  const reset = () => {
    setParams(new URLSearchParams(), { replace: true });
  };

  return { filters, setFilters, reset };
}

export function useAuditLog(filters: AuditFilters) {
  const params: AuditListParams = {
    actor: filters.actor || undefined,
    action: filters.action || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    page: filters.page,
    pageSize: AUDIT_PAGE_SIZE,
  };
  return useQuery({
    queryKey: [...AUDIT_QUERY_KEY, params] as const,
    queryFn: () => settingsApi.auditLog(params),
  });
}
