import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const TABS = [
  { slug: 'summary', labelKey: 'reports.tabs.summary' },
  { slug: 'export', labelKey: 'reports.tabs.export' },
] as const;

/**
 * Tabs persist the `?range=&from=&to=` search params across switches so the
 * Summary↔Export navigation keeps the active date range — required by the
 * Prompt 8 acceptance ("Tab nav between Summary/Export persists range param
 * via URL").
 */
export function ReportsTabsNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeSlug = TABS.find((tab) => location.pathname.endsWith(`/${tab.slug}`))?.slug;
  const qs = searchParams.toString();

  return (
    <nav
      role="tablist"
      aria-label={t('reports.tabs.aria')}
      className="-mx-4 overflow-x-auto whitespace-nowrap border-b border-border md:mx-0"
    >
      <ul className="flex items-center gap-1 px-4 md:px-0">
        {TABS.map((tab) => {
          const isActive = tab.slug === activeSlug;
          const to = qs ? `/reports/${tab.slug}?${qs}` : `/reports/${tab.slug}`;
          return (
            <li key={tab.slug}>
              <Link
                to={to}
                role="tab"
                aria-current={isActive ? 'page' : undefined}
                aria-selected={isActive}
                className={cn(
                  'relative inline-flex h-10 items-center rounded-t-md px-3 text-sm font-medium leading-none transition-colors',
                  isActive
                    ? 'text-brand-700 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-brand-600 dark:text-brand-300'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(tab.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
