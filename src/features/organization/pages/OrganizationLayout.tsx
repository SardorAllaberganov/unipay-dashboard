import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OrgTabsNav } from '../components/OrgTabsNav';

export default function OrganizationLayout() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page-title">{t('organization.title')}</h1>
      </header>
      <OrgTabsNav />
      <Outlet />
    </div>
  );
}
