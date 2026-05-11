import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDepartments } from '@/features/organization/hooks/useDepartments';
import { cn } from '@/lib/utils';

interface Props {
  departmentIds: string[];
  /** Cap visible chips before "+N more" rolls up. Default 2 per spec. */
  maxVisible?: number;
  className?: string;
}

export function DepartmentsAccessChips({
  departmentIds,
  maxVisible = 2,
  className,
}: Props) {
  const { t } = useTranslation();
  const { data } = useDepartments();

  const labels = useMemo(() => {
    const items = data?.items ?? [];
    const map = new Map(items.map((d) => [d.id, d.name.ru]));
    return departmentIds.map((id) => map.get(id) ?? id);
  }, [data, departmentIds]);

  if (departmentIds.length === 0) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        {t('staff.list.departmentsAccessAll')}
      </span>
    );
  }

  const visible = labels.slice(0, maxVisible);
  const hidden = labels.slice(maxVisible);

  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {visible.map((label) => (
        <span
          key={label}
          className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground"
        >
          <span className="max-w-[140px] truncate">{label}</span>
        </span>
      ))}
      {hidden.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t('staff.list.departmentsMore', { count: hidden.length })}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <ul className="space-y-0.5 text-sm">
              {hidden.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}
