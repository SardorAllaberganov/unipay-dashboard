import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TreePicker, type TreeItem } from '@/components/shared/TreePicker';
import { FilterStack, ChipGroup } from '@/components/shared/FilterStack';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-breakpoint';
import type {
  Department,
  EducationType,
  StudentPaymentStatus,
} from '@/types/domain';

export interface StudentsFiltersValue {
  search: string;
  departmentIds: string[];
  years: number[];
  paymentStatuses: StudentPaymentStatus[];
  educationTypes: EducationType[];
}

interface Props {
  value: StudentsFiltersValue;
  onChange: (next: StudentsFiltersValue) => void;
  departments: Department[];
  isDepartmentsLoading?: boolean;
}

const ALL_YEARS = [1, 2, 3, 4, 5, 6] as const;
const ALL_PAYMENT_STATUSES: StudentPaymentStatus[] = ['paid', 'partial', 'pending', 'overdue'];
const ALL_EDU_TYPES: EducationType[] = ['full-time', 'part-time', 'evening', 'remote'];

function departmentsToTreeItems(items: Department[]): TreeItem[] {
  return items.map((d) => ({
    id: d.id,
    parentId: d.parentId,
    label: d.name.ru,
    meta: d,
  }));
}

function countActiveNonSearch(v: StudentsFiltersValue): number {
  return (
    v.departmentIds.length +
    v.years.length +
    v.paymentStatuses.length +
    v.educationTypes.length
  );
}

export function StudentsFilters({ value, onChange, departments, isDepartmentsLoading }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState(value.search);
  const debounced = useDebounce(searchInput, 200);

  useEffect(() => {
    setSearchInput(value.search);
  }, [value.search]);

  useEffect(() => {
    if (debounced !== value.search) {
      onChange({ ...value, search: debounced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const treeItems = useMemo(() => departmentsToTreeItems(departments), [departments]);
  const activeCount = countActiveNonSearch(value);

  function resetAll() {
    setSearchInput('');
    onChange({ search: '', departmentIds: [], years: [], paymentStatuses: [], educationTypes: [] });
  }

  return (
    <div className="mb-4 flex flex-col gap-3">
      {/* Row 1: search + mobile filters trigger */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('students.filters.searchPlaceholder')}
            className="pl-9"
            aria-label={t('students.filters.searchPlaceholder')}
          />
        </div>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" type="button" className="shrink-0">
                <SlidersHorizontal className="mr-1.5 size-4" aria-hidden />
                {t('students.filters.openMobile')}
                {activeCount > 0 ? (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-medium text-white">
                    {activeCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto -mx-1 px-5">
              <SheetHeader>
                <SheetTitle>{t('students.filters.openMobile')}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <DepartmentFilter
                  value={value.departmentIds}
                  onChange={(next) => onChange({ ...value, departmentIds: next })}
                  treeItems={treeItems}
                  isLoading={isDepartmentsLoading}
                  hint={t('students.filters.departmentsHint')}
                />
                <FilterGroup label={t('students.filters.status')}>
                  <ChipGroup
                    items={ALL_PAYMENT_STATUSES.map((s) => ({
                      id: s,
                      label: t(`students.list.paymentStatus.${s}`),
                    }))}
                    value={value.paymentStatuses}
                    onChange={(next) =>
                      onChange({ ...value, paymentStatuses: next as StudentPaymentStatus[] })
                    }
                  />
                </FilterGroup>
                <FilterGroup label={t('students.filters.year')}>
                  <ChipGroup
                    items={ALL_YEARS.map((y) => ({ id: String(y), label: String(y) }))}
                    value={value.years.map(String)}
                    onChange={(next) =>
                      onChange({ ...value, years: next.map(Number).filter((n) => !Number.isNaN(n)) })
                    }
                  />
                </FilterGroup>
                <FilterGroup label={t('students.filters.educationType')}>
                  <ChipGroup
                    items={ALL_EDU_TYPES.map((e) => ({
                      id: e,
                      label: t(`common.educationType.${e}`),
                    }))}
                    value={value.educationTypes}
                    onChange={(next) =>
                      onChange({ ...value, educationTypes: next as EducationType[] })
                    }
                  />
                </FilterGroup>
                {activeCount > 0 ? (
                  <Button variant="ghost" type="button" onClick={resetAll} className="w-full">
                    <X className="mr-1 size-4" aria-hidden />
                    {t('students.filters.reset')}
                  </Button>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>

      {/* Row 2 (desktop only): each filter group is a vertical "stack" (uppercase
         tracking-wider category label on top, chips/picker below). Matches the mobile
         Sheet's labeled-section structure so the bare-number year chips read clearly
         as "КУРС: 1 2 3 4 5 6" — not random integers stacked inline. */}
      {!isMobile ? (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <FilterStack label={t('students.filters.department')}>
            <DepartmentFilter
              value={value.departmentIds}
              onChange={(next) => onChange({ ...value, departmentIds: next })}
              treeItems={treeItems}
              isLoading={isDepartmentsLoading}
              hint={t('students.filters.departmentsHint')}
              asPopover
            />
          </FilterStack>
          <FilterStack label={t('students.filters.status')}>
            <ChipGroup
              items={ALL_PAYMENT_STATUSES.map((s) => ({
                id: s,
                label: t(`students.list.paymentStatus.${s}`),
              }))}
              value={value.paymentStatuses}
              onChange={(next) =>
                onChange({ ...value, paymentStatuses: next as StudentPaymentStatus[] })
              }
            />
          </FilterStack>
          <FilterStack label={t('students.filters.year')}>
            <ChipGroup
              items={ALL_YEARS.map((y) => ({ id: String(y), label: String(y) }))}
              value={value.years.map(String)}
              onChange={(next) =>
                onChange({ ...value, years: next.map(Number).filter((n) => !Number.isNaN(n)) })
              }
            />
          </FilterStack>
          <FilterStack label={t('students.filters.educationType')}>
            <ChipGroup
              items={ALL_EDU_TYPES.map((e) => ({
                id: e,
                label: t(`common.educationType.${e}`),
              }))}
              value={value.educationTypes}
              onChange={(next) =>
                onChange({ ...value, educationTypes: next as EducationType[] })
              }
            />
          </FilterStack>
          {activeCount > 0 ? (
            <Button variant="ghost" type="button" size="sm" onClick={resetAll}>
              <X className="mr-1 size-4" aria-hidden />
              {t('students.filters.reset')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------- Department filter (Popover wrapper around TreePicker on desktop) ----------

interface DepartmentFilterProps {
  value: string[];
  onChange: (next: string[]) => void;
  treeItems: TreeItem[];
  isLoading?: boolean;
  hint?: string;
  asPopover?: boolean;
}

function DepartmentFilter({
  value,
  onChange,
  treeItems,
  isLoading,
  hint,
  asPopover,
}: DepartmentFilterProps) {
  const { t } = useTranslation();

  if (!asPopover) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {t('students.filters.department')}
        </p>
        <TreePicker
          mode="multi"
          items={treeItems}
          value={value}
          onChange={onChange}
          isLoading={isLoading}
          searchPlaceholder={t('students.filters.searchDepartment')}
          hint={hint}
        />
      </div>
    );
  }

  // The <FilterStack> wraps with an "ОТДЕЛЕНИЕ" label above. Trigger button shows the
  // selected count when non-zero, "Все" otherwise.
  const summary = value.length === 0
    ? t('students.list.paymentStatus.all')
    : t('students.filters.activeCount', { count: value.length });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" type="button" size="sm" className="h-9 min-w-32 justify-between gap-2">
          <span className="truncate text-sm font-medium">{summary}</span>
          <ChevronDown className="size-4 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-3">
        <TreePicker
          mode="multi"
          items={treeItems}
          value={value}
          onChange={onChange}
          isLoading={isLoading}
          searchPlaceholder={t('students.filters.searchDepartment')}
          hint={hint}
          maxHeightClass="max-h-[300px]"
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------- FilterGroup (mobile Sheet label + content) ----------

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

