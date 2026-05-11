import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '../api';
import { STUDENTS_QUERY_KEY } from './useStudents';

export function studentTransactionsKey(id: string) {
  return [...STUDENTS_QUERY_KEY, 'transactions', id] as const;
}

export function useStudentTransactions(id: string | undefined) {
  return useQuery({
    queryKey: id ? studentTransactionsKey(id) : ['students', 'transactions', 'none'],
    queryFn: () => studentsApi.transactions(id!),
    enabled: !!id,
  });
}
