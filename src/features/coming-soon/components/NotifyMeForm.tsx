// Notify-Me email capture. RHF + Zod; 6 states inside the form:
//   - idle      → email Input + submit WriteButton
//   - loading   → WriteButton disables + Loader2 spinner (Button primitive handles)
//   - success   → form swaps to a success view with the email echoed back
//   - error     → inline destructive banner above the form (recoverable; user can retry)
//   - offline   → WriteButton tooltip + disabled state (auto-handled)
//   - partial   → N/A (single-field form)
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNotifyMe } from '../hooks/useNotifyMe';
import { notifyMeSchema, type NotifyMeValues } from '../schemas';

interface Props {
  feature: string;
}

export function NotifyMeForm({ feature }: Props) {
  const { t } = useTranslation();
  const notify = useNotifyMe();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<NotifyMeValues>({
    resolver: zodResolver(notifyMeSchema(t)),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    notify.mutate(
      { feature, email: values.email },
      {
        onSuccess: (res) => {
          setSubmittedEmail(res.email);
        },
        onError: () => {
          setServerError(t('common.errors.saveFailed'));
        },
      },
    );
  });

  if (submittedEmail) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 rounded-lg border border-success-700/30 bg-success-light px-4 py-5 text-center"
      >
        <CheckCircle2 className="size-7 text-success-700" aria-hidden />
        <div className="space-y-1">
          <p className="text-base font-medium text-success-foreground">
            {t('comingSoon.notifyMe.successTitle')}
          </p>
          <p className="text-sm text-success-foreground/80">
            {t('comingSoon.notifyMe.successBody', { email: submittedEmail })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubmittedEmail(null);
            form.reset({ email: '' });
          }}
        >
          {t('comingSoon.notifyMe.anotherEmail')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {serverError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <XCircle className="size-4 shrink-0" aria-hidden />
          <p>{serverError}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="notify-email">{t('comingSoon.notifyMe.label')}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="notify-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('comingSoon.notifyMe.placeholder')}
            {...form.register('email')}
            aria-invalid={!!form.formState.errors.email}
            className="sm:flex-1"
          />
          <WriteButton type="submit" loading={notify.isPending}>
            <Mail className="size-4" aria-hidden />
            {t('comingSoon.notifyMe.submit')}
          </WriteButton>
        </div>
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
