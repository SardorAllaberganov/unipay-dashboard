import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StaffMember } from '@/types/domain';
import {
  staffApi,
  type InviteStaffInput,
  type ListResponse,
  type PatchStaffInput,
} from '../api';
import { STAFF_QUERY_KEY } from './useStaff';
import { staffByIdKey } from './useStaffById';
import { bumpStaffSessionsSync, staffSessionsKey } from './useStaffSessions';

function invalidateAllStaffLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [...STAFF_QUERY_KEY, 'list'] });
}

function patchListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  patcher: (items: StaffMember[]) => StaffMember[]
) {
  const matches = queryClient.getQueriesData<ListResponse<StaffMember>>({
    queryKey: [...STAFF_QUERY_KEY, 'list'],
  });
  for (const [key, prev] of matches) {
    if (!prev) continue;
    queryClient.setQueryData<ListResponse<StaffMember>>(key, {
      ...prev,
      items: patcher(prev.items),
    });
  }
}

function refreshDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  staff: StaffMember
) {
  void queryClient.invalidateQueries({ queryKey: staffByIdKey(staff.id) });
  patchListCaches(queryClient, (items) =>
    items.map((s) => (s.id === staff.id ? staff : s))
  );
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteStaffInput) => staffApi.invite(input),
    onSuccess: (created) => {
      patchListCaches(queryClient, (items) => [created, ...items]);
      invalidateAllStaffLists(queryClient);
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role, reason }: { id: string; role: PatchStaffInput['role']; reason: string }) =>
      staffApi.patch(id, { role, reason }),
    onSuccess: (updated) => refreshDetail(queryClient, updated),
  });
}

export function useUpdateStaffAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, departmentIds }: { id: string; departmentIds: string[] }) =>
      staffApi.patch(id, { departmentIds }),
    onSuccess: (updated) => refreshDetail(queryClient, updated),
  });
}

export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      fullName,
      email,
      phone,
      locale,
      timezone,
    }: {
      id: string;
      fullName?: string;
      email?: string;
      phone?: string;
      locale?: 'ru' | 'uz';
      timezone?: string;
    }) => staffApi.patch(id, { fullName, email, phone, locale, timezone }),
    onSuccess: (updated) => refreshDetail(queryClient, updated),
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      staffApi.deactivate(id, reason),
    onSuccess: (updated) => refreshDetail(queryClient, updated),
  });
}

export function useReactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.reactivate(id),
    onSuccess: (updated) => refreshDetail(queryClient, updated),
  });
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: (id: string) => staffApi.resetPassword(id),
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.resendInvite(id),
    onSuccess: (updated) => refreshDetail(queryClient, updated),
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.cancelInvite(id),
    onSuccess: (_data, id) => {
      patchListCaches(queryClient, (items) => items.filter((s) => s.id !== id));
      queryClient.removeQueries({ queryKey: staffByIdKey(id) });
    },
  });
}

export function useDeleteStaffAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      emailConfirm,
    }: {
      id: string;
      reason: string;
      emailConfirm: string;
    }) => staffApi.deleteAccount(id, reason, emailConfirm),
    onSuccess: (_data, vars) => {
      patchListCaches(queryClient, (items) =>
        items.filter((s) => s.id !== vars.id)
      );
      queryClient.removeQueries({ queryKey: staffByIdKey(vars.id) });
    },
  });
}

export function useTransferOwnership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      confirmPhrase,
    }: {
      id: string;
      reason: string;
      confirmPhrase: string;
    }) => staffApi.transferOwnership(id, reason, confirmPhrase),
    onSuccess: () => {
      // Both the current owner's record and the new owner's record changed —
      // safest to invalidate everything.
      invalidateAllStaffLists(queryClient);
      void queryClient.invalidateQueries({ queryKey: [...STAFF_QUERY_KEY, 'detail'] });
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      sessionId,
      reason,
    }: {
      id: string;
      sessionId: string;
      reason: string;
    }) => staffApi.revokeSession(id, sessionId, reason),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: staffSessionsKey(vars.id) });
      bumpStaffSessionsSync();
    },
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      staffApi.revokeAllOtherSessions(id, reason),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: staffSessionsKey(vars.id) });
      bumpStaffSessionsSync();
    },
  });
}
