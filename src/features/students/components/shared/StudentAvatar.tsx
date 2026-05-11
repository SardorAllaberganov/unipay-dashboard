import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function initials(firstName: string, lastName: string): string {
  const f = (firstName || '').trim().charAt(0).toUpperCase();
  const l = (lastName || '').trim().charAt(0).toUpperCase();
  return (l + f) || (f || '?');
}

interface Props {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StudentAvatar({ firstName, lastName, avatarUrl, size = 'md', className }: Props) {
  const sizing = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-14' : 'size-10';
  return (
    <Avatar className={cn(sizing, className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-700">
        {initials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
