// STYLE_DISCIPLINE.md §0.6 (data tables) + §0.8 (mandatory state coverage).
// Encodes: Title Case headers, table headers never stick, mobile card stack, all 6 states.
import { useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';
import { LoadingTable } from './LoadingTable';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { OfflineState } from './OfflineState';
import { PartialBanner } from './PartialBanner';

// All 6 states managed here: loading / empty / error / offline / partial / data — §0.8.
export type DataTableState = 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface PartialMeta {
  shown: number;
  total: number;
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  state?: DataTableState;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: { label: string; onClick: () => void };
  partial?: PartialMeta;
  pagination?: PaginationProps;
  mobileCardRender?: (row: T) => ReactNode;
  rowKey?: (row: T) => string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  state = 'data',
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  partial,
  pagination,
  mobileCardRender,
  rowKey,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMobile = useIsMobile();

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (state === 'loading') return <LoadingTable className={className} />;
  if (state === 'error')
    return <ErrorState onRetry={onRetry} className={className} />;
  if (state === 'offline')
    return <OfflineState className={className} />;
  if (state === 'empty')
    return (
      <EmptyState
        title={emptyTitle ?? 'Нет данных'}
        description={emptyDescription}
        primaryAction={emptyAction}
        className={className}
      />
    );

  const rows = table.getRowModel().rows;

  return (
    <div className={cn('space-y-3', className)}>
      {state === 'partial' && partial ? <PartialBanner shown={partial.shown} total={partial.total} /> : null}

      {isMobile && mobileCardRender ? (
        <div className="space-y-3">
          {rows.map((row, idx) => {
            const key = rowKey ? rowKey(row.original) : `row-${idx}`;
            return (
              <Card key={key} className="p-4">
                {mobileCardRender(row.original)}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/20">
                  {hg.headers.map((header) => {
                    const sortable = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    return (
                      <TableHead key={header.id}>
                        {sortable ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDir === 'asc' ? (
                              <ArrowUp className="size-4" aria-label="Сортировка по возрастанию" />
                            ) : sortDir === 'desc' ? (
                              <ArrowDown className="size-4" aria-label="Сортировка по убыванию" />
                            ) : (
                              <ArrowUpDown className="size-4 opacity-50" aria-hidden />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} style={{ height: 'var(--row-h)' }}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination ? <DataTablePagination {...pagination} /> : null}
    </div>
  );
}

function DataTablePagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground tabular">
        Показано {start}–{end} из {total}
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Назад
        </Button>
        <span className="text-sm text-muted-foreground tabular">
          {page} / {lastPage}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Далее
        </Button>
      </div>
    </div>
  );
}
