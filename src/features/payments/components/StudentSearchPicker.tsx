// Student search picker — Popover + Command-style search. Calls students list API with
// debounced `search`. Selecting a student calls back with `{ id, label, departmentId, schedules? }`.
import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { studentsApi } from '@/features/students/api';
import type { Student } from '@/types/domain';

interface Props {
  value: Student | null;
  onChange: (next: Student | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StudentSearchPicker({ value, onChange, placeholder, disabled }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 200);
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    studentsApi
      .list({ search: debounced, pageSize: 20 })
      .then((res) => {
        if (!cancelled) setResults(res.items);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  const triggerLabel = useMemo(() => {
    if (!value) return placeholder ?? t('payments.manualEntry.fields.studentPlaceholder');
    return `${value.lastName} ${value.firstName} · ${value.studentId}`;
  }, [value, placeholder, t]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-9 w-full justify-between gap-2 font-normal', !value && 'text-muted-foreground')}
          disabled={disabled}
        >
          <span className="truncate text-left">{triggerLabel}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('payments.manualEntry.fields.studentPlaceholder')}
              className="h-9 pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1 -mx-1 px-1">
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">{t('common.noResults')}</p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((s) => {
                const selected = value?.id === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(s);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
                        selected && 'bg-brand-50 text-brand-700',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{s.lastName} {s.firstName}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {s.studentId}
                        </span>
                      </span>
                      {selected ? (
                        <Check className="size-4 shrink-0 text-brand-700" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
