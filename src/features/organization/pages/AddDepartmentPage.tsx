import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BackLink } from '@/components/shared/BackLink';
import { WriteButton } from '@/components/unipay/WriteButton';
import { departmentSchema, type DepartmentValues } from '../schemas';
import { useDepartments } from '../hooks/useDepartments';
import { useDepartmentMutations } from '../hooks/useDepartmentMutations';

const TYPES = ['faculty', 'department', 'class', 'group', 'other'] as const;

export default function AddDepartmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get('parentId');
  const departmentsQuery = useDepartments();
  const { create } = useDepartmentMutations();

  const parent = parentId
    ? departmentsQuery.data?.items.find((d) => d.id === parentId)
    : null;

  const schema = useMemo(() => departmentSchema(t), [t]);
  const form = useForm<DepartmentValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameRu: '',
      nameUz: '',
      type: parentId === null ? 'faculty' : 'department',
      headStaffId: '',
      paymentTypes: [],
      notes: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        parentId,
        name: { ru: values.nameRu, uz: values.nameUz || undefined },
        type: values.type,
        headStaffId: values.headStaffId || undefined,
        paymentTypes: values.paymentTypes,
        notes: values.notes || undefined,
      });
      toast.success(t('organization.departments.createdToast'));
      navigate('/organization/departments');
    } catch {
      toast.error(t('organization.departments.createErrorToast'));
    }
  });

  return (
    <div className="space-y-6 pb-28">
      <BackLink
        to="/organization/departments"
        pluralName={t('organization.departments.backPlural')}
      />

      <header className="space-y-1">
        <h1 className="text-page-title">
          {t('organization.departments.addPageTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {parent
            ? t('organization.departments.addUnder', { parent: parent.name.ru })
            : t('organization.departments.addRoot')}
        </p>
      </header>

      <Form {...form}>
        <form
          id="add-department-form"
          onSubmit={onSubmit}
          className="max-w-2xl space-y-4"
        >
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
        </form>
      </Form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6">
        <div className="mx-auto flex w-full max-w-2xl gap-2 md:justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1 md:flex-none"
            onClick={() => navigate('/organization/departments')}
          >
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="submit"
            form="add-department-form"
            loading={create.isPending}
            className="flex-1 md:flex-none"
          >
            {t('common.actions.add')}
          </WriteButton>
        </div>
      </div>
    </div>
  );
}
