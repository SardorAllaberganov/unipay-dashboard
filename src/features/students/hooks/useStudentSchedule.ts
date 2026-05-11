import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi, type ScheduleRowInput, type ScheduleRowPatch } from '../api';
import { STUDENTS_QUERY_KEY } from './useStudents';
import { studentByIdKey } from './useStudent';

export function studentScheduleKey(id: string) {
  return [...STUDENTS_QUERY_KEY, 'schedule', id] as const;
}

export function useStudentSchedule(id: string | undefined) {
  return useQuery({
    queryKey: id ? studentScheduleKey(id) : ['students', 'schedule', 'none'],
    queryFn: () => studentsApi.schedule(id!),
    enabled: !!id,
  });
}

function refreshStudent(qc: ReturnType<typeof useQueryClient>, id: string) {
  void qc.invalidateQueries({ queryKey: studentScheduleKey(id) });
  void qc.invalidateQueries({ queryKey: studentByIdKey(id) });
  void qc.invalidateQueries({ queryKey: [...STUDENTS_QUERY_KEY, 'list'] });
}

export function useAddScheduleRow(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleRowInput) => studentsApi.addScheduleRow(studentId, input),
    onSuccess: () => refreshStudent(qc, studentId),
  });
}

export function usePatchScheduleRow(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, patch }: { rowId: string; patch: ScheduleRowPatch }) =>
      studentsApi.patchScheduleRow(studentId, rowId, patch),
    onSuccess: () => refreshStudent(qc, studentId),
  });
}

export function useDeleteScheduleRow(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rowId: string) => studentsApi.deleteScheduleRow(studentId, rowId),
    onSuccess: () => refreshStudent(qc, studentId),
  });
}
