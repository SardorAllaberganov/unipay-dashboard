import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { staffApi, type StaffListParams } from '../api';

export const STAFF_QUERY_KEY = ['staff'] as const;

export function staffListKey(params: StaffListParams) {
  return [...STAFF_QUERY_KEY, 'list', params] as const;
}

export function useStaff(params: StaffListParams) {
  return useQuery({
    queryKey: staffListKey(params),
    queryFn: () => staffApi.list(params),
    placeholderData: keepPreviousData,
  });
}
