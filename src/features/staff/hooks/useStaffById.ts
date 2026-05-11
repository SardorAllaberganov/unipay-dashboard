import { useQuery } from '@tanstack/react-query';
import { staffApi } from '../api';
import { STAFF_QUERY_KEY } from './useStaff';

export function staffByIdKey(id: string) {
  return [...STAFF_QUERY_KEY, 'detail', id] as const;
}

export function useStaffById(id: string | undefined) {
  return useQuery({
    queryKey: staffByIdKey(id ?? ''),
    queryFn: () => staffApi.getById(id!),
    enabled: !!id,
  });
}
