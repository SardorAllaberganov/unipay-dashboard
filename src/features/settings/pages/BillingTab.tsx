import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PanelErrorState } from '@/components/shared/PanelStates';
import { formatMoney, formatPercent } from '@/lib/format';
import { useBilling } from '../hooks/useBilling';
import type { BillingPlanCode } from '@/types/domain';
import { cn } from '@/lib/utils';

export default function BillingTab() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useBilling();

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-5">
          <PanelErrorState onRetry={() => void refetch()} />
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const currentPlan = data.plans.find((p) => p.code === data.current);

  return (
    <div className="space-y-6">
      {/* Current plan */}
      {currentPlan ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <CardTitle>{t('settings.billing.currentTitle')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('settings.billing.currentSubtitle')}
                </p>
              </div>
              <Button asChild>
                <Link to="/locked/billing-upgrade">
                  {t('settings.billing.upgradeCta')}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('settings.billing.planLabel')}
                </dt>
                <dd className="text-base font-semibold text-foreground">{currentPlan.name}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('settings.billing.feeLabel')}
                </dt>
                <dd className="text-base font-semibold text-foreground tabular">
                  {formatMoney(currentPlan.monthlyFee)}
                </dd>
                <p className="text-sm text-muted-foreground">
                  {t('settings.billing.feeSuffix')}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('settings.billing.commissionLabel')}
                </dt>
                <dd className="text-base font-semibold text-foreground tabular">
                  {formatPercent(currentPlan.commissionRate)}
                </dd>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-3">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('settings.billing.scheduleLabel')}
                </dt>
                <dd className="text-base font-medium text-foreground">
                  {t(`settings.billing.schedules.${currentPlan.payoutSchedule}`)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {/* Plans comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.billing.compareTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.billing.compareSubtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">
                    {t('settings.billing.featureCol')}
                  </th>
                  {data.plans.map((plan) => (
                    <th
                      key={plan.code}
                      className={cn(
                        'whitespace-nowrap px-3 py-2 text-center text-sm font-medium',
                        plan.code === data.current
                          ? 'text-brand-700 dark:text-brand-300'
                          : 'text-muted-foreground',
                      )}
                    >
                      {plan.name}
                      {plan.code === data.current ? (
                        <span className="ml-2 inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                          {t('settings.billing.currentBadge')}
                        </span>
                      ) : null}
                    </th>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {t('settings.billing.feeLabel')}
                  </td>
                  {data.plans.map((plan) => (
                    <td
                      key={plan.code}
                      className="px-3 py-1 text-center text-sm tabular text-foreground"
                    >
                      {formatMoney(plan.monthlyFee)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {t('settings.billing.commissionLabel')}
                  </td>
                  {data.plans.map((plan) => (
                    <td
                      key={plan.code}
                      className="px-3 py-1 text-center text-sm tabular text-foreground"
                    >
                      {formatPercent(plan.commissionRate)}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.features.map((feature) => (
                  <tr key={feature.key}>
                    <td className="px-3 py-3 text-sm font-medium text-foreground">
                      {t(`settings.billing.features.${feature.key}`, feature.key)}
                    </td>
                    {data.plans.map((plan) => (
                      <td key={plan.code} className="px-3 py-3 text-center">
                        {feature.included[plan.code as BillingPlanCode] ? (
                          <Check
                            className="mx-auto size-5 text-success-700"
                            aria-label={t('settings.billing.included')}
                          />
                        ) : (
                          <Lock
                            className="mx-auto size-4 text-muted-foreground"
                            aria-label={t('settings.billing.notIncluded')}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
