import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SettingsTabsNav } from '../components/SettingsTabsNav';

export default function SettingsLayout() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page-title">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </header>
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <SettingsTabsNav />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
