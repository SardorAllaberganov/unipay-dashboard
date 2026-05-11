import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Folder,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';
import type { Department, DepartmentType } from '@/types/domain';
import type { DepartmentTreeNode } from '../hooks/useDepartments';

const TYPE_ICONS: Record<DepartmentType, LucideIcon> = {
  faculty: GraduationCap,
  department: Layers,
  class: BookOpen,
  group: Users,
  other: Folder,
};

interface Props {
  node: DepartmentTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (dept: Department) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  bannedDropIds: Set<string>;
}

export function DepartmentNode(props: Props) {
  const {
    node,
    depth,
    expanded,
    onToggle,
    selectedId,
    onSelect,
    onAddChild,
    onEdit,
    onDelete,
    bannedDropIds,
  } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const dept = node.department;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(dept.id);
  const isSelected = selectedId === dept.id;
  const isDropBanned = bannedDropIds.has(dept.id);
  const Icon = TYPE_ICONS[dept.type];
  const indentPerLevel = isMobile ? 12 : 16;

  const draggable = useDraggable({ id: dept.id });
  const droppable = useDroppable({ id: dept.id, disabled: isDropBanned });
  const isOver = droppable.isOver && !isDropBanned;

  // No transform on the source row — `<DragOverlay>` in the parent renders the floating snapshot
  // following the cursor. Translating the source as well caused the row to look "gone" from its
  // tree slot during drag. We keep the slot in place at reduced opacity for visual continuity.
  const style: React.CSSProperties = {
    opacity: draggable.isDragging ? 0.4 : 1,
  };

  return (
    <li>
      <div
        ref={(el) => {
          draggable.setNodeRef(el);
          droppable.setNodeRef(el);
        }}
        style={style}
        {...draggable.attributes}
        {...draggable.listeners}
        className={cn(
          'group/row flex items-center gap-1 rounded-md pr-1 text-sm leading-none transition-colors',
          'h-11 md:h-10',
          draggable.isDragging ? 'cursor-grabbing' : 'cursor-grab',
          isSelected && 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
          !isSelected && 'hover:bg-muted/60',
          isOver && 'ring-2 ring-brand-600 ring-offset-1',
          isDropBanned && draggable.isDragging && 'cursor-not-allowed'
        )}
      >
        <div style={{ paddingLeft: `${depth * indentPerLevel}px` }} className="shrink-0" />
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 md:size-7"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(dept.id);
            }}
            aria-label={isOpen ? t('common.actions.collapse') : t('common.actions.expand')}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
          </Button>
        ) : (
          <span className="size-9 shrink-0 md:size-7" />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(dept);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate font-medium">{dept.name.ru}</span>
          <span className="tabular text-sm text-muted-foreground">
            {dept.studentCount}
          </span>
        </button>

        <div className="hidden shrink-0 items-center gap-0.5 transition-opacity md:flex md:opacity-0 md:group-hover/row:opacity-100 md:focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(dept);
            }}
            aria-label={t('common.actions.edit')}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(dept.id);
            }}
            aria-label={t('organization.departments.addChildAria')}
          >
            <Plus className="size-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-danger-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dept);
            }}
            aria-label={t('common.actions.delete')}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {hasChildren && isOpen ? (
        <ul role="group">
          {node.children.map((child) => (
            <DepartmentNode
              key={child.department.id}
              {...props}
              node={child}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Static, non-interactive snapshot of a department row used inside `<DragOverlay>`.
 * Keep this layout in sync with the live row above so the overlay matches what the user grabbed.
 */
export function DepartmentNodePreview({ dept }: { dept: Department }) {
  const Icon = TYPE_ICONS[dept.type];
  return (
    <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm shadow-md ring-1 ring-brand-600/30">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate font-medium">{dept.name.ru}</span>
      <span className="tabular text-sm text-muted-foreground">{dept.studentCount}</span>
    </div>
  );
}
