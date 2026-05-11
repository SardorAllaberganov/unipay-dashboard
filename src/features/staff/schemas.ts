import { z } from 'zod';
import type { Role } from '@/types/domain';
import { STAFF_INVITABLE_ROLES } from '@/types/domain';

type Translate = (key: string, opts?: Record<string, unknown>) => string;

const ROLE_VALUES: readonly Role[] = ['owner', 'finance_manager', 'operator', 'viewer'];
const LOCALE_VALUES = ['ru', 'uz'] as const;

export const inviteStaffSchema = (t: Translate) =>
  z.object({
    email: z.string().email(t('staff.invite.emailInvalid')),
    fullName: z.string().optional().default(''),
    role: z.enum(STAFF_INVITABLE_ROLES),
    departmentIds: z.array(z.string()).default([]),
    note: z
      .string()
      .max(300, t('staff.invite.noteTooLong'))
      .optional()
      .default(''),
  });

export type InviteStaffValues = z.infer<ReturnType<typeof inviteStaffSchema>>;

export const editRoleSchema = (t: Translate) =>
  z.object({
    role: z.enum(ROLE_VALUES as [Role, ...Role[]]),
    reason: z.string().min(20, t('common.reasonLabel', { count: 20 })),
  });

export type EditRoleValues = z.infer<ReturnType<typeof editRoleSchema>>;

export const editAccessSchema = z.object({
  departmentIds: z.array(z.string()).default([]),
});

export type EditAccessValues = z.infer<typeof editAccessSchema>;

export const deactivateSchema = (t: Translate) =>
  z.object({
    reason: z.string().min(20, t('common.reasonLabel', { count: 20 })),
  });

export type DeactivateValues = z.infer<ReturnType<typeof deactivateSchema>>;

export const editContactSchema = (t: Translate) =>
  z.object({
    email: z.string().email(t('staff.invite.emailInvalid')),
    phone: z
      .string()
      .max(32, t('staff.invite.required'))
      .optional()
      .default(''),
  });

export type EditContactValues = z.infer<ReturnType<typeof editContactSchema>>;

export const editProfileSchema = (t: Translate) =>
  z.object({
    fullName: z.string().min(1, t('staff.invite.required')),
    email: z.string().email(t('staff.invite.emailInvalid')),
    phone: z.string().max(32).optional().default(''),
    locale: z.enum(LOCALE_VALUES).optional(),
    timezone: z.string().optional().default(''),
  });

export type EditProfileValues = z.infer<ReturnType<typeof editProfileSchema>>;

/**
 * Step-2 schema for the delete-account flow.
 * `expectedEmail` is captured at form-init from the staff member's email; the schema is
 * a factory because the validator needs that value to compare against.
 */
export const deleteAccountSchema = (t: Translate, expectedEmail: string) =>
  z.object({
    reason: z.string().min(20, t('common.reasonLabel', { count: 20 })),
    confirmEmail: z
      .string()
      .refine((v) => v.trim().toLowerCase() === expectedEmail.trim().toLowerCase(), {
        message: t('staff.delete.confirmEmailMismatch'),
      }),
  });

export type DeleteAccountValues = z.infer<ReturnType<typeof deleteAccountSchema>>;

/**
 * Transfer-ownership requires the operator to type the literal phrase "TRANSFER"
 * (locale-independent — protects against muscle-memory mistakes).
 */
export const transferOwnershipSchema = (t: Translate) =>
  z.object({
    reason: z.string().min(20, t('common.reasonLabel', { count: 20 })),
    confirmPhrase: z.literal('TRANSFER', {
      message: t('staff.transfer.confirmPhraseMismatch'),
    }),
  });

export type TransferOwnershipValues = z.infer<ReturnType<typeof transferOwnershipSchema>>;

export const revokeSessionSchema = (t: Translate) =>
  z.object({
    reason: z.string().min(20, t('common.reasonLabel', { count: 20 })),
  });

export type RevokeSessionValues = z.infer<ReturnType<typeof revokeSessionSchema>>;

export const activityFiltersSchema = z.object({
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ActivityFiltersValues = z.infer<typeof activityFiltersSchema>;
