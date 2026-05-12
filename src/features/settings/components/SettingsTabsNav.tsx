// Settings tab nav — mobile: top <Select>; desktop: left vertical strip
// (200px column). Active state matches the project's underline pattern but
// adapted to a vertical orientation (left 2px brand stripe via ::before).
//
// Tab strip is normal flow (no `position: sticky`) per LESSON 2026-05-11.
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TABS = [
  { slug: 'general', labelKey: 'settings.tabs.general' },
  { slug: 'security', labelKey: 'settings.tabs.security' },
  { slug: 'api', labelKey: 'settings.tabs.api' },
  { slug: 'integrations', labelKey: 'settings.tabs.integrations' },
  { slug: 'notifications', labelKey: 'settings.tabs.notifications' },
  { slug: 'billing', labelKey: 'settings.tabs.billing' },
  { slug: 'audit', labelKey: 'settings.tabs.audit' },
  { slug: 'preferences', labelKey: 'settings.tabs.preferences' },
] as const;

export function SettingsTabsNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const activeSlug =
    TABS.find((tab) => location.pathname.endsWith(`/${tab.slug}`))?.slug ?? 'general';

  return (
    <>
      {/* Mobile: select dropdown */}
      <div className="md:hidden">
        <Select value={activeSlug} onValueChange={(slug) => navigate(`/settings/${slug}`)}>
          <SelectTrigger aria-label={t('settings.tabs.aria')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TABS.map((tab) => (
              <SelectItem key={tab.slug} value={tab.slug}>
                {t(tab.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: vertical tab list */}
      <nav
        role="tablist"
        aria-label={t('settings.tabs.aria')}
        className="hidden shrink-0 md:block md:w-[200px]"
      >
        <ul className="flex flex-col gap-1">
          {TABS.map((tab) => {
            const isActive = tab.slug === activeSlug;
            return (
              <li key={tab.slug}>
                <Link
                  to={`/settings/${tab.slug}`}
                  role="tab"
                  aria-current={isActive ? 'page' : undefined}
                  aria-selected={isActive}
                  className={cn(
                    'relative flex h-9 items-center rounded-md pl-3 pr-2 text-sm font-medium leading-none transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700 before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  {t(tab.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
