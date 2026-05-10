import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { WriteButton } from '@/components/unipay/WriteButton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useNetworkState } from '@/hooks/useNetworkState';
import {
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
  PanelPartialNote,
} from '@/features/dashboard/components/PanelStates';
import type { Department } from '@/types/domain';
import {
  buildTree,
  descendantIds,
  useDepartments,
  type DepartmentTreeNode,
} from '../hooks/useDepartments';
import { useDepartmentMutations } from '../hooks/useDepartmentMutations';
import { DepartmentNode } from './DepartmentNode';
import { cn } from '@/lib/utils';

interface Props {
  selectedId: string | null;
  onSelect: (dept: Department | null) => void;
  onAdd: (parentId: string | null) => void;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

const ROOT_DROP_ID = '__root__';
const AFFECTED_THRESHOLD = 50;

export function DepartmentTree({
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const online = useNetworkState();
  const query = useDepartments();
  const { move } = useDepartmentMutations();
  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    department: Department;
    newParentId: string | null;
    newParentName: string;
    affected: number;
  } | null>(null);

  // Touch scroll vs drag: delay-based activation lets the user scroll the list freely;
  // a 250ms press starts a drag. Same constraint works fine for mouse pointers.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  // Debounce search input.
  useEffect(() => {
    const handle = setTimeout(() => setSearch(rawSearch.trim().toLowerCase()), 200);
    return () => clearTimeout(handle);
  }, [rawSearch]);

  const items = useMemo(() => query.data?.items ?? [], [query.data]);

  const tree = useMemo(() => buildTree(items), [items]);

  // Compute visible IDs when search is active. Any node whose name matches, plus all ancestors.
  const visibleIds = useMemo(() => {
    if (!search) return null;
    const matched = new Set<string>();
    for (const d of items) {
      const haystack = `${d.name.ru ?? ''} ${d.name.uz ?? ''}`.toLowerCase();
      if (haystack.includes(search)) matched.add(d.id);
    }
    const ancestors = new Set<string>();
    const byId = new Map(items.map((d) => [d.id, d]));
    for (const id of matched) {
      let cursor = byId.get(id);
      while (cursor && cursor.parentId) {
        ancestors.add(cursor.parentId);
        cursor = byId.get(cursor.parentId);
      }
    }
    return new Set([...matched, ...ancestors]);
  }, [items, search]);

  // When search activates, auto-expand all ancestors of matches.
  useEffect(() => {
    if (visibleIds) {
      setExpanded(new Set(visibleIds));
    }
  }, [visibleIds]);

  const filteredTree = useMemo(() => {
    if (!visibleIds) return tree;
    function prune(nodes: DepartmentTreeNode[]): DepartmentTreeNode[] {
      const out: DepartmentTreeNode[] = [];
      for (const n of nodes) {
        if (!visibleIds!.has(n.department.id)) continue;
        out.push({ department: n.department, children: prune(n.children) });
      }
      return out;
    }
    return prune(tree);
  }, [tree, visibleIds]);

  const bannedDropIds = useMemo(() => {
    if (!draggingId) return new Set<string>();
    return descendantIds(items, draggingId);
  }, [draggingId, items]);

  const rootDroppable = useDroppable({
    id: ROOT_DROP_ID,
    disabled: !draggingId,
  });

  const onToggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const dragged = event.active.id;
    const over = event.over?.id;
    setDraggingId(null);
    if (!over || dragged === over) return;
    const draggedDept = items.find((d) => d.id === dragged);
    if (!draggedDept) return;
    if (bannedDropIds.has(String(over))) return;

    const newParentId = over === ROOT_DROP_ID ? null : String(over);
    if (draggedDept.parentId === newParentId) return;

    const newParent =
      newParentId === null ? null : items.find((d) => d.id === newParentId);
    const newParentName =
      newParent === null
        ? t('organization.departments.rootLabel')
        : newParent?.name.ru ?? '';

    setPendingMove({
      department: draggedDept,
      newParentId,
      newParentName,
      affected: draggedDept.studentCount,
    });
  };

  const onConfirmMove = async () => {
    if (!pendingMove) return;
    try {
      await move.mutateAsync({
        id: pendingMove.department.id,
        newParentId: pendingMove.newParentId,
      });
      toast.success(t('organization.departments.movedToast'));
      setPendingMove(null);
    } catch {
      toast.error(t('organization.departments.moveErrorToast'));
    }
  };

  // ----- 6 states -----
  if (query.isPending) {
    return <TreeSkeleton />;
  }
  if (query.isError && !query.data) {
    if (!online) return <PanelOfflineState />;
    return <PanelErrorState onRetry={() => query.refetch()} />;
  }
  if (!query.data) {
    return <PanelOfflineState />;
  }
  if (filteredTree.length === 0 && !search) {
    return (
      <EmptyState
        title={t('organization.departments.emptyTitle')}
        description={t('organization.departments.emptyBody')}
        primaryAction={{
          label: t('organization.departments.addCta'),
          onClick: () => onAdd(null),
        }}
      />
    );
  }

  const meta = query.data._meta;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder={t('organization.departments.searchPlaceholder')}
            className="pl-9"
            aria-label={t('common.actions.search')}
          />
        </div>
        <WriteButton
          size="sm"
          onClick={() => onAdd(null)}
          aria-label={t('organization.departments.addCta')}
          className="shrink-0"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden md:inline">{t('organization.departments.addCta')}</span>
        </WriteButton>
      </div>

      {!online ? <PanelOfflineNote /> : null}
      {meta?.partial ? (
        <PanelPartialNote shown={meta.shown ?? 0} total={meta.total ?? 0} />
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event) => setDraggingId(String(event.active.id))}
        onDragCancel={() => setDraggingId(null)}
        onDragEnd={onDragEnd}
      >
        {draggingId ? (
          <div
            ref={rootDroppable.setNodeRef}
            className={cn(
              'rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-colors',
              rootDroppable.isOver && 'border-brand-600 bg-brand-50 text-brand-700'
            )}
          >
            {t('organization.departments.rootDropHint')}
          </div>
        ) : null}

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto">
          {filteredTree.length === 0 && search ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t('organization.departments.searchNoResults')}
            </p>
          ) : (
            <ul role="tree" className="space-y-0.5">
              {filteredTree.map((node) => (
                <DepartmentNode
                  key={node.department.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={onToggle}
                  selectedId={selectedId}
                  onSelect={(d) => onSelect(d)}
                  onAddChild={(parentId) => onAdd(parentId)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  bannedDropIds={bannedDropIds}
                />
              ))}
            </ul>
          )}
        </div>
      </DndContext>

      {pendingMove ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setPendingMove(null)}
          title={t('organization.departments.moveTitle')}
          description={t('organization.departments.moveBody', {
            dept: pendingMove.department.name.ru,
            parent: pendingMove.newParentName,
            count: pendingMove.affected,
          })}
          requireReason={pendingMove.affected > AFFECTED_THRESHOLD}
          loading={move.isPending}
          onConfirm={onConfirmMove}
          confirmLabel={t('organization.departments.moveConfirmCta')}
        />
      ) : null}
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-9 w-full rounded-md" />
      ))}
    </div>
  );
}
