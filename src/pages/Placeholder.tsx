import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/shared/EmptyState';

export default function Placeholder() {
  const { t } = useTranslation();
  const location = useLocation();

  // Map route path to a sensible title key.
  const TITLE_BY_PATH: Record<string, string> = {
    '/organization': 'nav.organization',
    '/staff': 'nav.staff',
    '/students': 'nav.students',
    '/payments/transactions': 'nav.transactions',
    '/payments/pending': 'nav.pending',
    '/payments/refunds': 'nav.refunds',
    '/reports': 'nav.reports',
    '/payouts': 'nav.payouts',
    '/settings': 'nav.settings',
  };

  // Detect detail route by /:id suffix.
  const baseMatch = Object.keys(TITLE_BY_PATH).find(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
  );
  const titleKey = baseMatch ? TITLE_BY_PATH[baseMatch]! : 'app.name';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page-title text-foreground">{t(titleKey)}</h1>
      </header>
      <EmptyState
        icon={Construction}
        title="Этот модуль появится в следующих сборках"
        description="Скелет страницы существует, реализация заходит в следующих промптах."
      />
    </div>
  );
}
