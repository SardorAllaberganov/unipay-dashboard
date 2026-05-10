import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  value: string | Date;
  format?: 'date' | 'datetime' | 'relative';
  tooltip?: boolean;
  className?: string;
}

export function DateDisplay({ value, format = 'date', tooltip, className }: Props) {
  const text =
    format === 'date'
      ? formatDate(value)
      : format === 'datetime'
        ? formatDateTime(value)
        : formatRelative(value);

  const span = <span className={cn('tabular whitespace-nowrap', className)}>{text}</span>;

  if (!tooltip) return span;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{span}</TooltipTrigger>
        <TooltipContent>{formatDateTime(value)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
