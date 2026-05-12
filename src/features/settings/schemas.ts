// Zod factories for every form in the Settings module. `t` is threaded in so
// validation messages localize. RHF + Zod is the project convention.
import { z } from 'zod';
import type { TFunction } from 'i18next';
import {
  API_KEY_PERMISSIONS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENTS,
  WEBHOOK_EVENTS,
  type ApiKeyPermission,
  type NotificationMatrix,
  type WebhookEvent,
} from '@/types/domain';

const HTTPS_URL = /^https:\/\/[^\s]+$/i;
const PHONE_RE = /^\+?[\d\s()-]{7,}$/;

// ─── General tab ───────────────────────────────────────────────────────────

export function generalSchema(t: TFunction) {
  return z.object({
    contactEmail: z
      .string()
      .min(1, t('common.validation.required'))
      .email(t('common.validation.email')),
    contactPhone: z
      .string()
      .min(1, t('common.validation.required'))
      .regex(PHONE_RE, t('common.validation.phone')),
    timezone: z.string().min(1, t('common.validation.required')),
    language: z.enum(['ru', 'uz']),
  });
}
export type GeneralValues = z.infer<ReturnType<typeof generalSchema>>;

// ─── Security tab ──────────────────────────────────────────────────────────

export function changePasswordSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t('common.validation.required')),
      newPassword: z
        .string()
        .min(8, t('settings.security.password.minLength', { count: 8 }))
        .regex(/[a-zA-Z]/, t('settings.security.password.mixed'))
        .regex(/\d/, t('settings.security.password.mixed')),
      confirmPassword: z.string().min(1, t('common.validation.required')),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      path: ['confirmPassword'],
      message: t('settings.security.password.mismatch'),
    });
}
export type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;

export function enable2faVerifySchema(t: TFunction) {
  return z.object({
    code: z
      .string()
      .regex(/^\d{6}$/, t('settings.security.twoFa.codeFormat')),
  });
}
export type Enable2faVerifyValues = z.infer<ReturnType<typeof enable2faVerifySchema>>;

export function passwordConfirmSchema(t: TFunction, requireReason = false) {
  const base = z.object({
    password: z.string().min(1, t('common.validation.required')),
    reason: z.string().optional(),
  });
  if (!requireReason) return base;
  return base.refine((v) => (v.reason ?? '').trim().length >= 20, {
    path: ['reason'],
    message: t('common.validation.reasonMinLength', { count: 20 }),
  });
}
export type PasswordConfirmValues = z.infer<ReturnType<typeof passwordConfirmSchema>>;

// ─── API Keys ──────────────────────────────────────────────────────────────

export function createApiKeySchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .min(3, t('common.validation.minLength', { count: 3 }))
      .max(64, t('common.validation.maxLength', { count: 64 })),
    permissions: z
      .array(
        z.enum(API_KEY_PERMISSIONS as readonly [ApiKeyPermission, ...ApiKeyPermission[]]),
      )
      .min(1, t('settings.api.permissionsRequired')),
  });
}
export type CreateApiKeyValues = z.infer<ReturnType<typeof createApiKeySchema>>;

// ─── Webhook ───────────────────────────────────────────────────────────────

export function webhookConfigSchema(t: TFunction) {
  return z.object({
    url: z
      .string()
      .min(1, t('common.validation.required'))
      .regex(HTTPS_URL, t('settings.webhook.urlHttps')),
    events: z
      .array(
        z.enum(WEBHOOK_EVENTS as readonly [WebhookEvent, ...WebhookEvent[]]),
      )
      .min(1, t('settings.webhook.eventsRequired')),
    enabled: z.boolean(),
  });
}
export type WebhookConfigValues = z.infer<ReturnType<typeof webhookConfigSchema>>;

// ─── Notifications ─────────────────────────────────────────────────────────

export function notificationsSchema() {
  const channelShape = Object.fromEntries(
    NOTIFICATION_CHANNELS.map((c) => [c, z.boolean()]),
  ) as Record<(typeof NOTIFICATION_CHANNELS)[number], z.ZodBoolean>;
  const matrixShape = Object.fromEntries(
    NOTIFICATION_EVENTS.map((evt) => [evt, z.object(channelShape)]),
  );
  return z.object({
    matrix: z.object(matrixShape),
    overdueAlertDays: z.coerce.number().int().min(1).max(90),
  });
}

// The inferred shape from `Object.fromEntries(...)` loses literal-key narrowing
// for the matrix object, so we override the `matrix` field with the canonical
// domain `NotificationMatrix`. RHF + Zod still validate the shape — we just
// give TS the typed surface every event key (`payment.received` etc.) is known
// to exist, which is what the consuming form needs for `matrix[event][channel]`
// lookups + the `setValue` path string.
export type NotificationsValues = Omit<z.infer<ReturnType<typeof notificationsSchema>>, 'matrix'> & {
  matrix: NotificationMatrix;
};
