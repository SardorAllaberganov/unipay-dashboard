import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WriteButton } from '@/components/unipay/WriteButton';
import { signIn } from '@/lib/auth';
import { signInSchema, type SignInValues } from '../schemas';
import {
  isLockedOut,
  recordFailure,
  recordSuccess,
  useFailedAttempts,
} from '../hooks/useFailedAttempts';
import { LockedAlert } from './LockedAlert';
import { PasswordField } from './PasswordField';

export function SignInForm(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const failedState = useFailedAttempts();
  const locked = isLockedOut(failedState);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(() => signInSchema(t), [t]);

  const form = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: import.meta.env.DEV
      ? { email: 'owner@unipay.dev', password: 'demo1234', rememberMe: false }
      : { email: '', password: '', rememberMe: false },
  });

  const next = params.get('next');
  const target = next && next.startsWith('/') ? next : '/';

  const onSubmit = async (v: SignInValues): Promise<void> => {
    if (locked) return;
    setSubmitting(true);
    setError(null);
    const r = await signIn(v.email, v.password);
    setSubmitting(false);
    if (r.ok) {
      recordSuccess();
      navigate(target, { replace: true });
    } else {
      recordFailure();
      setError(t('auth.signIn.errorInvalid'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <LockedAlert />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.signIn.emailLabel')}</FormLabel>
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
              <FormLabel>{t('auth.signIn.passwordLabel')}</FormLabel>
              <FormControl>
                <PasswordField autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="cursor-pointer text-sm font-normal">
                  {t('auth.signIn.rememberMe')}
                </FormLabel>
              </FormItem>
            )}
          />
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            {t('auth.signIn.forgotLink')}
          </Link>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <WriteButton type="submit" className="w-full" loading={submitting} disabled={locked}>
          {t('auth.signIn.submit')}
        </WriteButton>
      </form>
    </Form>
  );
}
