import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { DepartmentNode } from '../schemas';

interface Props {
  nodes: DepartmentNode[];
  onChange: (nodes: DepartmentNode[]) => void;
}

function newId(): string {
  return `node-${Math.random().toString(36).slice(2, 10)}`;
}

function updateNode(
  nodes: DepartmentNode[],
  id: string,
  updater: (n: DepartmentNode) => DepartmentNode
): DepartmentNode[] {
  return nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children) return { ...n, children: updateNode(n.children, id, updater) };
    return n;
  });
}

function removeNode(nodes: DepartmentNode[], id: string): DepartmentNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({
      ...n,
      children: n.children ? removeNode(n.children, id) : undefined,
    }));
}

function addChild(
  nodes: DepartmentNode[],
  parentId: string,
  label: string
): DepartmentNode[] {
  return nodes.map((n) => {
    if (n.id === parentId) {
      const child: DepartmentNode = { id: newId(), label };
      return { ...n, children: [...(n.children ?? []), child] };
    }
    if (n.children) return { ...n, children: addChild(n.children, parentId, label) };
    return n;
  });
}

export function DepartmentTreeEditor({ nodes, onChange }: Props) {
  return (
    <div className="space-y-0.5" role="tree">
      {nodes.map((n) => (
        <NodeRow key={n.id} node={n} depth={0} nodes={nodes} onChange={onChange} />
      ))}
    </div>
  );
}

interface RowProps {
  node: DepartmentNode;
  depth: number;
  nodes: DepartmentNode[];
  onChange: (n: DepartmentNode[]) => void;
}

function NodeRow({ node, depth, nodes, onChange }: RowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.label);
  const hasChildren = (node.children ?? []).length > 0;

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onChange(updateNode(nodes, node.id, (n) => ({ ...n, label: trimmed })));
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(node.label);
    setEditing(false);
  };

  return (
    <div role="treeitem" aria-expanded={hasChildren ? open : undefined}>
      <div
        className="flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-muted/40"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex size-5 items-center justify-center text-muted-foreground"
            aria-label={open ? t('common.actions.collapse') : t('common.actions.expand')}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-5" />
        )}
        {editing ? (
          <>
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              className="h-8 max-w-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={commit}
              aria-label={t('common.actions.save')}
            >
              <Check className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={cancel}
              aria-label={t('common.actions.cancel')}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </>
        ) : (
          <>
            <span className="flex-1 truncate text-sm">{node.label}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              aria-label={t('onboarding.departments.rename')}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                onChange(addChild(nodes, node.id, t('onboarding.departments.newChild')))
              }
              aria-label={t('onboarding.departments.addChild')}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(removeNode(nodes, node.id))}
              aria-label={t('onboarding.departments.remove')}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </>
        )}
      </div>
      {hasChildren && open ? (
        <div role="group">
          {(node.children ?? []).map((c) => (
            <NodeRow key={c.id} node={c} depth={depth + 1} nodes={nodes} onChange={onChange} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
