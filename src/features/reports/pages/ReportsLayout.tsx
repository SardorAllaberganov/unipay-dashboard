import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ReportsTabsNav } from '../components/ReportsTabsNav';

export default function ReportsLayout() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page-title">{t('reports.title')}</h1>
      </header>
      <ReportsTabsNav />
      <Outlet />
    </div>
  );
}
