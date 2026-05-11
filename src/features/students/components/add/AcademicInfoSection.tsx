import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Loader2, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TreePicker, type TreeItem } from '@/components/shared/TreePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import type { Department, EducationType } from '@/types/domain';
import { useCheckStudentId } from '../../hooks/useStudentMutations';
import type { AddStudentValues } from '../../schemas';

const EDU_TYPES: EducationType[] = ['full-time', 'part-time', 'evening', 'remote'];

interface Props {
  form: UseFormReturn<AddStudentValues>;
  departments: Department[];
  isDepartmentsLoading?: boolean;
}

function toTreeItems(items: Department[]): TreeItem[] {
  return items.map((d) => ({
    id: d.id,
    parentId: d.parentId,
    label: d.name.ru,
  }));
}

type IdCheckState = 'idle' | 'checking' | 'available' | 'taken';

export function AcademicInfoSection({ form, departments, isDepartmentsLoading }: Props) {
  const { t } = useTranslation();
  const treeItems = useMemo(() => toTreeItems(departments), [departments]);

  const studentId = form.watch('studentId') ?? '';
  const debouncedId = useDebounce(studentId, 350);
  const checkId = useCheckStudentId();
  const [idCheck, setIdCheck] = useState<IdCheckState>('idle');

  useEffect(() => {
    if (!debouncedId || debouncedId.length < 3) {
      setIdCheck('idle');
      return;
    }
    setIdCheck('checking');
    checkId
      .mutateAsync(debouncedId)
      .then((res) => setIdCheck(res.available ? 'available' : 'taken'))
      .catch(() => setIdCheck('idle'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('students.add.sectionAcademic')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
        control={form.control}
        name="studentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('students.add.studentId')} *</FormLabel>
            <FormControl>
              <div className="relative">
                <Input {...field} className="pr-9 mono" autoComplete="off" />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {idCheck === 'checking' ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                  ) : idCheck === 'available' ? (
                    <Check className="size-4 text-success-700" aria-hidden />
                  ) : idCheck === 'taken' ? (
                    <X className="size-4 text-danger-700" aria-hidden />
                  ) : null}
                </div>
              </div>
            </FormControl>
            <p
              className={cn(
                'text-sm',
                idCheck === 'taken' ? 'text-danger-700' : 'text-muted-foreground',
              )}
              role="status"
              aria-live="polite"
            >
              {idCheck === 'checking'
                ? t('students.add.studentIdChecking')
                : idCheck === 'taken'
                  ? t('students.add.studentIdTaken')
                  : t('students.add.studentIdHint')}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="departmentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('students.add.department')} *</FormLabel>
            <FormControl>
              <TreePicker
                mode="single"
                leafOnly
                items={treeItems}
                value={field.value || null}
                onChange={(next) => field.onChange(next ?? '')}
                isLoading={isDepartmentsLoading}
                searchPlaceholder={t('students.filters.searchDepartment')}
                hint={t('students.add.departmentHint')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="educationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('students.add.educationType')} *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('students.add.educationType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {EDU_TYPES.map((e) => (
                      <SelectItem key={e} value={e}>
                        {t(`common.educationType.${e}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enrollmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('students.add.enrollmentDate')} *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
      </CardContent>
    </Card>
  );
}

// Export the studentId-check state so the page can disable Save when 'taken'.
export type AcademicIdCheckState = IdCheckState;
