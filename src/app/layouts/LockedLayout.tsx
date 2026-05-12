// Wraps a locked-feature route in a full-bleed background + centered card layout.
// Lives INSIDE `<AppShell>` (so users keep their sidebar context + the page is
// reachable from the sidebar coming-soon items), but the page content is rendered
// in a full-bleed wrapper with a subtle radial-gradient background that distinguishes
// it from live module surfaces.
//
// Background uses scale tokens via `hsl(var(...))` so theme-switching just works.
// Light: subtle brand-50 wash at top fading to transparent.
// Dark:  brand-950 wash at top fading to transparent.
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
}

export function LockedLayout({ children, className }: Props) {
  return (
    <div
      className={cn(
        // Negative margins reverse the AppShell's `<main>` padding so the
        // gradient touches the page edges. Inner container restores the
        // visual content gutter via `px-4 md:px-6`.
        '-mx-4 -my-4 min-h-[calc(100dvh-3.5rem)] md:-mx-6 md:-my-6',
        'bg-[radial-gradient(ellipse_at_top,hsl(var(--brand-50))_0%,transparent_60%)]',
        'dark:bg-[radial-gradient(ellipse_at_top,hsl(var(--brand-950)/0.4)_0%,transparent_60%)]',
        className,
      )}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-3xl flex-col items-stretch px-4 py-12 md:px-6 md:py-16">
        {children}
      </div>
    </div>
  );
}
