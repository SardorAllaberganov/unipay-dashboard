import { CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { useDateRangeLabel } from '@/components/shared/dateRange';
import { SummaryKpiRow } from '../components/SummaryKpiRow';
import { RevenueOverTimeChart } from '../components/RevenueOverTimeChart';
import { ChannelBreakdownChart } from '../components/ChannelBreakdownChart';
import { DepartmentBreakdownChart } from '../components/DepartmentBreakdownChart';
import { ByDayTable } from '../components/ByDayTable';
import { useReportRangeParam } from '../hooks/useReportRangeParam';

export default function SummaryPage() {
  const { t } = useTranslation();
  const { value, apiRange, handleChange } = useReportRangeParam();
  const dateRangeLabel = useDateRangeLabel(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold leading-tight">{t('reports.summary.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('reports.summary.description')}
          </p>
        </div>
        <DateRangePicker value={value} onChange={handleChange}>
          <Button
            variant="outline"
            className="w-full justify-between gap-2 font-normal tabular md:w-auto"
          >
            <span className="truncate">{dateRangeLabel}</span>
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Button>
        </DateRangePicker>
      </div>

      <SummaryKpiRow range={apiRange} />

      <RevenueOverTimeChart range={apiRange} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChannelBreakdownChart range={apiRange} />
        <DepartmentBreakdownChart range={apiRange} />
      </div>

      <ByDayTable range={apiRange} />
    </div>
  );
}
