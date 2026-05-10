import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '../api';

export const BRANDING_QUERY_KEY = ['organization', 'branding'] as const;

export function useBranding() {
  return useQuery({
    queryKey: BRANDING_QUERY_KEY,
    queryFn: organizationApi.getBranding,
  });
}
