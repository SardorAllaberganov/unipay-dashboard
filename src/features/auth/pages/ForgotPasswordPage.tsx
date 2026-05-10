import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WriteButton } from '@/components/unipay/WriteButton';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';
import { useForgotPassword } from '../hooks/useForgotPassword';

export default function ForgotPasswordPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const schema = useMemo(() => forgotPasswordSchema(t), [t]);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const mutation = useForgotPassword();

  const onSubmit = async (v: ForgotPasswordValues): Promise<void> => {
    await mutation.mutateAsync(v.email);
    setSubmittedEmail(v.email);
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="tracking-tight">{t('auth.forgot.title')}</CardTitle>
          <CardDescription>{t('auth.forgot.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {submittedEmail ? (
            <div className="space-y-4">
              <Alert variant="success">
                <CheckCircle2 className="size-4" aria-hidden />
                <AlertTitle>{t('auth.forgot.successTitle')}</AlertTitle>
                <AlertDescription>
                  {t('auth.forgot.successBody', { email: submittedEmail })}
                </AlertDescription>
              </Alert>
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {t('auth.forgot.backToSignIn')}
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.forgot.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" {...field} />
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
                  {t('auth.forgot.submit')}
                </WriteButton>
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  {t('auth.forgot.backToSignIn')}
                </Link>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
