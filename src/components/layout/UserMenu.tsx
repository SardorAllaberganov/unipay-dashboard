import { Keyboard, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { signOut, useSession } from '@/lib/auth';
import { useTranslation as useT } from 'react-i18next';
import { RoleBadge } from '@/components/shared/RoleBadge';

interface Props {
  onShowHelp?: () => void;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase();
}

export function UserMenu({ onShowHelp }: Props) {
  const { t } = useTranslation();
  void useT(); // ensure context, no-op
  const session = useSession();
  const navigate = useNavigate();

  if (!session) return null;
  const { displayName, email } = session.profile;
  const initials = initialsFor(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={displayName}>
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel className="flex flex-col gap-1 py-3">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="truncate text-sm font-normal text-muted-foreground">{email}</span>
          <RoleBadge role={session.profile.role} className="mt-1 self-start" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <UserIcon className="size-4" aria-hidden />
          {t('common.actions.settings')}
        </DropdownMenuItem>
        {onShowHelp ? (
          <DropdownMenuItem onClick={onShowHelp}>
            <Keyboard className="size-4" aria-hidden />
            {t('common.actions.shortcuts')}
            <Kbd className="ml-auto">?</Kbd>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut({ reason: 'user' });
            navigate('/sign-in');
          }}
          className="text-danger-600 focus:text-danger-700"
        >
          <LogOut className="size-4" aria-hidden />
          {t('common.actions.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
