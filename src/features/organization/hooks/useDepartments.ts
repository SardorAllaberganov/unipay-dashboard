import { useQuery } from '@tanstack/react-query';
import type { Department } from '@/types/domain';
import { organizationApi } from '../api';

export const DEPARTMENTS_QUERY_KEY = ['organization', 'departments'] as const;

export interface DepartmentTreeNode {
  department: Department;
  children: DepartmentTreeNode[];
}

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: organizationApi.listDepartments,
  });
}

export function buildTree(items: Department[]): DepartmentTreeNode[] {
  const byId = new Map<string, DepartmentTreeNode>();
  for (const d of items) byId.set(d.id, { department: d, children: [] });
  const roots: DepartmentTreeNode[] = [];
  for (const d of items) {
    const node = byId.get(d.id);
    if (!node) continue;
    if (d.parentId === null) {
      roots.push(node);
    } else {
      const parent = byId.get(d.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }
  return roots;
}

export function descendantIds(items: Department[], rootId: string): Set<string> {
  const out = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of items) {
      if (d.parentId && out.has(d.parentId) && !out.has(d.id)) {
        out.add(d.id);
        grew = true;
      }
    }
  }
  return out;
}
