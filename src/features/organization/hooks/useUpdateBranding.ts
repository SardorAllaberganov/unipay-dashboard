import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Branding } from '@/types/domain';
import { organizationApi } from '../api';
import { BRANDING_QUERY_KEY } from './useBranding';

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Branding>) => organizationApi.updateBranding(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(BRANDING_QUERY_KEY, data);
    },
  });
}
