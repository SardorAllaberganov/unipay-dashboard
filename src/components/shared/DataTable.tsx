// STYLE_DISCIPLINE.md §0.6 (data tables) + §0.8 (mandatory state coverage).
// Encodes: Title Case headers, table headers never stick, mobile card stack, all 6 states.
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  /** When provided, renders a "Rows per page" Select. */
  onPageSizeChange?: (pageSize: number) => void;
  /** Options for the page-size Select. Default: [25, 50, 100]. */
  pageSizeOptions?: number[];
}

function buildPageList(current: number, last: number): (number | 'ellipsis-left' | 'ellipsis-right')[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [1];
  if (current > 3) pages.push('ellipsis-left');
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < last - 2) pages.push('ellipsis-right');
  pages.push(last);
  return pages;
}

interface PartialMeta {
  shown: number;
  total: number;
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** When true, the inner shell (border / radius / bg) is stripped so a parent surface owns the chrome. */
  bare?: boolean;
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
  bare = false,
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
        <>
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
        {pagination ? (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <DataTablePagination {...pagination} />
          </div>
        ) : null}
        </>
      ) : (
        <div
          className={cn(
            'overflow-hidden',
            !bare && 'rounded-lg border border-border bg-card',
          )}
        >
          {/* Table + pagination share the same bordered shell. The pagination's top border
              supplies the divider between the last table row and the controls. */}
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
          {pagination ? (
            <div className="border-t border-border">
              <DataTablePagination {...pagination} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}: PaginationProps) {
  const { t } = useTranslation();
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const pages = buildPageList(page, lastPage);

  const handlePageClick = (n: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (n !== page) onPageChange(n);
  };

  return (
    <div className="flex flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
      {/* Row 1 (mobile): "Showing X-Y of Z" left + "Rows per page [50]" right, space-between.
          Desktop: same elements but grouped left, gap-x-4. */}
      <div className="flex items-center justify-between gap-3 sm:flex-wrap sm:justify-start sm:gap-x-4 sm:gap-y-2">
        <p className="whitespace-nowrap text-sm tabular text-muted-foreground">
          {t('common.pagination.showing', { from: start, to: end, total })}
        </p>
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <label
              htmlFor="page-size-select"
              className="whitespace-nowrap text-sm text-muted-foreground"
            >
              {t('common.pagination.rowsPerPage')}
            </label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger id="page-size-select" className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {/* Row 2 (mobile): pagination centered. Desktop: right-aligned. */}
      <Pagination className="mx-0 w-auto justify-center sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-label={t('common.pagination.prev')}
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) onPageChange(page - 1);
              }}
              aria-disabled={page <= 1}
              className={cn(
                'cursor-pointer',
                page <= 1 && 'pointer-events-none opacity-50',
              )}
            >
              <span>{t('common.pagination.prev')}</span>
            </PaginationPrevious>
          </PaginationItem>
          {pages.map((p, i) => {
            if (p === 'ellipsis-left' || p === 'ellipsis-right') {
              return (
                <PaginationItem key={`${p}-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  aria-label={t('common.pagination.goToPage', { page: p })}
                  onClick={handlePageClick(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              aria-label={t('common.pagination.next')}
              onClick={(e) => {
                e.preventDefault();
                if (page < lastPage) onPageChange(page + 1);
              }}
              aria-disabled={page >= lastPage}
              className={cn(
                'cursor-pointer',
                page >= lastPage && 'pointer-events-none opacity-50',
              )}
            >
              <span>{t('common.pagination.next')}</span>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
