import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { studentsApi, type ActivityParams } from '../api';
import { STUDENTS_QUERY_KEY } from './useStudents';

export function studentActivityKey(id: string, params: ActivityParams) {
  return [...STUDENTS_QUERY_KEY, 'activity', id, params] as const;
}

export function useStudentActivity(id: string | undefined, params: ActivityParams = {}) {
  return useQuery({
    queryKey: id ? studentActivityKey(id, params) : ['students', 'activity', 'none'],
    queryFn: () => studentsApi.activity(id!, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}
