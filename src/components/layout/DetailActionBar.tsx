// STYLE_DISCIPLINE.md §0.5 — fixed-bottom action bar.
// Offsets by --sidebar-width on md+. Page wrapper must include `pb-28` (or `pb-32` if dense)
// so the last card clears it. On mobile, this bar replaces the bottom tab nav (§0.7).
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
interface Props {
  children: ReactNode;
  className?: string;
}

export function DetailActionBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-3 md:left-[var(--sidebar-width,4rem)] md:px-6',
        className
      )}
    >
      <div className="flex w-full gap-2 md:justify-end">{children}</div>
    </div>
  );
}
