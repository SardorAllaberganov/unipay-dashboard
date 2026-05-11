// Filter group primitives. Two pieces:
//   - <FilterStack> — uppercase tracking-wider label above a chip / picker group. `text-xs`
//     here is §0.2 allow-listed (category 5: definition labels).
//   - <ChipGroup> — multi-select chip toggles using shadcn Toggle. Inactive chips read as
//     pressable buttons (`border-border bg-card text-foreground`), active as
//     `border-brand-600 bg-brand-50 text-brand-700`.
import { useMemo, type ReactNode } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

export function FilterStack({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="inline-flex items-center">{children}</div>
    </div>
  );
}

export interface ChipGroupItem {
  id: string;
  label: string;
}

interface ChipGroupProps {
  items: ChipGroupItem[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

export function ChipGroup({ items, value, onChange, className }: ChipGroupProps) {
  const selectedSet = useMemo(() => new Set(value), [value]);
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {items.map((it) => {
        const selected = selectedSet.has(it.id);
        return (
          <Toggle
            key={it.id}
            size="sm"
            pressed={selected}
            onPressedChange={(pressed) => {
              const next = new Set(value);
              if (pressed) next.add(it.id);
              else next.delete(it.id);
              onChange([...next]);
            }}
            className={cn(
              'h-9 rounded-md border px-3 text-sm font-medium transition-colors',
              selected
                ? 'border-brand-600 bg-brand-50 text-brand-700 data-[state=on]:border-brand-600 data-[state=on]:bg-brand-50 data-[state=on]:text-brand-700'
                : 'border-border bg-card text-foreground hover:bg-muted/40',
            )}
            aria-pressed={selected}
          >
            {it.label}
          </Toggle>
        );
      })}
    </div>
  );
}
