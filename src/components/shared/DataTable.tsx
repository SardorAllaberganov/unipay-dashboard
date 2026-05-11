// STYLE_DISCIPLINE.md §0.6 (data tables) + §0.8 (mandatory state coverage).
// Encodes: Title Case headers, table headers never stick, mobile card stack, all 6 states.
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';

// Per-column className hooks (e.g. `w-[1%]` to collapse an actions column to content-width,
// `text-right` for amount columns). `cellColSpan` returns the number of columns a cell should
// span for a given row — subsequent cells are skipped. Read by DataTable below; consumers
// attach via columnDef.meta.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
    cellColSpan?: (row: TData) => number;
  }
}
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

interface RowHrefOptions {
  /** Optional list-state to attach to the navigation (e.g. `{ from: '/staff?role=...' }`)
      so the destination page can compute a back-link target. */
  state?: unknown;
}

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
  /** Optional per-row className (e.g. for status-tinted accent stripes via `before:` pseudo). */
  rowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  /**
   * When provided, each row becomes a clickable link to the resolved href.
   * - Plain click + Enter/Space → navigate via React Router (preserves SPA state).
   * - Cmd/Ctrl/Shift-click or middle-click → open in a new tab via `window.open`.
   * - Per-row label is sourced from `getRowAriaLabel?` for screen readers.
   * Use this instead of `onRowClick` when the destination is a real URL (deep-linkable).
   */
  rowHref?: (row: T) => string;
  /** Optional per-row aria-label for the link semantics. */
  getRowAriaLabel?: (row: T) => string;
  /** Optional list-state passed to React Router on navigation (e.g. `{ from: location }`). */
  getRowNavigateState?: (row: T) => RowHrefOptions['state'];
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
  rowClassName,
  onRowClick,
  rowHref,
  getRowAriaLabel,
  getRowNavigateState,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  /**
   * Unified row activation that respects modifier keys and middle-click.
   * - cmd/ctrl/shift → new tab via window.open (preserves native multi-tab UX)
   * - plain → SPA navigate (carries optional state for back-link)
   * `auxClick` calls this with `forceNewTab = true` for middle-clicks.
   */
  const handleRowActivate = (row: T, mods: { newTab: boolean }) => {
    if (rowHref) {
      const href = rowHref(row);
      if (mods.newTab) {
        window.open(href, '_blank', 'noopener');
        return;
      }
      const state = getRowNavigateState?.(row);
      navigate(href, state !== undefined ? { state } : undefined);
      return;
    }
    if (onRowClick) onRowClick(row);
  };

  const isRowInteractive = !!rowHref || !!onRowClick;

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
            const accent = rowClassName?.(row.original);
            const ariaLabel = getRowAriaLabel?.(row.original);
            return (
              <Card
                key={key}
                className={cn(
                  'relative overflow-hidden p-4',
                  isRowInteractive &&
                    'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1',
                  accent
                )}
                onClick={
                  isRowInteractive
                    ? (e) =>
                        handleRowActivate(row.original, {
                          newTab: e.metaKey || e.ctrlKey || e.shiftKey,
                        })
                    : undefined
                }
                onAuxClick={
                  isRowInteractive
                    ? (e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          handleRowActivate(row.original, { newTab: true });
                        }
                      }
                    : undefined
                }
                role={rowHref ? 'link' : isRowInteractive ? 'button' : undefined}
                aria-label={ariaLabel}
                tabIndex={isRowInteractive ? 0 : undefined}
                onKeyDown={
                  isRowInteractive
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowActivate(row.original, {
                            newTab: e.metaKey || e.ctrlKey,
                          });
                        }
                      }
                    : undefined
                }
              >
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
                    const headerClass = header.column.columnDef.meta?.headerClassName;
                    return (
                      <TableHead key={header.id} className={headerClass}>
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
              {rows.map((row) => {
                const accent = rowClassName?.(row.original);
                const ariaLabel = getRowAriaLabel?.(row.original);
                return (
                  <TableRow
                    key={row.id}
                    style={{ height: 'var(--row-h)' }}
                    className={cn(
                      'relative',
                      isRowInteractive &&
                        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset',
                      accent
                    )}
                    role={rowHref ? 'link' : isRowInteractive ? 'button' : undefined}
                    aria-label={ariaLabel}
                    tabIndex={isRowInteractive ? 0 : undefined}
                    onClick={
                      isRowInteractive
                        ? (e) =>
                            handleRowActivate(row.original, {
                              newTab: e.metaKey || e.ctrlKey || e.shiftKey,
                            })
                        : undefined
                    }
                    onAuxClick={
                      isRowInteractive
                        ? (e) => {
                            if (e.button === 1) {
                              e.preventDefault();
                              handleRowActivate(row.original, { newTab: true });
                            }
                          }
                        : undefined
                    }
                    onKeyDown={
                      isRowInteractive
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleRowActivate(row.original, {
                                newTab: e.metaKey || e.ctrlKey,
                              });
                            }
                          }
                        : undefined
                    }
                  >
                    {(() => {
                      // Per-row colSpan support: when a cell sets meta.cellColSpan(row) > 1,
                      // the next (colSpan - 1) cells are skipped. Lets a consumer merge the
                      // tail cells of a row (e.g. status + actions on pending staff rows).
                      const cells = row.getVisibleCells();
                      const out: ReactNode[] = [];
                      let skip = 0;
                      for (let i = 0; i < cells.length; i++) {
                        if (skip > 0) {
                          skip--;
                          continue;
                        }
                        const cell = cells[i]!;
                        const span =
                          cell.column.columnDef.meta?.cellColSpan?.(row.original) ?? 1;
                        if (span > 1) skip = span - 1;
                        out.push(
                          <TableCell
                            key={cell.id}
                            colSpan={span > 1 ? span : undefined}
                            className={cn('py-2', cell.column.columnDef.meta?.cellClassName)}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>,
                        );
                      }
                      return out;
                    })()}
                  </TableRow>
                );
              })}
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
