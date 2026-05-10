import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Organization } from '@/types/domain';
import { organizationApi } from '../api';
import { ORG_QUERY_KEY } from './useOrganization';

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Organization>) => organizationApi.update(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(ORG_QUERY_KEY, data);
    },
  });
}
