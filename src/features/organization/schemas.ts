import { z } from 'zod';
import { LEGAL_FORMS } from '@/types/domain';

type Translate = (key: string) => string;

const TIN_REGEX = /^\d{9}$/;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
const MFO_REGEX = /^\d{5}$/;
const IBAN_REGEX = /^\d{20}$/;

export const profileSchema = (t: Translate) =>
  z.object({
    nameRu: z.string().min(1, t('organization.errors.required')),
    nameUz: z.string().optional().default(''),
    nameEn: z.string().optional().default(''),
    legalForm: z.enum(LEGAL_FORMS, { message: t('organization.errors.required') }),
    region: z.string().min(1, t('organization.errors.required')),
    address: z.string().optional().default(''),
    website: z
      .string()
      .url(t('organization.errors.urlInvalid'))
      .optional()
      .or(z.literal('')),
    foundedYear: z
      .number()
      .int()
      .min(1900, t('organization.errors.yearRange'))
      .max(new Date().getFullYear(), t('organization.errors.yearRange'))
      .optional(),
  });

export type ProfileValues = z.infer<ReturnType<typeof profileSchema>>;

export const brandingSchema = (t: Translate) =>
  z.object({
    logoDataUrl: z.string().optional().default(''),
    primaryColor: z
      .string()
      .regex(HEX_REGEX, t('organization.errors.hexFormat')),
    receiptFooter: z
      .string()
      .max(200, t('organization.errors.max200'))
      .optional()
      .default(''),
  });

export type BrandingValues = z.infer<ReturnType<typeof brandingSchema>>;

export const bankAccountSchema = (t: Translate) =>
  z.object({
    bankCode: z.string().min(1, t('organization.errors.required')),
    bankName: z.string().min(1, t('organization.errors.required')),
    mfo: z
      .string()
      .min(1, t('organization.errors.required'))
      .regex(MFO_REGEX, t('organization.errors.mfoFormat')),
    accountNumber: z
      .string()
      .min(1, t('organization.errors.required'))
      .regex(IBAN_REGEX, t('organization.errors.ibanFormat')),
    holderName: z.string().min(1, t('organization.errors.required')),
    currency: z.enum(['UZS', 'USD']).default('UZS'),
    label: z.string().optional().default(''),
    isDefault: z.boolean().default(false),
  });

export type BankAccountValues = z.infer<ReturnType<typeof bankAccountSchema>>;

const DEPARTMENT_TYPES = ['faculty', 'department', 'class', 'group', 'other'] as const;
const PAYMENT_TYPES = ['tuition', 'dormitory', 'other'] as const;

export const departmentSchema = (t: Translate) =>
  z.object({
    nameRu: z.string().min(1, t('organization.errors.required')),
    nameUz: z.string().optional().default(''),
    type: z.enum(DEPARTMENT_TYPES, { message: t('organization.errors.required') }),
    headStaffId: z.string().optional().default(''),
    paymentTypes: z.array(z.enum(PAYMENT_TYPES)).default([]),
    notes: z.string().optional().default(''),
  });

export type DepartmentValues = z.infer<ReturnType<typeof departmentSchema>>;

// TIN regex export for read-only validation context if needed elsewhere.
export { TIN_REGEX, HEX_REGEX, MFO_REGEX, IBAN_REGEX };
