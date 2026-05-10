import { useMutation } from '@tanstack/react-query';
import { dashboardApi } from '../api';

interface Vars {
  studentIds: string[];
  reason: string;
}

export function useBulkRemindUnpaid() {
  return useMutation({
    mutationFn: ({ studentIds, reason }: Vars) =>
      dashboardApi.bulkRemind(studentIds, reason),
  });
}
