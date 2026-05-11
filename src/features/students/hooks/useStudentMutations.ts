import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Student } from '@/types/domain';
import {
  studentsApi,
  type BulkChangeDeptInput,
  type BulkDeactivateInput,
  type BulkRemindInput,
  type CreateStudentInput,
  type ListResponse,
  type UpdateStudentInput,
} from '../api';
import { STUDENTS_QUERY_KEY } from './useStudents';
import { studentByIdKey } from './useStudent';

function patchListCaches(
  qc: ReturnType<typeof useQueryClient>,
  patcher: (items: Student[]) => Student[],
) {
  const matches = qc.getQueriesData<ListResponse<Student>>({
    queryKey: [...STUDENTS_QUERY_KEY, 'list'],
  });
  for (const [key, prev] of matches) {
    if (!prev) continue;
    qc.setQueryData<ListResponse<Student>>(key, { ...prev, items: patcher(prev.items) });
  }
}

function invalidateAllLists(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: [...STUDENTS_QUERY_KEY, 'list'] });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => studentsApi.create(input),
    onSuccess: (created) => {
      patchListCaches(qc, (items) => [created, ...items]);
      invalidateAllLists(qc);
    },
  });
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateStudentInput) => studentsApi.update(id, patch),
    onSuccess: (updated) => {
      patchListCaches(qc, (items) => items.map((s) => (s.id === updated.id ? updated : s)));
      qc.setQueryData(studentByIdKey(id), updated);
    },
  });
}

export function useDeleteStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => studentsApi.delete(id, reason),
    onSuccess: () => {
      patchListCaches(qc, (items) => items.filter((s) => s.id !== id));
      invalidateAllLists(qc);
      qc.removeQueries({ queryKey: studentByIdKey(id) });
    },
  });
}

export function useCheckStudentId() {
  // Mutation-as-query (we never want this to cache results past a typed value).
  return useMutation({
    mutationFn: (studentId: string) => studentsApi.checkId(studentId),
  });
}

export function useSendStudentSms(id: string) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (message: string) => studentsApi.sendSms(id, message),
    onSuccess: () => {
      toast.success(t('students.detail.smsSuccess'));
    },
  });
}

// ---- bulk ----

export function useBulkRemind() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: BulkRemindInput) => studentsApi.bulkRemind(input),
    onSuccess: (data) => {
      toast.success(t('students.bulk.remindSuccess', { count: data.sent }));
    },
  });
}

export function useBulkExport() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: BulkRemindInput) => studentsApi.bulkExport(input),
    onSuccess: () => {
      toast.success(t('students.bulk.exportSuccess'));
    },
  });
}

export function useBulkChangeDept() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: BulkChangeDeptInput) => studentsApi.bulkChangeDept(input),
    onSuccess: () => {
      invalidateAllLists(qc);
      toast.success(t('students.bulk.changeDeptSuccess'));
    },
  });
}

export function useBulkDeactivate() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: BulkDeactivateInput) => studentsApi.bulkDeactivate(input),
    onSuccess: (data) => {
      invalidateAllLists(qc);
      toast.success(t('students.bulk.deactivateSuccess', { count: data.updated }));
    },
  });
}
