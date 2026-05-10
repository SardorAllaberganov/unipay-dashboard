// Full-bleed chrome for auth pages and full-bleed system states.
// Owns its own <TooltipProvider> because it renders outside <AppShell>.
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { UnipayLogo } from '@/components/layout/UnipayLogo';

interface Props {
  children: ReactNode;
}

export function AuthLayout({ children }: Props) {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative min-h-dvh bg-background lg:flex">
        {/* Brand panel: lg+ only */}
        <aside className="relative hidden bg-brand-600 text-primary-foreground lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--brand-500))_0%,_transparent_55%)]"
          />
          <div className="relative z-10 [&_*]:text-primary-foreground">
            <UnipayLogo />
          </div>
          <div className="relative z-10 max-w-md space-y-3">
            <p className="text-2xl font-semibold tracking-tight">{t('app.name')}</p>
            <p className="text-base text-primary-foreground/85">{t('app.tagline')}</p>
          </div>
        </aside>

        {/* Form column */}
        <div className="relative flex min-h-dvh flex-1 flex-col">
          {/* Subtle radial gradient backdrop: only at <lg, since the brand panel covers it at lg+ */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_hsl(var(--brand-50))_0%,_transparent_60%)] lg:hidden"
          />
          <header className="flex h-14 items-center justify-between px-4 md:px-6">
            <div className="lg:invisible">
              <UnipayLogo />
            </div>
            <ThemeToggle />
          </header>
          <main className="flex flex-1 items-center justify-center p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
