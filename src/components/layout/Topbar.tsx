import { Fragment, type RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  to?: string;
}

const ROUTE_TITLES: Record<string, { titleKey: string; sectionKey?: string }> = {
  '/': { titleKey: 'nav.dashboard', sectionKey: 'nav.section.main' },
  '/organization': { titleKey: 'nav.organization', sectionKey: 'nav.section.organization' },
  '/staff': { titleKey: 'nav.staff', sectionKey: 'nav.section.organization' },
  '/students': { titleKey: 'nav.students', sectionKey: 'nav.section.students' },
  '/payments/transactions': {
    titleKey: 'nav.transactions',
    sectionKey: 'nav.section.payments',
  },
  '/payments/pending': { titleKey: 'nav.pending', sectionKey: 'nav.section.payments' },
  '/payments/refunds': { titleKey: 'nav.refunds', sectionKey: 'nav.section.payments' },
  '/reports': { titleKey: 'nav.reports', sectionKey: 'nav.section.finance' },
  '/payouts': { titleKey: 'nav.payouts', sectionKey: 'nav.section.finance' },
  '/settings': { titleKey: 'nav.settings', sectionKey: 'nav.section.system' },
};

function titleCaseSegment(seg: string): string {
  return seg
    .split('-')
    .map((w) => (w.length > 0 ? (w[0]?.toUpperCase() ?? '') + w.slice(1) : w))
    .join(' ');
}

function getBreadcrumbs(pathname: string, t: (k: string) => string): Crumb[] {
  const detailMatchers: { pattern: RegExp; titleKey: string; sectionKey: string; to: string }[] = [
    {
      pattern: /^\/students\/(.+)$/,
      titleKey: 'nav.students',
      sectionKey: 'nav.section.students',
      to: '/students',
    },
    {
      pattern: /^\/payments\/transactions\/(.+)$/,
      titleKey: 'nav.transactions',
      sectionKey: 'nav.section.payments',
      to: '/payments/transactions',
    },
    {
      pattern: /^\/payouts\/(.+)$/,
      titleKey: 'nav.payouts',
      sectionKey: 'nav.section.finance',
      to: '/payouts',
    },
  ];

  for (const m of detailMatchers) {
    const match = pathname.match(m.pattern);
    if (match) {
      return [
        { label: t(m.sectionKey) },
        { label: t(m.titleKey), to: m.to },
        { label: match[1] ?? '' },
      ];
    }
  }

  const route = ROUTE_TITLES[pathname];
  if (route) {
    return [
      ...(route.sectionKey ? [{ label: t(route.sectionKey) }] : []),
      { label: t(route.titleKey) },
    ];
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: t('app.name') }];
  return parts.map((p) => ({ label: titleCaseSegment(p) }));
}

interface TopBarProps {
  onCommandPalette: () => void;
  onMobileMenu?: () => void;
  onShowHelp?: () => void;
  searchInputRef?: RefObject<HTMLInputElement>;
  className?: string;
}

export function TopBar({
  onCommandPalette,
  onMobileMenu,
  onShowHelp,
  searchInputRef,
  className,
}: TopBarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname, t);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenu}
        aria-label={t('common.actions.openMenu')}
      >
        <Menu className="size-5" aria-hidden />
      </Button>

      <nav
        className="hidden min-w-0 flex-shrink items-center gap-1.5 md:flex"
        aria-label="Breadcrumb"
      >
        {breadcrumbs.map((bc, i) => {
          const isLast = i === breadcrumbs.length - 1;
          const hideOnMd = !isLast && i < breadcrumbs.length - 2;
          return (
            <Fragment key={i}>
              {i > 0 ? (
                <ChevronRight
                  className={cn(
                    'size-3.5 shrink-0 text-muted-foreground/60',
                    hideOnMd && 'hidden lg:inline-block'
                  )}
                  aria-hidden
                />
              ) : null}
              {bc.to && !isLast ? (
                <Link
                  to={bc.to}
                  className={cn(
                    'truncate text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline',
                    hideOnMd && 'hidden lg:inline-block'
                  )}
                >
                  {bc.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'truncate text-sm',
                    isLast ? 'font-medium text-foreground' : 'text-muted-foreground',
                    hideOnMd && 'hidden lg:inline-block'
                  )}
                >
                  {bc.label}
                </span>
              )}
            </Fragment>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onCommandPalette}
        className="hidden h-9 w-[320px] items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:flex lg:w-[420px]"
        aria-label={t('common.actions.search')}
      >
        <Search className="size-4 opacity-60" aria-hidden />
        <span className="flex-1 truncate text-left">{t('common.actions.search')}</span>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </button>

      <Input
        ref={searchInputRef}
        type="search"
        placeholder={t('common.actions.search')}
        className="h-9 md:hidden"
        aria-label={t('common.actions.search')}
      />

      <ThemeToggle />
      <NotificationsBell />
      <UserMenu onShowHelp={onShowHelp} />
    </header>
  );
}
