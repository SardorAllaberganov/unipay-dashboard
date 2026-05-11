// Transaction filters. URL-syncable. Desktop: FilterStack groups. Mobile: bottom Sheet trigger.
// All payment channels per spec §9.1. No sticky positioning anywhere (LESSONS 2026-05-11).
import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { useDateRangeLabel } from '@/components/shared/dateRange';
import type { DateRangeValue } from '@/components/shared/dateRange';
import { ChipGroup, FilterStack } from '@/components/shared/FilterStack';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { Calendar } from 'lucide-react';
import type { PaymentChannel, PaymentStatus } from '@/types/domain';

const CHANNELS: PaymentChannel[] = [
  'payme',
  'click',
  'uzum',
  'apelsin',
  'tezpay',
  'mpay',
  'cash',
];
const STATUSES: PaymentStatus[] = ['paid', 'pending', 'processing', 'failed', 'refunded', 'overdue'];

export interface TransactionFiltersValue {
  search: string;
  dateRange: DateRangeValue;
  statuses: PaymentStatus[];
  channels: PaymentChannel[];
}

interface Props {
  value: TransactionFiltersValue;
  onChange: (next: TransactionFiltersValue) => void;
}

function countActiveNonSearch(v: TransactionFiltersValue): number {
  return v.statuses.length + v.channels.length;
}

export function TransactionFilters({ value, onChange }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState(value.search);
  const debounced = useDebounce(searchInput, 200);
  const rangeLabel = useDateRangeLabel(value.dateRange);

  useEffect(() => {
    setSearchInput(value.search);
  }, [value.search]);

  useEffect(() => {
    if (debounced !== value.search) {
      onChange({ ...value, search: debounced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const activeCount = countActiveNonSearch(value);

  function resetAll() {
    setSearchInput('');
    onChange({
      search: '',
      dateRange: value.dateRange, // keep date range
      statuses: [],
      channels: [],
    });
  }

  const statusGroup = (
    <FilterStack label={t('payments.filters.status')}>
      <ChipGroup
        items={STATUSES.map((s) => ({ id: s, label: t(`status.${s}`) }))}
        value={value.statuses}
        onChange={(next) =>
          onChange({ ...value, statuses: next as PaymentStatus[] })
        }
      />
    </FilterStack>
  );

  const channelGroup = (
    <FilterStack label={t('payments.filters.channel')}>
      <ChipGroup
        items={CHANNELS.map((c) => ({ id: c, label: t(`channels.${c}`) }))}
        value={value.channels}
        onChange={(next) =>
          onChange({ ...value, channels: next as PaymentChannel[] })
        }
      />
    </FilterStack>
  );

  return (
    <div className="mb-4 flex flex-col gap-3">
      {/* Row 1: search + date range + (mobile) filters trigger */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('payments.filters.searchPlaceholder')}
            className="pl-9"
            aria-label={t('payments.filters.searchPlaceholder')}
          />
        </div>

        <DateRangePicker
          value={value.dateRange}
          onChange={(next) => onChange({ ...value, dateRange: next })}
        >
          <Button variant="outline" type="button" className="justify-between gap-2">
            <span className="truncate">{rangeLabel}</span>
            <Calendar className="size-4 opacity-60" aria-hidden />
          </Button>
        </DateRangePicker>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" type="button" className="shrink-0">
                <SlidersHorizontal className="mr-1.5 size-4" aria-hidden />
                {t('payments.filters.openMobile')}
                {activeCount > 0 ? (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-medium text-white">
                    {activeCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto -mx-1 px-5">
              <SheetHeader>
                <SheetTitle>{t('payments.filters.openMobile')}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {statusGroup}
                {channelGroup}
                {activeCount > 0 ? (
                  <Button variant="ghost" type="button" onClick={resetAll} className="w-full">
                    <X className="mr-1 size-4" aria-hidden />
                    {t('payments.filters.reset')}
                  </Button>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>

      {/* Row 2: desktop chip groups */}
      {!isMobile ? (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          {statusGroup}
          {channelGroup}
          {activeCount > 0 ? (
            <Button variant="ghost" type="button" size="sm" onClick={resetAll}>
              <X className="mr-1 size-4" aria-hidden />
              {t('payments.filters.reset')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

