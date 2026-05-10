import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { signInAsRole } from '@/lib/auth';
import type { Role } from '@/types/domain';

const DEV_ROLES: readonly Role[] = ['owner', 'finance_manager', 'operator', 'viewer'];

export function DevRoleSwitcher(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const target = next && next.startsWith('/') ? next : '/';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {t('auth.dev.title')}
        </span>
        <Separator className="flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DEV_ROLES.map((role) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            onClick={() => {
              signInAsRole(role);
              navigate(target, { replace: true });
            }}
          >
            {t(`roles.${role}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
