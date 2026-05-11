import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../api';
import { STAFF_QUERY_KEY } from './useStaff';

/**
 * Cross-tab sync key. When a revoke mutation succeeds in any tab, bumping this key
 * triggers a `storage` event in every OTHER tab — the listener below then invalidates
 * the sessions query so the UI re-fetches and shows the revoked-state.
 *
 * NOTE: this hook is named `useStaffSessions` (feature-local) for now. When Prompt 10
 * Settings ships the shared `useMyActiveSessions(staffId?)` store, hoist this logic
 * there and have the staff feature consume the shared module.
 */
const SESSIONS_SYNC_KEY = 'unipay-staff-sessions-sync';

export function staffSessionsKey(id: string) {
  return [...STAFF_QUERY_KEY, 'sessions', id] as const;
}

export function bumpStaffSessionsSync(): void {
  try {
    // Value irrelevant — listeners look for the key event only.
    localStorage.setItem(SESSIONS_SYNC_KEY, String(Date.now()));
  } catch {
    // SSR / no localStorage / quota — silently skip cross-tab sync.
  }
}

export function useStaffSessions(id: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const handler = (e: StorageEvent) => {
      if (e.key !== SESSIONS_SYNC_KEY) return;
      void queryClient.invalidateQueries({ queryKey: staffSessionsKey(id) });
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [id, queryClient]);

  return useQuery({
    queryKey: staffSessionsKey(id ?? ''),
    queryFn: () => staffApi.sessions(id!),
    enabled: !!id,
  });
}
