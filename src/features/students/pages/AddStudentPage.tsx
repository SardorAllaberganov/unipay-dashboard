import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { BackLink } from '@/components/shared/BackLink';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import type { Money, PaymentType } from '@/types/domain';
import { addStudentSchema, type AddStudentValues } from '../schemas';
import { useCreateStudent } from '../hooks/useStudentMutations';
import { useScheduleTemplates } from '../hooks/useScheduleTemplates';
import { PersonalInfoSection } from '../components/add/PersonalInfoSection';
import { AcademicInfoSection } from '../components/add/AcademicInfoSection';
import { PaymentSetupSection } from '../components/add/PaymentSetupSection';
import type { CreateStudentInput, ScheduleRowInput } from '../api';
import { studentsApi } from '../api';

function parseAmountToMoney(raw: string): Money {
  // Accept "5 000 000", "5000000", "5,000,000.00" - normalize to integer UZS, then to tiyins (×100).
  const cleaned = raw.replace(/[\s\u00a0]/g, '').replace(',', '.');
  const num = Number(cleaned);
  const safe = Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
  return { amount: BigInt(safe) * 100n, currency: 'UZS' };
}

const EMPTY_DEFAULTS: AddStudentValues = {
  firstName: '',
  lastName: '',
  middleName: '',
  dob: '',
  gender: undefined,
  phone: '',
  email: '',
  studentId: '',
  departmentId: '',
  educationType: 'full-time',
  enrollmentDate: '',
  useTemplate: false,
  templateId: undefined,
  rows: [],
};

export default function AddStudentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const schema = useMemo(() => addStudentSchema(t), [t]);
  const form = useForm<AddStudentValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const create = useCreateStudent();
  const departmentsQuery = useDepartments();
  const templatesQuery = useScheduleTemplates();

  async function persist(values: AddStudentValues) {
    // Final guard: studentId uniqueness - re-check before submit.
    const idCheck = await studentsApi.checkId(values.studentId);
    if (!idCheck.available) {
      form.setError('studentId', { message: t('students.add.studentIdTaken') });
      throw new Error('duplicate_student_id');
    }
    const input: CreateStudentInput = {
      studentId: values.studentId.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      ...(values.middleName ? { middleName: values.middleName.trim() } : {}),
      ...(values.dob ? { dob: values.dob } : {}),
      ...(values.gender ? { gender: values.gender } : {}),
      ...(values.phone ? { phone: values.phone.trim() } : {}),
      ...(values.email ? { email: values.email.trim() } : {}),
      departmentId: values.departmentId,
      educationType: values.educationType,
      enrollmentDate: values.enrollmentDate,
      ...(values.useTemplate && values.templateId ? { templateId: values.templateId } : {}),
    };
    const created = await create.mutateAsync(input);

    // Inline schedule rows: POST each after the student is created.
    if (!values.useTemplate && values.rows.length > 0) {
      for (const row of values.rows) {
        const amount = parseAmountToMoney(row.amount);
        const scheduleInput: ScheduleRowInput = {
          period: row.period,
          type: row.type as PaymentType,
          amount,
          paid: { amount: 0n, currency: 'UZS' },
          remaining: amount,
          dueDate: row.dueDate,
          status: 'pending',
        };
        await studentsApi.addScheduleRow(created.id, scheduleInput);
      }
    }
    return created;
  }

  const onSaveAndClose = form.handleSubmit(async (values) => {
    try {
      await persist(values);
      toast.success(t('students.add.savedToast'));
      navigate('/students');
    } catch (e) {
      if ((e as Error).message !== 'duplicate_student_id') {
        toast.error(t('students.schedule.errorToast'));
      }
    }
  });

  const onSaveAndAddAnother = form.handleSubmit(async (values) => {
    try {
      await persist(values);
      toast.success(t('students.add.savedAnotherToast'));
      // Reset all PERSONAL fields, keep academic dropdowns (per spec).
      form.reset({
        ...EMPTY_DEFAULTS,
        departmentId: values.departmentId,
        educationType: values.educationType,
        enrollmentDate: values.enrollmentDate,
      });
    } catch (e) {
      if ((e as Error).message !== 'duplicate_student_id') {
        toast.error(t('students.schedule.errorToast'));
      }
    }
  });

  const submitting = create.isPending;

  return (
    <div className="space-y-6 pb-28">
      <BackLink to="/students" pluralName={t('students.backPlural')} />

      <header>
        <h1 className="text-page-title">{t('students.add.title')}</h1>
      </header>

      <Form {...form}>
        <form
          id="add-student-form"
          className="max-w-2xl space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            void onSaveAndClose();
          }}
        >
          <PersonalInfoSection form={form} />
          <AcademicInfoSection
            form={form}
            departments={departmentsQuery.data?.items ?? []}
            isDepartmentsLoading={departmentsQuery.isLoading}
          />
          <PaymentSetupSection
            form={form}
            templates={templatesQuery.data?.items ?? []}
          />
        </form>
      </Form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6">
        {/* Action bar grouped by intent: Cancel (abandon) sits on the LEFT, the two save
           variants cluster on the RIGHT as a primary-action group. md:justify-between
           puts a visible gap between them on desktop; mobile stacks abandon-row above
           the equal-share save row. */}
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="md:flex-none"
            onClick={() => navigate('/students')}
          >
            {t('students.add.cancel')}
          </Button>
          <div className="flex w-full gap-2 md:w-auto md:flex-none">
            <WriteButton
              type="button"
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={() => void onSaveAndAddAnother()}
              loading={submitting}
            >
              {t('students.add.saveAndAddAnother')}
            </WriteButton>
            <WriteButton
              type="button"
              className="flex-1 md:flex-none"
              onClick={() => void onSaveAndClose()}
              loading={submitting}
            >
              {t('students.add.saveAndClose')}
            </WriteButton>
          </div>
        </div>
      </div>
    </div>
  );
}
