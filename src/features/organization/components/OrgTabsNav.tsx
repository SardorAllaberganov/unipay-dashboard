import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const TABS = [
  { slug: 'profile', labelKey: 'organization.tabs.profile' },
  { slug: 'departments', labelKey: 'organization.tabs.departments' },
  { slug: 'bank-accounts', labelKey: 'organization.tabs.bankAccounts' },
  { slug: 'branding', labelKey: 'organization.tabs.branding' },
] as const;

export function OrgTabsNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const activeSlug = TABS.find((tab) => location.pathname.endsWith(`/${tab.slug}`))?.slug;

  return (
    <nav
      role="tablist"
      aria-label={t('organization.tabs.aria')}
      className="-mx-4 overflow-x-auto whitespace-nowrap border-b border-border md:mx-0"
    >
      <ul className="flex items-center gap-1 px-4 md:px-0">
        {TABS.map((tab) => {
          const isActive = tab.slug === activeSlug;
          return (
            <li key={tab.slug}>
              <Link
                to={`/organization/${tab.slug}`}
                role="tab"
                aria-current={isActive ? 'page' : undefined}
                aria-selected={isActive}
                className={cn(
                  'relative inline-flex h-10 items-center rounded-t-md px-3 text-sm font-medium leading-none transition-colors',
                  isActive
                    ? 'text-brand-700 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:bg-brand-600 dark:text-brand-300'
                    : 'text-muted-foreground hover:text-foreground'
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
