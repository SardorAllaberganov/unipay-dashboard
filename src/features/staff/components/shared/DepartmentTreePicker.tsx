import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  buildTree,
  descendantIds,
  useDepartments,
  type DepartmentTreeNode,
} from '@/features/organization/hooks/useDepartments';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

export function DepartmentTreePicker({ value, onChange, className }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useDepartments();
  const items = useMemo(() => data?.items ?? [], [data]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const tree = useMemo(() => buildTree(items), [items]);
  const selected = useMemo(() => new Set(value), [value]);

  const matchIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    const hits = new Set<string>();
    for (const d of items) {
      const nameRu = d.name.ru?.toLowerCase() ?? '';
      const nameUz = d.name.uz?.toLowerCase() ?? '';
      if (nameRu.includes(q) || nameUz.includes(q)) hits.add(d.id);
    }
    // include ancestors of every hit so they remain visible
    const expand = new Set<string>();
    for (const id of hits) {
      const item = items.find((i) => i.id === id);
      let pid = item?.parentId ?? null;
      while (pid) {
        expand.add(pid);
        const parent = items.find((i) => i.id === pid);
        pid = parent?.parentId ?? null;
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

  const toggleSelect = (nodeId: string) => {
    const subtree = descendantIds(items, nodeId);
    const allSelected = [...subtree].every((id) => selected.has(id));
    const next = new Set(selected);
    if (allSelected) {
      for (const id of subtree) next.delete(id);
    } else {
      for (const id of subtree) next.add(id);
    }
    onChange([...next]);
  };

  const isExpanded = (id: string): boolean => {
    if (expanded.has(id)) return true;
    if (matchIds && matchIds.expand.has(id)) return true;
    return false;
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
          placeholder={t('staff.editAccess.searchPlaceholder')}
          className="pl-9"
          aria-label={t('staff.editAccess.searchPlaceholder')}
        />
      </div>
      <p className="text-sm text-muted-foreground">{t('staff.invite.departmentsHint')}</p>
      <div className="-mx-1 max-h-[40vh] overflow-y-auto rounded-md border border-border px-1 py-1">
        {tree.map((node) => (
          <TreeRow
            key={node.department.id}
            node={node}
            depth={0}
            selected={selected}
            toggleSelect={toggleSelect}
            toggleExpand={toggleExpand}
            isExpanded={isExpanded}
            matchHits={matchIds?.hits ?? null}
          />
        ))}
      </div>
    </div>
  );
}

interface RowProps {
  node: DepartmentTreeNode;
  depth: number;
  selected: Set<string>;
  toggleSelect: (id: string) => void;
  toggleExpand: (id: string) => void;
  isExpanded: (id: string) => boolean;
  matchHits: Set<string> | null;
}

function TreeRow({
  node,
  depth,
  selected,
  toggleSelect,
  toggleExpand,
  isExpanded,
  matchHits,
}: RowProps) {
  const hasChildren = node.children.length > 0;
  const open = isExpanded(node.department.id);
  const checked = selected.has(node.department.id);
  // Visible only if it matches search OR an ancestor expanded chain includes it.
  if (matchHits) {
    const ancestorOpen = open;
    if (!matchHits.has(node.department.id) && !ancestorOpen) return null;
  }

  return (
    <div>
      <div
        className="group/row flex h-9 items-center gap-1 rounded-md px-1 hover:bg-muted/40"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleExpand(node.department.id)}
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="inline-block w-6" aria-hidden />
        )}

        <label className="flex flex-1 items-center gap-2 truncate text-sm">
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggleSelect(node.department.id)}
            aria-label={node.department.name.ru}
          />
          <span className="truncate">{node.department.name.ru}</span>
        </label>
      </div>

      {open && hasChildren ? (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.department.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              toggleSelect={toggleSelect}
              toggleExpand={toggleExpand}
              isExpanded={isExpanded}
              matchHits={matchHits}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
