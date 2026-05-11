import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  MeasuringStrategy,
  closestCenter,
  defaultDropAnimationSideEffects,
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
} from '@/components/shared/PanelStates';
import type { Department } from '@/types/domain';
import {
  buildTree,
  descendantIds,
  useDepartments,
  type DepartmentTreeNode,
} from '../hooks/useDepartments';
import { useDepartmentMutations } from '../hooks/useDepartmentMutations';
import { DepartmentNode, DepartmentNodePreview } from './DepartmentNode';
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

  // Split sensors so desktop and touch each get the right activation:
  //  - Mouse: tiny distance threshold so drag starts almost immediately on press+move
  //    (no perceptible delay). 4px filters accidental clicks.
  //  - Touch: 250ms delay + 8px tolerance so a finger scroll wins by default and an
  //    intentional long-press starts the drag (see LESSONS.md 2026-05-11).
  // Using PointerSensor for both was making desktop drags feel like "nothing happens"
  // because the 250ms delay ate quick mouse drags.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
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

  const draggedDept = useMemo(
    () => (draggingId ? items.find((d) => d.id === draggingId) ?? null : null),
    [draggingId, items]
  );

  // Always-enabled droppable so the rect is measured at drag activation.
  // Previously this was `disabled: !draggingId` + a conditionally-rendered banner — but the
  // banner element didn't exist until drag started, so @dnd-kit had nothing to measure and
  // drop-on-root silently failed.
  const rootDroppable = useDroppable({ id: ROOT_DROP_ID });

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
        collisionDetection={closestCenter}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={(event) => setDraggingId(String(event.active.id))}
        onDragCancel={() => setDraggingId(null)}
        onDragEnd={onDragEnd}
      >
        {/* Tree scroll area is `relative` so the root drop banner can absolutely-position
           over the top without taking layout space — zero shift when a drag begins. */}
        <div className="relative -mx-1 min-h-0 flex-1">
          {/* Root drop zone — ALWAYS in the DOM (so its rect is measured at drag start),
             absolutely positioned over the top of the scroll area (so the tree below it
             doesn't shift), and faded in only when a drag is active. */}
          <div
            ref={rootDroppable.setNodeRef}
            aria-hidden={!draggingId}
            className={cn(
              'absolute inset-x-1 top-0 z-10 flex h-9 items-center rounded-md border border-dashed px-3 text-sm shadow-sm transition-opacity duration-200',
              draggingId
                ? rootDroppable.isOver
                  ? 'border-brand-600 bg-brand-50 text-brand-700 opacity-100'
                  : 'border-border bg-card text-muted-foreground opacity-100'
                : 'pointer-events-none border-transparent opacity-0'
            )}
          >
            {t('organization.departments.rootDropHint')}
          </div>

          <div className="h-full overflow-y-auto px-1">
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
        </div>

        {/* Portal the overlay to <body> so it floats above the scroll <main> and any
           stacking context inside the page. zIndex 40 stays *below* Radix Dialog (z-50)
           so the post-drop ConfirmDialog renders on top of the still-fading overlay. */}
        {typeof document !== 'undefined'
          ? createPortal(
              <DragOverlay
                zIndex={40}
                dropAnimation={{
                  duration: 180,
                  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.4' } },
                  }),
                }}
              >
                {draggedDept ? <DepartmentNodePreview dept={draggedDept} /> : null}
              </DragOverlay>,
              document.body
            )
          : null}
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
