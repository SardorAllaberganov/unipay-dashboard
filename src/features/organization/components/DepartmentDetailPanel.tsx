import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import type { Department } from '@/types/domain';
import { departmentSchema, type DepartmentValues } from '../schemas';
import { useDepartmentMutations } from '../hooks/useDepartmentMutations';

interface Props {
  department: Department;
  onDelete: () => void;
  onClose: () => void;
}

const TYPES = ['faculty', 'department', 'class', 'group', 'other'] as const;
const PAYMENT_TYPES = ['tuition', 'dormitory', 'other'] as const;

export function DepartmentDetailPanel({ department, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const { update } = useDepartmentMutations();

  const schema = useMemo(() => departmentSchema(t), [t]);
  const form = useForm<DepartmentValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameRu: department.name.ru,
      nameUz: department.name.uz ?? '',
      type: department.type,
      headStaffId: department.headStaffId ?? '',
      paymentTypes: department.paymentTypes ?? [],
      notes: department.notes ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      nameRu: department.name.ru,
      nameUz: department.name.uz ?? '',
      type: department.type,
      headStaffId: department.headStaffId ?? '',
      paymentTypes: department.paymentTypes ?? [],
      notes: department.notes ?? '',
    });
  }, [department, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        id: department.id,
        patch: {
          name: { ru: values.nameRu, uz: values.nameUz || undefined },
          type: values.type,
          headStaffId: values.headStaffId || undefined,
          paymentTypes: values.paymentTypes,
          notes: values.notes || undefined,
        },
      });
      toast.success(t('organization.departments.savedToast'));
    } catch {
      toast.error(t('organization.departments.saveErrorToast'));
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
        <div className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          <FormField
            control={form.control}
            name="nameRu"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('organization.departments.nameRuLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameUz"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('organization.departments.nameUzLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.departments.typeLabel')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`organization.departments.types.${v}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>{t('organization.departments.studentCountLabel')}</FormLabel>
              <FormControl>
                <Input
                  value={department.studentCount}
                  readOnly
                  disabled
                  className="tabular"
                />
              </FormControl>
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="headStaffId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('organization.departments.headLabel')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('organization.departments.headPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentTypes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('organization.departments.paymentTypesLabel')}</FormLabel>
                <div className="space-y-2">
                  {PAYMENT_TYPES.map((pt) => {
                    const checked = field.value?.includes(pt) ?? false;
                    return (
                      <label
                        key={pt}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            const next = new Set(field.value ?? []);
                            if (c) next.add(pt);
                            else next.delete(pt);
                            field.onChange(Array.from(next));
                          }}
                        />
                        {t(`organization.departments.paymentTypes.${pt}`)}
                      </label>
                    );
                  })}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('organization.departments.notesLabel')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <WriteButton
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            {t('common.actions.delete')}
          </WriteButton>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.actions.cancel')}
            </Button>
            <WriteButton type="submit" loading={update.isPending}>
              {t('common.actions.save')}
            </WriteButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
