import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { staffApi, type StaffActivityParams } from '../api';
import { STAFF_QUERY_KEY } from './useStaff';

export function staffActivityKey(id: string, params: StaffActivityParams) {
  return [...STAFF_QUERY_KEY, 'activity', id, params] as const;
}

export function useStaffActivity(
  id: string | undefined,
  params: StaffActivityParams = {}
) {
  return useQuery({
    queryKey: staffActivityKey(id ?? '', params),
    queryFn: () => staffApi.activity(id!, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}
