import { z } from 'zod';

type Translate = (key: string) => string;

export const signInSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .min(1, t('auth.signIn.errors.emailRequired'))
      .email(t('auth.signIn.errors.emailInvalid')),
    password: z
      .string()
      .min(1, t('auth.signIn.errors.passwordRequired'))
      .min(6, t('auth.signIn.errors.passwordTooShort')),
    rememberMe: z.boolean(),
  });

export type SignInValues = z.infer<ReturnType<typeof signInSchema>>;

export const forgotPasswordSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .min(1, t('auth.forgot.errors.emailRequired'))
      .email(t('auth.forgot.errors.emailInvalid')),
  });

export type ForgotPasswordValues = z.infer<ReturnType<typeof forgotPasswordSchema>>;

const PASSWORD_LETTER_AND_DIGIT = /^(?=.*[A-Za-z])(?=.*\d)/;

export const resetPasswordSchema = (t: Translate) =>
  z
    .object({
      password: z
        .string()
        .min(8, t('auth.reset.errors.passwordTooShort'))
        .regex(PASSWORD_LETTER_AND_DIGIT, t('auth.reset.errors.passwordWeak')),
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, {
      path: ['confirm'],
      message: t('auth.reset.mismatch'),
    });

export type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>;
