import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Department } from '@/types/domain';
import { organizationApi, type ListResponse } from '../api';
import { DEPARTMENTS_QUERY_KEY } from './useDepartments';

type Patch<T> = (prev: ListResponse<T> | undefined) => ListResponse<T>;

export function useDepartmentMutations() {
  const queryClient = useQueryClient();

  const patchCache = (fn: Patch<Department>) =>
    queryClient.setQueryData<ListResponse<Department>>(DEPARTMENTS_QUERY_KEY, (prev) => fn(prev));

  const create = useMutation({
    mutationFn: (input: Partial<Department>) => organizationApi.createDepartment(input),
    onSuccess: (created) => {
      patchCache((prev) => ({
        items: [...(prev?.items ?? []), created],
        _meta: prev?._meta,
      }));
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Department> }) =>
      organizationApi.updateDepartment(id, patch),
    onSuccess: (updated) => {
      patchCache((prev) => ({
        items: (prev?.items ?? []).map((d) => (d.id === updated.id ? updated : d)),
        _meta: prev?._meta,
      }));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => organizationApi.deleteDepartment(id),
    onSuccess: ({ deletedIds }) => {
      const deleted = new Set(deletedIds);
      patchCache((prev) => ({
        items: (prev?.items ?? []).filter((d) => !deleted.has(d.id)),
        _meta: prev?._meta,
      }));
    },
  });

  const move = useMutation({
    mutationFn: ({ id, newParentId }: { id: string; newParentId: string | null }) =>
      organizationApi.moveDepartment(id, newParentId),
    onSuccess: (updated) => {
      patchCache((prev) => ({
        items: (prev?.items ?? []).map((d) => (d.id === updated.id ? updated : d)),
        _meta: prev?._meta,
      }));
    },
  });

  return { create, update, remove, move };
}
