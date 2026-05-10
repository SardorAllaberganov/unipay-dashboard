import { useEffect, useState, type ReactNode } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { addMonths, format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { resolveDateRange, type DateRangeKey, type DateRangeValue } from './dateRange';

interface QuickOption {
  key: DateRangeKey;
  labelKey: string;
}

const QUICK_OPTIONS: QuickOption[] = [
  { key: 'today', labelKey: 'common.daterange.today' },
  { key: 'yesterday', labelKey: 'common.daterange.yesterday' },
  { key: '7d', labelKey: 'common.daterange.7d' },
  { key: '30d', labelKey: 'common.daterange.30d' },
  { key: 'custom', labelKey: 'common.daterange.custom' },
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  /** Trigger element. Rendered via `asChild` so it can be any focusable button. */
  children: ReactNode;
}

export function DateRangePicker({ value, onChange, children }: DateRangePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DateRangeValue>(value);
  const [displayMonth, setDisplayMonth] = useState<Date>(
    () => resolveDateRange(value)?.from ?? startOfDay(new Date()),
  );

  // Match Tailwind `md` (768px). Below that render a single month so the
  // calendar fits a phone without horizontal scroll.
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Reset pending state + reposition the calendar to the active range
  // each time the picker opens.
  useEffect(() => {
    if (open) {
      setPending(value);
      const r = resolveDateRange(value);
      if (r?.from) setDisplayMonth(r.from);
    }
  }, [open, value]);

  const resolved = resolveDateRange(pending);
  const monthA = displayMonth;
  const monthB = addMonths(displayMonth, 1);

  function selectQuick(key: DateRangeKey) {
    if (key === 'custom') {
      setPending({
        range: 'custom',
        customFrom: pending.customFrom ?? resolved?.from,
        customTo: pending.customTo ?? resolved?.to,
      });
    } else {
      setPending({ range: key });
    }
  }

  function selectCalendarRange(range: DateRange | undefined) {
    if (!range?.from) {
      setPending({ range: 'custom', customFrom: undefined, customTo: undefined });
      return;
    }
    setPending({
      range: 'custom',
      customFrom: range.from,
      customTo: range.to ?? range.from,
    });
  }

  function handleApply() {
    onChange(pending);
    setOpen(false);
  }
  function handleCancel() {
    setOpen(false);
  }

  const fromLabel = resolved?.from ? formatDate(resolved.from) : '—';
  const toLabel = resolved?.to ? formatDate(resolved.to) : '—';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={8}
        className={cn(
          'overflow-hidden rounded-lg p-0 shadow-lg',
          // Two-month calendar (≈860px) on `md+`; clamped to viewport on mobile
          // so it never overflows. Combined with collisionPadding so Radix
          // shifts off the viewport edge when the trigger sits near it.
          'w-[min(860px,calc(100vw-1rem))]',
        )}
        aria-label={t('common.daterange.title')}
      >
        <div className="flex flex-col md:min-h-[420px] md:flex-row">
          {/* Quick-select sidebar */}
          <aside className="flex flex-col border-b bg-muted/30 md:w-[210px] md:border-b-0 md:border-r">
            <div className="px-4 pb-2 pt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('common.daterange.quick-select')}
            </div>
            <div className="flex-1 space-y-0.5 px-2 pb-3">
              {QUICK_OPTIONS.map((opt) => (
                <QuickRow
                  key={opt.key}
                  label={t(opt.labelKey)}
                  active={pending.range === opt.key}
                  onClick={() => selectQuick(opt.key)}
                />
              ))}
            </div>
          </aside>

          {/* Two-month calendar with custom header bar */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <button
                type="button"
                onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}
                className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={t('common.daterange.prevMonth')}
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <div className="flex min-w-0 flex-1 items-center justify-around gap-2">
                <span className="truncate text-base font-semibold tracking-tight">
                  {format(monthA, 'LLLL yyyy', { locale: ru })}
                </span>
                {!isMobile ? (
                  <>
                    <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
                    <span className="truncate text-base font-semibold tracking-tight">
                      {format(monthB, 'LLLL yyyy', { locale: ru })}
                    </span>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
                className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={t('common.daterange.nextMonth')}
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex flex-1 justify-center p-3 md:p-4">
              <Calendar
                mode="range"
                numberOfMonths={isMobile ? 1 : 2}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                selected={resolved}
                onSelect={selectCalendarRange}
                classNames={{ nav: 'hidden', caption_label: 'hidden' }}
              />
            </div>
          </div>
        </div>

        {/* Footer: range summary + Cancel / Apply */}
        <div className="flex flex-col gap-3 border-t bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-medium tabular text-foreground">
            <CalendarIcon className="size-4 text-muted-foreground" aria-hidden />
            <span>
              {fromLabel} <span className="text-muted-foreground">–</span> {toLabel}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t('common.daterange.cancel')}
            </Button>
            <Button onClick={handleApply}>{t('common.daterange.apply')}</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface QuickRowProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function QuickRow({ label, active, onClick }: QuickRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
        active
          ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
          : 'text-foreground/80 hover:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
          active ? 'border-brand-600' : 'border-muted-foreground/40',
        )}
        aria-hidden
      >
        {active ? <span className="size-2 rounded-full bg-brand-600" /> : null}
      </span>
      {label}
    </button>
  );
}
