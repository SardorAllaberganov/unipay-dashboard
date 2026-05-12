import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useChangePassword } from '../hooks/useChangePassword';
import { changePasswordSchema, type ChangePasswordValues } from '../schemas';

export function ChangePasswordCard() {
  const { t } = useTranslation();
  const change = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema(t)),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => form.reset(),
        onError: (err) => {
          const body = (err as { body?: { error?: { code?: string; field?: string } } })
            .body;
          if (body?.error?.code === 'invalid_password') {
            setServerError(t('settings.security.password.invalidCurrent'));
          } else {
            setServerError(t('common.errors.saveFailed'));
          }
        },
      },
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.security.password.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('settings.security.password.subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">
              {t('settings.security.password.current')}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...form.register('currentPassword')}
              aria-invalid={!!form.formState.errors.currentPassword || !!serverError}
            />
            {form.formState.errors.currentPassword ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            ) : null}
            {serverError ? (
              <p className="text-sm text-destructive" role="alert">
                {serverError}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">{t('settings.security.password.new')}</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...form.register('newPassword')}
                aria-invalid={!!form.formState.errors.newPassword}
              />
              {form.formState.errors.newPassword ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('settings.security.password.hint')}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">
                {t('settings.security.password.confirm')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
                aria-invalid={!!form.formState.errors.confirmPassword}
              />
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end">
            <WriteButton type="submit" loading={change.isPending}>
              {t('settings.security.password.updateCta')}
            </WriteButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
