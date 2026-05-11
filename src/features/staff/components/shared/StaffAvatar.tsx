import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function initials(name: string, fallback: string): string {
  const source = (name || fallback).trim();
  if (!source) return '?';
  const parts = source.split(/[\s.]+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

interface Props {
  fullName: string;
  email: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StaffAvatar({ fullName, email, size = 'md', className }: Props) {
  const sizing =
    size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10';
  return (
    <Avatar className={cn(sizing, className)}>
      <AvatarFallback className="bg-slate-100 text-xs font-medium text-slate-700">
        {initials(fullName, email)}
      </AvatarFallback>
    </Avatar>
  );
}
