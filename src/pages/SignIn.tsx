import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { signIn, signInAsRole } from '@/lib/auth';
import type { Role } from '@/types/domain';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});
type Values = z.infer<typeof schema>;

const DEV_ROLES: Role[] = ['owner', 'finance_manager', 'operator', 'viewer'];

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (v: Values) => {
    setSubmitting(true);
    setError(null);
    const r = signIn(v.email, v.password);
    setSubmitting(false);
    if (r.ok) {
      navigate(next, { replace: true });
    } else if (r.failureCode) {
      setError(t(`auth.errors.${r.failureCode}`));
    }
  };

  const continueAs = (role: Role) => {
    signInAsRole(role);
    navigate(next, { replace: true });
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="tracking-tight">{t('auth.title')}</CardTitle>
          <CardDescription>{t('auth.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error ? <p className="text-sm text-danger-600">{error}</p> : null}
              <Button type="submit" className="w-full" loading={submitting}>
                {t('auth.submit')}
              </Button>
            </form>
          </Form>

          {import.meta.env.DEV ? (
            <>
              <div className="my-6 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('auth.devContinueAs')}
                </span>
                <Separator className="flex-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEV_ROLES.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    onClick={() => continueAs(role)}
                  >
                    {t(`roles.${role}`)}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
