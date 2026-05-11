import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi, type NoteInput } from '../api';
import { STUDENTS_QUERY_KEY } from './useStudents';

export function studentNotesKey(id: string) {
  return [...STUDENTS_QUERY_KEY, 'notes', id] as const;
}

export function useStudentNotes(id: string | undefined) {
  return useQuery({
    queryKey: id ? studentNotesKey(id) : ['students', 'notes', 'none'],
    queryFn: () => studentsApi.notes(id!),
    enabled: !!id,
  });
}

export function useAddStudentNote(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteInput) => studentsApi.addNote(studentId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentNotesKey(studentId) });
    },
  });
}
