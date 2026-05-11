import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Flat tree item. `parentId === null` marks a root node; otherwise links to a parent
 * in the same array. `meta` is consumer-defined extra context surfaced to `renderMeta`.
 */
export interface TreeItem<TMeta = unknown> {
  id: string;
  parentId: string | null;
  label: string;
  disabled?: boolean;
  meta?: TMeta;
}

interface InternalNode<TMeta> {
  item: TreeItem<TMeta>;
  children: InternalNode<TMeta>[];
}

interface BaseProps<TMeta> {
  items: TreeItem<TMeta>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  hint?: string;
  /** Renders trailing meta on each row (e.g. student count chip). */
  renderMeta?: (item: TreeItem<TMeta>) => ReactNode;
  /** Restricts selection (single mode) or check (multi mode) to leaf nodes only. */
  leafOnly?: boolean;
  className?: string;
  /** Max height of the scroll list. */
  maxHeightClass?: string;
}

interface SingleProps<TMeta> extends BaseProps<TMeta> {
  mode: 'single';
  value: string | null;
  onChange: (next: string | null) => void;
}

interface MultiProps<TMeta> extends BaseProps<TMeta> {
  mode: 'multi';
  value: string[];
  onChange: (next: string[]) => void;
  /**
   * When true (default), checking a parent toggles its full subtree. When false, each
   * node's checkbox toggles only itself.
   */
  subtreeToggle?: boolean;
}

export type TreePickerProps<TMeta = unknown> = SingleProps<TMeta> | MultiProps<TMeta>;

function buildTree<TMeta>(items: TreeItem<TMeta>[]): InternalNode<TMeta>[] {
  const map = new Map<string, InternalNode<TMeta>>();
  for (const item of items) map.set(item.id, { item, children: [] });
  const roots: InternalNode<TMeta>[] = [];
  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function descendantIds<TMeta>(items: TreeItem<TMeta>[], rootId: string): Set<string> {
  const out = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const item of items) {
      if (item.parentId && out.has(item.parentId) && !out.has(item.id)) {
        out.add(item.id);
        added = true;
      }
    }
  }
  return out;
}

/**
 * Generic department / category tree picker used across the app (filters, Add Student,
 * Apply Template, Change Department). Multi mode supports subtree-toggle; single mode
 * supports `leafOnly` for cases that require a terminal selection (e.g. an Add-Student
 * group-leaf where year + group are derived from the path).
 */
export function TreePicker<TMeta = unknown>(props: TreePickerProps<TMeta>) {
  const { t } = useTranslation();
  const {
    items,
    isLoading,
    searchPlaceholder,
    hint,
    renderMeta,
    leafOnly,
    className,
    maxHeightClass = 'max-h-[40vh]',
  } = props;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const tree = useMemo(() => buildTree(items), [items]);
  const multiValueKey = props.mode === 'multi' ? props.value.join('|') : '';
  const selectedSet = useMemo(
    () => (props.mode === 'multi' ? new Set(props.value) : new Set<string>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.mode, multiValueKey],
  );

  const matchIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    const hits = new Set<string>();
    for (const it of items) {
      if (it.label.toLowerCase().includes(q)) hits.add(it.id);
    }
    // Expand ancestors of every hit so the match stays visible.
    const expand = new Set<string>();
    const byId = new Map(items.map((it) => [it.id, it]));
    for (const id of hits) {
      let pid = byId.get(id)?.parentId ?? null;
      while (pid) {
        expand.add(pid);
        pid = byId.get(pid)?.parentId ?? null;
      }
    }
    return { hits, expand };
  }, [items, search]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string): boolean => {
    if (expanded.has(id)) return true;
    if (matchIds && matchIds.expand.has(id)) return true;
    return false;
  };

  const handleMultiCheck = (id: string) => {
    if (props.mode !== 'multi') return;
    const subtreeToggle = props.subtreeToggle ?? true;
    const ids = subtreeToggle ? descendantIds(items, id) : new Set<string>([id]);
    const next = new Set(props.value);
    const allSelected = [...ids].every((iid) => next.has(iid));
    if (allSelected) for (const iid of ids) next.delete(iid);
    else for (const iid of ids) next.add(iid);
    props.onChange([...next]);
  };

  const handleSingleSelect = (id: string, isLeaf: boolean) => {
    if (props.mode !== 'single') return;
    if (leafOnly && !isLeaf) return;
    props.onChange(props.value === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder ?? t('common.actions.search')}
          className="pl-9"
          aria-label={searchPlaceholder ?? t('common.actions.search')}
        />
      </div>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      <div
        className={cn(
          '-mx-1 overflow-y-auto rounded-md border border-border px-1 py-1',
          maxHeightClass,
        )}
      >
        {tree.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('common.states.noData')}
          </p>
        ) : (
          tree.map((node) => (
            <TreePickerRow
              key={node.item.id}
              node={node}
              depth={0}
              mode={props.mode}
              selectedSet={selectedSet}
              singleValue={props.mode === 'single' ? props.value : null}
              isExpanded={isExpanded}
              toggleExpand={toggleExpand}
              onMultiCheck={handleMultiCheck}
              onSingleSelect={handleSingleSelect}
              matchHits={matchIds?.hits ?? null}
              leafOnly={!!leafOnly}
              renderMeta={renderMeta}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface RowProps<TMeta> {
  node: InternalNode<TMeta>;
  depth: number;
  mode: 'single' | 'multi';
  selectedSet: Set<string>;
  singleValue: string | null;
  isExpanded: (id: string) => boolean;
  toggleExpand: (id: string) => void;
  onMultiCheck: (id: string) => void;
  onSingleSelect: (id: string, isLeaf: boolean) => void;
  matchHits: Set<string> | null;
  leafOnly: boolean;
  renderMeta?: (item: TreeItem<TMeta>) => ReactNode;
}

function TreePickerRow<TMeta>(props: RowProps<TMeta>) {
  const {
    node,
    depth,
    mode,
    selectedSet,
    singleValue,
    isExpanded,
    toggleExpand,
    onMultiCheck,
    onSingleSelect,
    matchHits,
    leafOnly,
    renderMeta,
  } = props;
  const item = node.item;
  const hasChildren = node.children.length > 0;
  const open = isExpanded(item.id);
  const checked = mode === 'multi' ? selectedSet.has(item.id) : singleValue === item.id;
  const disabled = !!item.disabled || (mode === 'single' && leafOnly && hasChildren);

  if (matchHits && !matchHits.has(item.id) && !open) return null;

  const rowClass = cn(
    'group/row flex h-9 items-center gap-1 rounded-md px-1',
    mode === 'single' && checked
      ? 'bg-brand-50 text-brand-700 hover:bg-brand-50'
      : 'hover:bg-muted/40',
  );

  return (
    <div>
      <div className={rowClass} style={{ paddingLeft: `${depth * 16 + 4}px` }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleExpand(item.id)}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="inline-block w-6" aria-hidden />
        )}

        {mode === 'multi' ? (
          <label className="flex flex-1 items-center gap-2 truncate text-sm">
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={() => onMultiCheck(item.id)}
              aria-label={item.label}
            />
            <span className="truncate">{item.label}</span>
            {renderMeta ? (
              <span className="ml-auto pl-2">{renderMeta(item)}</span>
            ) : null}
          </label>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSingleSelect(item.id, !hasChildren)}
            className={cn(
              'flex h-9 flex-1 items-center gap-2 truncate rounded-md px-1 text-left text-sm',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
            aria-pressed={checked}
          >
            <span className="truncate">{item.label}</span>
            {renderMeta ? (
              <span className="ml-auto pl-2">{renderMeta(item)}</span>
            ) : null}
          </button>
        )}
      </div>

      {open && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <TreePickerRow
              key={child.item.id}
              node={child}
              depth={depth + 1}
              mode={mode}
              selectedSet={selectedSet}
              singleValue={singleValue}
              isExpanded={isExpanded}
              toggleExpand={toggleExpand}
              onMultiCheck={onMultiCheck}
              onSingleSelect={onSingleSelect}
              matchHits={matchHits}
              leafOnly={leafOnly}
              renderMeta={renderMeta}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
