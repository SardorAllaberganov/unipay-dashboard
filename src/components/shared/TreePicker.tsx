import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

interface Props {
  nodes: TreeNode[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function TreePicker({ nodes, value, onChange, className }: Props) {
  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <div className={cn('space-y-1', className)} role="tree">
      {nodes.map((n) => (
        <TreeNodeRow key={n.id} node={n} depth={0} selected={selected} onToggle={toggle} />
      ))}
    </div>
  );
}

interface RowProps {
  node: TreeNode;
  depth: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
}

function TreeNodeRow({ node, depth, selected, onToggle }: RowProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isChecked = selected.has(node.id);

  return (
    <div role="treeitem" aria-expanded={hasChildren ? open : undefined}>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-surface-2"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Свернуть' : 'Развернуть'}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-5" />
        )}
        <Checkbox
          id={`tree-${node.id}`}
          checked={isChecked}
          onCheckedChange={() => onToggle(node.id)}
        />
        <label htmlFor={`tree-${node.id}`} className="cursor-pointer text-sm">
          {node.label}
        </label>
      </div>
      {hasChildren && open ? (
        <div role="group">
          {node.children!.map((c) => (
            <TreeNodeRow
              key={c.id}
              node={c}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
