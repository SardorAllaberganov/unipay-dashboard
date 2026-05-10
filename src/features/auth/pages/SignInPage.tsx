import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { clearSignOutReason, readSignOutReason } from '@/lib/auth';
import { SignInForm } from '../components/SignInForm';
import { DevRoleSwitcher } from '../components/DevRoleSwitcher';

export default function SignInPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [params] = useSearchParams();

  const initialExpired = useMemo(
    () => params.get('expired') === '1' || readSignOutReason() === 'session_expired',
    [params]
  );

  const [expired] = useState(initialExpired);

  useEffect(() => {
    if (initialExpired) clearSignOutReason();
  }, [initialExpired]);

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="tracking-tight">{t('auth.signIn.title')}</CardTitle>
          <CardDescription>{t('auth.signIn.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {expired ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertDescription>{t('auth.signIn.expired')}</AlertDescription>
            </Alert>
          ) : null}
          <SignInForm />
          {import.meta.env.DEV ? <DevRoleSwitcher /> : null}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
