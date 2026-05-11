import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, type GenerateExportRequest } from '../api';

export function useGenerateExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateExportRequest) => reportsApi.generateExport(body),
    onSuccess: () => {
      // The new job appears immediately as 'processing' in the list — refresh
      // so RecentExportsList renders the row with its inline progress note.
      queryClient.invalidateQueries({ queryKey: ['reports', 'exports'] });
    },
  });
}
