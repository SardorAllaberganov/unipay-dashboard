import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { studentsApi, type ApplyTemplateInput, type ScheduleTemplateInput } from '../api';
import { STUDENTS_QUERY_KEY } from './useStudents';

export const TEMPLATES_QUERY_KEY = [...STUDENTS_QUERY_KEY, 'templates'] as const;

export function useScheduleTemplates() {
  return useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: () => studentsApi.listTemplates(),
  });
}

function invalidateTemplates(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ScheduleTemplateInput) => studentsApi.createTemplate(input),
    onSuccess: () => {
      invalidateTemplates(qc);
      toast.success(t('students.schedules.form.savedToast'));
    },
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: Partial<ScheduleTemplateInput>) => studentsApi.updateTemplate(id, input),
    onSuccess: () => {
      invalidateTemplates(qc);
      toast.success(t('students.schedules.form.savedToast'));
    },
  });
}

export function useDeleteTemplate(id: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (reason: string) => studentsApi.deleteTemplate(id, reason),
    onSuccess: () => {
      invalidateTemplates(qc);
      toast.success(t('students.schedules.delete.success'));
    },
  });
}

export function useApplyTemplate(id: string) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ApplyTemplateInput) => studentsApi.applyTemplate(id, input),
    onSuccess: (data) => {
      invalidateTemplates(qc);
      void qc.invalidateQueries({ queryKey: [...STUDENTS_QUERY_KEY, 'list'] });
      toast.success(t('students.schedules.apply.success', { count: data.appliedCount }));
    },
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (template: { name: string } & ScheduleTemplateInput) => {
      const { name, ...rest } = template;
      return studentsApi.createTemplate({ ...rest, name: `${name} (копия)` });
    },
    onSuccess: () => {
      invalidateTemplates(qc);
      toast.success(t('students.schedules.duplicateSuccess'));
    },
  });
}
