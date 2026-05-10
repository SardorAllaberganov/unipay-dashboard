import { Crown, Eye, Settings2, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/domain';

const ICONS: Record<Role, LucideIcon> = {
  owner: Crown,
  finance_manager:Wallet,
  operator: Settings2,
  viewer: Eye,
};

const TONES: Record<Role, string> = {
  owner: 'bg-primary-light text-primary',
  finance_manager:'bg-success-light text-success-foreground',
  operator: 'bg-info-light text-primary',
  viewer: 'bg-surface-2 text-muted-foreground',
};

interface Props {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className }: Props) {
  const { t } = useTranslation();
  const Icon = ICONS[role];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
        TONES[role],
        className
      )}
    >
      <Icon className="size-3" aria-hidden />
      {t(`roles.${role}`)}
    </span>
  );
}
