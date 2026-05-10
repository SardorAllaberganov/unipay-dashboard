import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { addDays, startOfMonth, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface Props {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
}

type Quick = 'today' | 'week' | 'month' | 'custom';

export function DateRangePicker({ value, onChange, className }: Props) {
  const { t } = useTranslation();
  const [quick, setQuick] = useState<Quick>('today');

  const apply = (q: Quick) => {
    setQuick(q);
    const now = new Date();
    if (q === 'today') {
      onChange?.({ from: now, to: now });
    } else if (q === 'week') {
      onChange?.({ from: startOfWeek(now, { weekStartsOn: 1 }), to: now });
    } else if (q === 'month') {
      onChange?.({ from: startOfMonth(now), to: now });
    }
  };

  const buttonLabel = value
    ? `${formatDate(value.from)} — ${formatDate(value.to)}`
    : t('common.custom');

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="inline-flex rounded-md bg-surface-2 p-0.5">
        {(['today', 'week', 'month'] as const).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => apply(q)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm transition-colors',
              quick === q ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            {t(`common.${q}`)}
          </button>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('justify-start text-left font-normal tabular', !value && 'text-muted-foreground')}
            onClick={() => setQuick('custom')}
          >
            <CalendarIcon className="size-4" aria-hidden />
            {buttonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value ? { from: value.from, to: value.to } : undefined}
            onSelect={(r) => {
              if (r?.from && r?.to) {
                onChange?.({ from: r.from, to: r.to });
              } else if (r?.from) {
                onChange?.({ from: r.from, to: addDays(r.from, 0) });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
