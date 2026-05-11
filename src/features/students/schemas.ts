import { z } from 'zod';
import type { EducationType, PaymentType } from '@/types/domain';

type Translate = (key: string, opts?: Record<string, unknown>) => string;

const EDUCATION_TYPES: readonly EducationType[] = ['full-time', 'part-time', 'evening', 'remote'];
const PAYMENT_TYPES: readonly PaymentType[] = ['tuition', 'dormitory', 'other'];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_RE = /^\+998\s?\(?\d{2}\)?\s?\d{3}-?\d{2}-?\d{2}$/;
const AMOUNT_RE = /^\d+(?:[.,]\d{1,2})?$/;

// Sentinel object so single-amount mode can still validate.
function amountString(t: Translate) {
  return z
    .string()
    .trim()
    .min(1, t('students.add.fieldRequired'))
    .regex(AMOUNT_RE, t('students.add.fieldRequired'));
}

// -------- Add Student --------

export const personalInfoSchema = (t: Translate) =>
  z.object({
    firstName: z.string().trim().min(1, t('students.add.fieldRequired')),
    lastName: z.string().trim().min(1, t('students.add.fieldRequired')),
    middleName: z.string().trim().optional(),
    dob: z
      .string()
      .optional()
      .refine((v) => !v || ISO_DATE_RE.test(v), { message: t('students.add.fieldRequired') }),
    gender: z.enum(['male', 'female']).optional(),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || PHONE_RE.test(v), { message: t('students.add.phoneInvalid') }),
    email: z
      .string()
      .optional()
      .refine((v) => !v || z.string().email().safeParse(v).success, {
        message: t('students.add.emailInvalid'),
      }),
  });

export const academicInfoSchema = (t: Translate) =>
  z.object({
    studentId: z.string().trim().min(1, t('students.add.fieldRequired')),
    departmentId: z.string().trim().min(1, t('students.add.departmentRequired')),
    educationType: z.enum(EDUCATION_TYPES as [EducationType, ...EducationType[]]),
    enrollmentDate: z
      .string()
      .min(1, t('students.add.fieldRequired'))
      .regex(ISO_DATE_RE, t('students.add.fieldRequired')),
  });

export const paymentRowSchema = (t: Translate) =>
  z.object({
    period: z.string().trim().min(1, t('students.add.fieldRequired')),
    type: z.enum(PAYMENT_TYPES as [PaymentType, ...PaymentType[]]),
    amount: amountString(t),
    dueDate: z
      .string()
      .min(1, t('students.add.fieldRequired'))
      .regex(ISO_DATE_RE, t('students.add.fieldRequired')),
  });

export const paymentSetupSchema = (t: Translate) =>
  z.object({
    useTemplate: z.boolean().default(false),
    templateId: z.string().optional(),
    rows: z.array(paymentRowSchema(t)).default([]),
  });

export const addStudentSchema = (t: Translate) =>
  personalInfoSchema(t).merge(academicInfoSchema(t)).merge(paymentSetupSchema(t));

export type AddStudentValues = z.infer<ReturnType<typeof addStudentSchema>>;
export type PaymentRowValues = z.infer<ReturnType<typeof paymentRowSchema>>;

// -------- Edit Student (Profile tab inline edit) --------

export const editProfileSchema = (t: Translate) =>
  z.object({
    firstName: z.string().trim().min(1, t('students.add.fieldRequired')),
    lastName: z.string().trim().min(1, t('students.add.fieldRequired')),
    middleName: z.string().trim().optional(),
    dob: z
      .string()
      .optional()
      .refine((v) => !v || ISO_DATE_RE.test(v), { message: t('students.add.fieldRequired') }),
    gender: z.enum(['male', 'female']).optional(),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || PHONE_RE.test(v), { message: t('students.add.phoneInvalid') }),
    email: z
      .string()
      .optional()
      .refine((v) => !v || z.string().email().safeParse(v).success, {
        message: t('students.add.emailInvalid'),
      }),
    departmentId: z.string().trim().min(1, t('students.add.departmentRequired')),
    educationType: z.enum(EDUCATION_TYPES as [EducationType, ...EducationType[]]),
    enrollmentDate: z
      .string()
      .min(1, t('students.add.fieldRequired'))
      .regex(ISO_DATE_RE, t('students.add.fieldRequired')),
    endDate: z
      .string()
      .optional()
      .refine((v) => !v || ISO_DATE_RE.test(v), { message: t('students.add.fieldRequired') }),
  });

export type EditProfileValues = z.infer<ReturnType<typeof editProfileSchema>>;

// -------- Schedule row inline-edit --------

export const inlineScheduleRowSchema = (t: Translate) =>
  z.object({
    period: z.string().trim().min(1, t('students.add.fieldRequired')),
    type: z.enum(PAYMENT_TYPES as [PaymentType, ...PaymentType[]]),
    amount: amountString(t),
    paid: amountString(t),
    dueDate: z
      .string()
      .min(1, t('students.add.fieldRequired'))
      .regex(ISO_DATE_RE, t('students.add.fieldRequired')),
  });

export type InlineScheduleRowValues = z.infer<ReturnType<typeof inlineScheduleRowSchema>>;

// -------- Notes --------

export const addNoteSchema = (t: Translate) =>
  z.object({
    body: z.string().trim().min(3, t('students.add.fieldRequired')),
  });

export type AddNoteValues = z.infer<ReturnType<typeof addNoteSchema>>;

// -------- Destructive actions (reason ≥20) --------

export const reasonSchema = (t: Translate) =>
  z.object({
    reason: z.string().trim().min(20, t('common.reasonLabel', { count: 20 })),
  });

// -------- Bulk change department --------

export const bulkChangeDeptSchema = (t: Translate) =>
  z.object({
    departmentId: z.string().min(1, t('students.add.departmentRequired')),
  });

export type BulkChangeDeptValues = z.infer<ReturnType<typeof bulkChangeDeptSchema>>;

// -------- Schedule template form --------

export const scheduleTemplateSchema = (t: Translate) =>
  z
    .object({
      name: z.string().trim().min(1, t('students.add.fieldRequired')),
      type: z.enum(PAYMENT_TYPES as [PaymentType, ...PaymentType[]]),
      amountMode: z.enum(['single', 'per-department']),
      amount: z.string().optional(),
      perDepartmentAmounts: z
        .array(z.object({ departmentId: z.string(), amount: z.string() }))
        .optional()
        .default([]),
      dueDate: z
        .string()
        .min(1, t('students.add.fieldRequired'))
        .regex(ISO_DATE_RE, t('students.add.fieldRequired')),
      periodLabel: z.string().trim().min(1, t('students.add.fieldRequired')),
      appliesTo: z.object({
        departmentIds: z.array(z.string()).default([]),
        years: z.array(z.number()).default([]),
        studentIds: z.array(z.string()).default([]),
      }),
    })
    .refine(
      (v) => v.amountMode !== 'single' || (!!v.amount && AMOUNT_RE.test(v.amount)),
      { path: ['amount'], message: t('students.add.fieldRequired') },
    );

export type ScheduleTemplateValues = z.infer<ReturnType<typeof scheduleTemplateSchema>>;

// -------- Apply template --------

export const applyTemplateSchema = (t: Translate) =>
  z.object({
    reason: z.string().trim().min(20, t('common.reasonLabel', { count: 20 })),
  });

export type ApplyTemplateValues = z.infer<ReturnType<typeof applyTemplateSchema>>;

// -------- Import: per-row patch (used by inline-edit on Review step) --------

export const importRowPatchSchema = z
  .object({
    studentId: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    middleName: z.string().optional(),
    dob: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    departmentId: z.string().optional(),
    year: z.string().optional(),
    educationType: z.string().optional(),
    enrollmentDate: z.string().optional(),
    amount: z.string().optional(),
    dueDate: z.string().optional(),
  })
  .partial();

export type ImportRowPatchValues = z.infer<typeof importRowPatchSchema>;
