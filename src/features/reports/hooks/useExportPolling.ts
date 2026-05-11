import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { reportsApi } from '../api';

/**
 * Polls `/api/exports/:jobId` every 1s while the job is `processing`. Stops
 * automatically when status flips to `ready` or `failed`. When the job
 * completes, invalidates the exports list so RecentExportsList picks up the
 * final state.
 *
 * Pass `null` when no job is in flight — the query stays disabled and no
 * network traffic is generated.
 */
export function useExportPolling(jobId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reports', 'export-job', jobId],
    queryFn: () => reportsApi.pollExport(jobId as string),
    enabled: jobId !== null,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      // Backoff: 1s while processing, stop otherwise.
      if (status === 'processing') return 1000;
      return false;
    },
    refetchIntervalInBackground: false,
  });

  // Once the job terminates (ready / failed), refresh the recent-exports list
  // so its row no longer shows the inline processing note.
  useEffect(() => {
    if (query.data?.status === 'ready' || query.data?.status === 'failed') {
      queryClient.invalidateQueries({ queryKey: ['reports', 'exports'] });
    }
  }, [query.data?.status, queryClient]);

  return query;
}
