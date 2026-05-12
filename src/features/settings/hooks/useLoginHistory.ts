import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api';

export const LOGIN_HISTORY_QUERY_KEY = ['settings', 'login-history'] as const;

export function useLoginHistory(limit = 30) {
  return useQuery({
    queryKey: [...LOGIN_HISTORY_QUERY_KEY, limit] as const,
    queryFn: () => settingsApi.loginHistory(limit),
  });
}
