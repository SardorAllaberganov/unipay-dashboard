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

// Per-section tab slug → localized label key. When the path is exactly
// `/{section}/{tab}` (a nested-tab layout) we surface the active tab as the
// third breadcrumb level so users see e.g. "Система › Настройки › Общие".
const NESTED_TAB_LABELS: Record<string, Record<string, string>> = {
  '/settings': {
    general: 'settings.tabs.general',
    security: 'settings.tabs.security',
    api: 'settings.tabs.api',
    integrations: 'settings.tabs.integrations',
    notifications: 'settings.tabs.notifications',
    billing: 'settings.tabs.billing',
    audit: 'settings.tabs.audit',
    preferences: 'settings.tabs.preferences',
  },
  '/organization': {
    profile: 'organization.tabs.profile',
    departments: 'organization.tabs.departments',
    'bank-accounts': 'organization.tabs.bankAccounts',
    branding: 'organization.tabs.branding',
  },
  '/reports': {
    summary: 'reports.tabs.summary',
    export: 'reports.tabs.export',
  },
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

  // /locked/:feature — Coming Soon landings. Title resolves from the feature
  // content registry via i18n; unknown slugs fall back to the generic "Скоро"
  // label so the crumb stays localized regardless.
  const lockedMatch = pathname.match(/^\/locked\/([^/]+)$/);
  if (lockedMatch) {
    const slug = lockedMatch[1]!;
    const titleKey = `comingSoon.features.${slug}.title`;
    const resolved = t(titleKey);
    const label = resolved === titleKey ? t('comingSoon.fallback.title') : resolved;
    return [{ label: t('comingSoon.badge') }, { label }];
  }

  const route = ROUTE_TITLES[pathname];
  if (route) {
    return [
      ...(route.sectionKey ? [{ label: t(route.sectionKey) }] : []),
      { label: t(route.titleKey) },
    ];
  }

  // Nested-tab layouts (`/settings/security`, `/organization/profile`,
  // `/reports/summary`, etc.) fall through the exact-match lookup. Resolve via
  // the parent section so the breadcrumb stays localized; if the path is
  // exactly `/{section}/{tab}` and the tab has a registered label, surface the
  // tab as a third crumb so users see "Section › Page › Tab".
  const parentRoute = findParentRoute(pathname);
  if (parentRoute) {
    const cfg = ROUTE_TITLES[parentRoute]!;
    const parts = pathname.split('/').filter(Boolean);
    const parentParts = parentRoute.split('/').filter(Boolean);
    const isImmediateChildTab = parts.length === parentParts.length + 1;
    const tabSlug = isImmediateChildTab ? parts[parts.length - 1] : undefined;
    const tabLabelKey = tabSlug ? NESTED_TAB_LABELS[parentRoute]?.[tabSlug] : undefined;
    return [
      ...(cfg.sectionKey ? [{ label: t(cfg.sectionKey) }] : []),
      { label: t(cfg.titleKey), to: parentRoute },
      ...(tabLabelKey ? [{ label: t(tabLabelKey) }] : []),
    ];
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: t('app.name') }];
  return parts.map((p) => ({ label: titleCaseSegment(p) }));
}

function findParentRoute(pathname: string): string | null {
  // Walk path prefixes longest-first so `/payments/transactions` wins over `/payments`.
  const parts = pathname.split('/').filter(Boolean);
  for (let i = parts.length - 1; i > 0; i--) {
    const candidate = '/' + parts.slice(0, i).join('/');
    if (candidate in ROUTE_TITLES) return candidate;
  }
  return null;
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
        className="hidden h-9 w-[320px] items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:flex lg:w-[420px]"
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
