import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Action {
  label: string;
  to?: string;
  onClick?: () => void;
}

export interface SystemStateLayoutProps {
  variant?: 'in-shell' | 'full-bleed';
  icon: LucideIcon;
  iconTone: 'slate' | 'danger' | 'warning';
  title: string;
  body: string;
  primary?: Action;
  secondary?: Action;
  footer?: ReactNode;
}

const TONE_BG: Record<SystemStateLayoutProps['iconTone'], string> = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-700/20 dark:text-danger-700',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-700/20 dark:text-warning-600',
};

function ActionButton({
  action,
  variant,
  autoFocus,
}: {
  action: Action;
  variant: 'default' | 'ghost';
  autoFocus?: boolean;
}) {
  if (action.to) {
    return (
      <Button asChild variant={variant} autoFocus={autoFocus}>
        <Link to={action.to}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} onClick={action.onClick} autoFocus={autoFocus}>
      {action.label}
    </Button>
  );
}

function Body({ icon: Icon, iconTone, title, body, primary, secondary, footer }: SystemStateLayoutProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center shadow-sm sm:p-8">
      <div
        className={cn(
          'grid size-14 place-items-center rounded-full ring-1 ring-border',
          TONE_BG[iconTone]
        )}
      >
        <Icon className="size-7" aria-hidden />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
      {(primary || secondary) && (
        <div className="mt-2 flex w-full flex-col-reverse gap-2 sm:flex-row-reverse sm:justify-start">
          {primary ? <ActionButton action={primary} variant="default" autoFocus /> : null}
          {secondary ? <ActionButton action={secondary} variant="ghost" /> : null}
        </div>
      )}
      {footer ? <div className="mt-2 w-full text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}

export function SystemStateLayout(props: SystemStateLayoutProps) {
  const { variant = 'in-shell' } = props;
  if (variant === 'full-bleed') {
    return (
      <AuthLayout>
        <Body {...props} />
      </AuthLayout>
    );
  }
  return (
    <div className="flex w-full items-center justify-center py-12">
      <Body {...props} />
    </div>
  );
}
