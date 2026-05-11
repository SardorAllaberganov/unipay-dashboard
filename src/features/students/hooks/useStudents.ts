import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { studentsApi, type StudentsListParams } from '../api';

export const STUDENTS_QUERY_KEY = ['students'] as const;

export function studentsListKey(params: StudentsListParams) {
  return [...STUDENTS_QUERY_KEY, 'list', params] as const;
}

export function useStudents(params: StudentsListParams) {
  return useQuery({
    queryKey: studentsListKey(params),
    queryFn: () => studentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
