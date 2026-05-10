// STYLE_DISCIPLINE.md §0.5 — canonical "Назад к <plural>" + lucide ArrowLeft.
// Single source of truth: never write a different back link in detail pages.
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
interface Props {
  to: string;
  pluralName: string;
  className?: string;
}

export function BackLink({ to, pluralName, className }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
        className
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      <span>Назад к {pluralName}</span>
    </Link>
  );
}
