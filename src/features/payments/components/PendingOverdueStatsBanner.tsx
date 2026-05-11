// Stats banner above the Pending / Overdue tables. KPI-style stat columns (matching the
// dashboard's <KpiCard> rhythm): small uppercase tracking-wider label above a loud
// tabular-mono value. 2 columns on pending tab, 3 columns on overdue tab.
import { AlertTriangle, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { cn } from '@/lib/utils';
import type { Money } from '@/types/domain';

interface Props {
  tab: 'pending' | 'overdue';
  studentsWithDebt: number;
  totalAmount: Money;
  overdueOver30: number;
}

export function PendingOverdueStatsBanner({
  tab,
  studentsWithDebt,
  totalAmount,
  overdueOver30,
}: Props) {
  const { t } = useTranslation();
  const showOverdue = tab === 'overdue';

  return (
    <Card>
      <div
        className={cn(
          'grid divide-y divide-border md:divide-x md:divide-y-0',
          showOverdue ? 'md:grid-cols-3' : 'md:grid-cols-2',
        )}
      >
        <Stat
          icon={<Users className="size-3.5" aria-hidden />}
          label={t('payments.pending.stats.studentsLabel')}
          value={
            <span className="font-mono tabular">
              {new Intl.NumberFormat('ru-RU').format(studentsWithDebt)}
            </span>
          }
        />
        <Stat
          icon={<Wallet className="size-3.5" aria-hidden />}
          label={t('payments.pending.stats.amountLabel')}
          value={<AmountDisplay value={totalAmount} className="font-mono font-semibold" />}
        />
        {showOverdue ? (
          <Stat
            icon={<AlertTriangle className="size-3.5" aria-hidden />}
            label={t('payments.pending.stats.overdueLabel')}
            value={
              <span
                className={cn(
                  'font-mono tabular',
                  overdueOver30 > 0 ? 'text-destructive' : 'text-foreground',
                )}
              >
                {new Intl.NumberFormat('ru-RU').format(overdueOver30)}
              </span>
            }
            tone={overdueOver30 > 0 ? 'danger' : undefined}
          />
        ) : null}
      </div>
    </Card>
  );
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'danger';
}

function Stat({ icon, label, value, tone }: StatProps) {
  return (
    <div className="flex flex-col gap-1 p-5">
      <div
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider',
          tone === 'danger' ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-semibold leading-tight text-foreground md:text-3xl md:leading-none">
        {value}
      </div>
    </div>
  );
}
