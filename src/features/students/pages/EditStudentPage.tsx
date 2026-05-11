import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UserX } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackLink } from '@/components/shared/BackLink';
import { DetailPageSkeleton } from '@/components/shared/DetailPageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineState } from '@/components/system/OfflineState';
import { TreePicker, type TreeItem } from '@/components/shared/TreePicker';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import type { Department, EducationType } from '@/types/domain';
import { useStudent } from '../hooks/useStudent';
import { useUpdateStudent } from '../hooks/useStudentMutations';
import { editProfileSchema, type EditProfileValues } from '../schemas';

const EDU_TYPES: EducationType[] = ['full-time', 'part-time', 'evening', 'remote'];

function toTreeItems(items: Department[]): TreeItem[] {
  return items.map((d) => ({
    id: d.id,
    parentId: d.parentId,
    label: d.name.ru,
  }));
}

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const online = useNetworkState();
  const studentQuery = useStudent(id);
  const departmentsQuery = useDepartments();
  const update = useUpdateStudent(id ?? '');

  const schema = useMemo(() => editProfileSchema(t), [t]);
  const form = useForm<EditProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      dob: '',
      gender: undefined,
      phone: '',
      email: '',
      departmentId: '',
      educationType: 'full-time',
      enrollmentDate: '',
      endDate: '',
    },
  });

  // Hydrate form once the student loads.
  useEffect(() => {
    const student = studentQuery.data;
    if (!student) return;
    form.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName ?? '',
      dob: student.dob ?? '',
      gender: student.gender,
      phone: student.phone ?? '',
      email: student.email ?? '',
      departmentId: student.departmentId,
      educationType: student.educationType,
      enrollmentDate: student.enrollmentDate,
      endDate: student.endDate ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentQuery.data?.id]);

  const treeItems = useMemo(
    () => toTreeItems(departmentsQuery.data?.items ?? []),
    [departmentsQuery.data],
  );

  if (!id) return <Navigate to="/students" replace />;

  if (studentQuery.isPending) {
    return (
      <div className="pb-28">
        <DetailPageSkeleton tabs={0} />
      </div>
    );
  }

  const isNotFound =
    studentQuery.isError &&
    (studentQuery.error as Error | undefined)?.message?.includes(':404');

  if (isNotFound) {
    return (
      <div className="space-y-6 pb-28">
        <BackLink to="/students" pluralName={t('students.detail.backPlural')} />
        <div className="flex flex-col items-center gap-3">
          <EmptyState
            icon={UserX}
            title={t('students.detail.notFoundTitle')}
            description={t('students.detail.notFoundBody')}
            className="max-w-2xl"
          />
          <Button asChild>
            <Link to="/students">{t('common.actions.back')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <div className="space-y-6 pb-28">
        <BackLink to="/students" pluralName={t('students.detail.backPlural')} />
        {online ? <ErrorState onRetry={() => void studentQuery.refetch()} /> : <OfflineState />}
      </div>
    );
  }

  const student = studentQuery.data;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        middleName: values.middleName?.trim() || undefined,
        dob: values.dob || undefined,
        gender: values.gender,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        departmentId: values.departmentId,
        educationType: values.educationType,
        enrollmentDate: values.enrollmentDate,
        endDate: values.endDate || undefined,
      });
      toast.success(t('students.add.savedToast'));
      navigate(`/students/${id}`);
    } catch {
      toast.error(t('students.schedule.errorToast'));
    }
  });

  return (
    <div className="space-y-6 pb-28">
      <BackLink
        to={`/students/${id}`}
        pluralName={`${student.lastName} ${student.firstName}`}
      />

      <header>
        <h1 className="text-page-title">{t('students.edit.title')}</h1>
      </header>

      <Form {...form}>
        <form
          id="edit-student-form"
          className="max-w-2xl space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('students.add.sectionPersonal')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('students.add.lastName')} *</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="family-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('students.add.firstName')} *</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="given-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('students.add.middleName')}</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="additional-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('students.add.dob')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('students.add.gender')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="male" id="edit-gender-male" />
                          <Label htmlFor="edit-gender-male" className="text-sm font-normal">
                            {t('students.add.genderMale')}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="female" id="edit-gender-female" />
                          <Label htmlFor="edit-gender-female" className="text-sm font-normal">
                            {t('students.add.genderFemale')}
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('students.add.phone')}</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} autoComplete="tel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('students.add.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} autoComplete="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('students.add.sectionAcademic')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        isLoading={departmentsQuery.isLoading}
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
                            <SelectValue />
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
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('students.detail.endDate')}</FormLabel>
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
        </form>
      </Form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="md:flex-none"
            onClick={() => navigate(`/students/${id}`)}
          >
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="submit"
            form="edit-student-form"
            className="md:flex-none"
            loading={update.isPending}
          >
            {t('common.actions.save')}
          </WriteButton>
        </div>
      </div>
    </div>
  );
}
