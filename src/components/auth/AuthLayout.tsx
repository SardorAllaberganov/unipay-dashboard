// Full-bleed chrome for /sign-in and full-bleed system states.
// Owns its own <TooltipProvider> because it renders outside <AppShell>.
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UnipayLogo } from '@/components/layout/UnipayLogo';

interface Props {
  children: ReactNode;
}

export function AuthLayout({ children }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative min-h-dvh bg-background">
        {/* Subtle radial gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_hsl(var(--brand-50))_0%,_transparent_60%)]"
        />

        <header className="flex h-14 items-center justify-between px-4 md:px-6">
          <UnipayLogo />
          <ThemeToggle />
        </header>

        <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center p-4 md:p-6">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
