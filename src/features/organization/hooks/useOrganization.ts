import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '../api';

export const ORG_QUERY_KEY = ['organization'] as const;

export function useOrganization() {
  return useQuery({
    queryKey: ORG_QUERY_KEY,
    queryFn: organizationApi.get,
  });
}
