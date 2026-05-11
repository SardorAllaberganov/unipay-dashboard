import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../api';

export function useExportsList() {
  return useQuery({
    queryKey: ['reports', 'exports'],
    queryFn: () => reportsApi.exportsList(),
  });
}

export function useDeleteExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => reportsApi.deleteExport(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'exports'] });
    },
  });
}
