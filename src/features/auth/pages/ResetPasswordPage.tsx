import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { WriteButton } from '@/components/unipay/WriteButton';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import { useResetPassword } from '../hooks/useResetPassword';
import { PasswordField } from '../components/PasswordField';

export default function ResetPasswordPage(): React.JSX.Element | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      toast.error(t('auth.reset.invalidToken'));
      navigate('/sign-in', { replace: true });
    }
  }, [token, navigate, t]);

  const schema = useMemo(() => resetPasswordSchema(t), [t]);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const mutation = useResetPassword();

  const onSubmit = async (v: ResetPasswordValues): Promise<void> => {
    if (!token) return;
    try {
      await mutation.mutateAsync({ token, password: v.password });
      toast.success(t('auth.reset.successToast'));
      navigate('/sign-in', { replace: true });
    } catch {
      toast.error(t('auth.reset.invalidToken'));
      navigate('/sign-in', { replace: true });
    }
  };

  if (!token) return null;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="tracking-tight">{t('auth.reset.title')}</CardTitle>
          <CardDescription>{t('auth.reset.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.reset.passwordLabel')}</FormLabel>
                    <FormControl>
                      <PasswordField autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.reset.confirmLabel')}</FormLabel>
                    <FormControl>
                      <PasswordField autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <WriteButton
                type="submit"
                className="w-full"
                loading={mutation.isPending}
              >
                {t('auth.reset.submit')}
              </WriteButton>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
