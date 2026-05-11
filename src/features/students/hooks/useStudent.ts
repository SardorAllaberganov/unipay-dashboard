import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '../api';
import { STUDENTS_QUERY_KEY } from './useStudents';

export function studentByIdKey(id: string) {
  return [...STUDENTS_QUERY_KEY, 'byId', id] as const;
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: id ? studentByIdKey(id) : ['students', 'byId', 'none'],
    queryFn: () => studentsApi.getById(id!),
    enabled: !!id,
  });
}
