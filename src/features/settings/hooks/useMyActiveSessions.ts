// Cross-tab sync: a revoke in tab A bumps the storage sync key; tab B's
// useEffect handler invalidates this query so the table re-fetches and reflects
// the new state. Same pattern as the staff-feature `useStaffSessions`, but
// scoped to /api/me/sessions and backed by the `lib/sessions.ts` module store
// (so consumers outside React — e.g. analytics — can read the snapshot).
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { settingsApi } from '../api';
import {
  broadcastSessionsChange,
  setMySessions,
  subscribeToCrossTabSessions,
} from '@/lib/sessions';

export const MY_SESSIONS_QUERY_KEY = ['settings', 'my-sessions'] as const;

export function useMyActiveSessions() {
  const qc = useQueryClient();

  useEffect(() => {
    return subscribeToCrossTabSessions(() => {
      void qc.invalidateQueries({ queryKey: MY_SESSIONS_QUERY_KEY });
    });
  }, [qc]);

  return useQuery({
    queryKey: MY_SESSIONS_QUERY_KEY,
    queryFn: async () => {
      const res = await settingsApi.listMySessions();
      setMySessions(res.items);
      return res;
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      settingsApi.revokeMySession(id, { reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MY_SESSIONS_QUERY_KEY });
      broadcastSessionsChange();
      toast.success(t('settings.security.sessions.revokedToast'));
    },
  });
}

export function useRevokeAllOtherSessions() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (reason: string) => settingsApi.revokeAllOtherSessions({ reason }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: MY_SESSIONS_QUERY_KEY });
      broadcastSessionsChange();
      toast.success(
        t('settings.security.sessions.revokedAllToast', { count: res.revoked }),
      );
    },
  });
}
