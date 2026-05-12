import { z } from 'zod';
import type { TFunction } from 'i18next';

export function notifyMeSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t('common.validation.required'))
      .email(t('common.validation.email')),
  });
}
export type NotifyMeValues = z.infer<ReturnType<typeof notifyMeSchema>>;
