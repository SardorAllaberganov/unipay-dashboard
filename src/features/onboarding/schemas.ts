import { z } from 'zod';

type Translate = (key: string) => string;

export const ORG_TYPES = ['university', 'school', 'kindergarten', 'college', 'other'] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const LEGAL_FORMS = ['llc', 'jsc', 'state', 'private', 'ngo', 'other'] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

export const TEMPLATE_TYPES = ['university', 'school', 'kindergarten'] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const INVITE_ROLES = ['finance_manager', 'operator', 'viewer'] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const TIN_REGEX = /^\d{9}$/;
export const PHONE_REGEX = /^998\d{9}$/;
export const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
export const MFO_REGEX = /^\d{5}$/;
export const IBAN_REGEX = /^\d{20}$/;

export const step1Schema = (t: Translate) =>
  z.object({
    nameRu: z.string().min(1, t('onboarding.errors.required')),
    nameUz: z.string().optional().default(''),
    type: z.enum(ORG_TYPES, { message: t('onboarding.errors.required') }),
    legalForm: z.enum(LEGAL_FORMS, { message: t('onboarding.errors.required') }),
    tin: z
      .string()
      .min(1, t('onboarding.errors.required'))
      .regex(TIN_REGEX, t('onboarding.errors.tinFormat')),
    foundedYear: z
      .number()
      .int()
      .min(1900, t('onboarding.errors.yearRange'))
      .max(new Date().getFullYear(), t('onboarding.errors.yearRange'))
      .optional(),
    region: z.string().min(1, t('onboarding.errors.required')),
    address: z.string().optional().default(''),
    website: z
      .string()
      .url(t('onboarding.errors.urlInvalid'))
      .optional()
      .or(z.literal('')),
  });

export type Step1Values = z.infer<ReturnType<typeof step1Schema>>;

export const step2Schema = (t: Translate) =>
  z.object({
    contactEmail: z
      .string()
      .min(1, t('onboarding.errors.required'))
      .email(t('onboarding.errors.emailInvalid')),
    phone: z
      .string()
      .min(1, t('onboarding.errors.required'))
      .regex(PHONE_REGEX, t('onboarding.errors.phoneFormat')),
    logoDataUrl: z.string().optional().default(''),
    primaryColor: z.string().regex(HEX_REGEX, t('onboarding.errors.hexFormat')),
    receiptFooter: z
      .string()
      .max(200, t('onboarding.errors.max200'))
      .optional()
      .default(''),
  });

export type Step2Values = z.infer<ReturnType<typeof step2Schema>>;

export const bankAccountSchema = (t: Translate) =>
  z.object({
    bankCode: z.string().min(1, t('onboarding.errors.required')),
    bankName: z.string().min(1, t('onboarding.errors.required')),
    mfo: z
      .string()
      .min(1, t('onboarding.errors.required'))
      .regex(MFO_REGEX, t('onboarding.errors.mfoFormat')),
    iban: z
      .string()
      .min(1, t('onboarding.errors.required'))
      .regex(IBAN_REGEX, t('onboarding.errors.ibanFormat')),
    holderName: z.string().min(1, t('onboarding.errors.required')),
    currency: z.enum(['UZS', 'USD']).default('UZS'),
    label: z.string().optional().default(''),
    isDefault: z.boolean(),
  });

export type BankAccountValues = z.infer<ReturnType<typeof bankAccountSchema>>;

export const step3Schema = (t: Translate) =>
  z.object({
    accounts: z
      .array(bankAccountSchema(t))
      .min(1, t('onboarding.errors.atLeastOneAccount'))
      .refine((arr) => arr.filter((a) => a.isDefault).length === 1, {
        message: t('onboarding.errors.exactlyOneDefault'),
        path: ['accounts'],
      }),
  });

export type Step3Values = z.infer<ReturnType<typeof step3Schema>>;

export interface DepartmentNode {
  id: string;
  label: string;
  children?: DepartmentNode[];
}

export const step4Schema = (t: Translate) =>
  z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('skip') }),
    z.object({
      mode: z.literal('template'),
      templateType: z.enum(TEMPLATE_TYPES, { message: t('onboarding.errors.required') }),
      tree: z.array(z.unknown()).min(1, t('onboarding.errors.treeEmpty')),
    }),
  ]);

export type Step4Values = z.infer<ReturnType<typeof step4Schema>>;

export const inviteSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .min(1, t('onboarding.errors.required'))
      .email(t('onboarding.errors.emailInvalid')),
    role: z.enum(INVITE_ROLES, { message: t('onboarding.errors.required') }),
    note: z.string().optional().default(''),
  });

export type InviteValues = z.infer<ReturnType<typeof inviteSchema>>;

export const step5Schema = (t: Translate) =>
  z.object({
    invites: z.array(inviteSchema(t)),
  });

export type Step5Values = z.infer<ReturnType<typeof step5Schema>>;

export interface OnboardingDraft {
  step1?: Partial<Step1Values>;
  step2?: Partial<Step2Values>;
  step3?: Partial<Step3Values>;
  step4?: Step4Values;
  step5?: Step5Values;
  completedSteps: number[];
}
