import { Banknote, Clock, Receipt, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-page-title text-foreground">{t('nav.dashboard')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('app.tagline')}</p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t('kpi.todayRevenue')}
          value="4 200 000 UZS"
          delta={4.2}
          icon={Banknote}
          spark={[120, 132, 128, 144, 138, 152, 168]}
        />
        <KpiCard
          label={t('kpi.transactionsToday')}
          value="132"
          delta={-2.1}
          icon={Receipt}
          spark={[12, 18, 14, 22, 19, 16, 14]}
        />
        <KpiCard label={t('kpi.pending')} value="28" icon={Clock} />
        <KpiCard
          label={t('kpi.studentsActive')}
          value="1 284"
          delta={1.6}
          icon={Users}
          spark={[1180, 1198, 1210, 1232, 1248, 1268, 1284]}
        />
      </div>
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          Подробные виджеты дашборда появятся в следующих сборках.
        </p>
      </Card>
    </div>
  );
}
