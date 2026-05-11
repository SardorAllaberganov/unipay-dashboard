import type {
  Role,
  StaffActivityEntry,
  StaffMember,
  StaffPermissionMatrix,
  StaffSession,
  StaffStatus,
} from '@/types/domain';

interface ApiResponse<T> {
  data: T;
}

export interface ResponseMeta {
  partial?: boolean;
  shown?: number;
  total?: number;
}

export interface ListResponse<T> {
  items: T[];
  _meta?: ResponseMeta;
  page?: number;
  pageSize?: number;
  total?: number;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request_failed:${res.status}`);
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`request_failed:${res.status}`);
  const parsed = (await res.json()) as ApiResponse<T>;
  return parsed.data;
}

export interface StaffListParams {
  role?: Role | 'all';
  status?: StaffStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

function buildStaffQuery(params: StaffListParams): string {
  const q = new URLSearchParams();
  if (params.role && params.role !== 'all') q.set('role', params.role);
  if (params.status && params.status !== 'all') q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface StaffActivityParams {
  page?: number;
  pageSize?: number;
  action?: string;
  from?: string;
  to?: string;
}

function buildActivityQuery(params: StaffActivityParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.action) q.set('action', params.action);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface InviteStaffInput {
  email: string;
  fullName?: string;
  role: Role;
  departmentIds: string[];
  note?: string;
}

export interface PatchStaffInput {
  role?: Role;
  departmentIds?: string[];
  fullName?: string;
  phone?: string;
  email?: string;
  locale?: 'ru' | 'uz';
  timezone?: string;
  reason?: string;
}

export interface StaffMemberWithPermissions extends StaffMember {
  permissions: StaffPermissionMatrix;
}

export const staffApi = {
  list: (params: StaffListParams = {}) =>
    getJson<ListResponse<StaffMember>>(`/api/staff${buildStaffQuery(params)}`),

  getById: (id: string) =>
    getJson<StaffMemberWithPermissions>(`/api/staff/${id}`),

  activity: (id: string, params: StaffActivityParams = {}) =>
    getJson<ListResponse<StaffActivityEntry>>(
      `/api/staff/${id}/activity${buildActivityQuery(params)}`
    ),

  sessions: (id: string) =>
    getJson<ListResponse<StaffSession>>(`/api/staff/${id}/sessions`),

  invite: (input: InviteStaffInput) => send<StaffMember>('/api/staff/invite', 'POST', input),

  patch: (id: string, patch: PatchStaffInput) =>
    send<StaffMember>(`/api/staff/${id}`, 'PATCH', patch),

  deactivate: (id: string, reason: string) =>
    send<StaffMember>(`/api/staff/${id}/deactivate`, 'POST', { reason }),

  reactivate: (id: string) =>
    send<StaffMember>(`/api/staff/${id}/reactivate`, 'POST'),

  resetPassword: (id: string) =>
    send<{ ok: true }>(`/api/staff/${id}/reset-password`, 'POST'),

  resendInvite: (id: string) =>
    send<StaffMember>(`/api/staff/${id}/resend-invite`, 'POST'),

  cancelInvite: (id: string) =>
    send<{ ok: true }>(`/api/staff/${id}/invite`, 'DELETE'),

  deleteAccount: (id: string, reason: string, emailConfirm: string) =>
    send<{ ok: true }>(`/api/staff/${id}`, 'DELETE', { reason, emailConfirm }),

  transferOwnership: (id: string, reason: string, confirmPhrase: string) =>
    send<StaffMember>(`/api/staff/${id}/transfer-ownership`, 'POST', {
      reason,
      confirmPhrase,
    }),

  revokeSession: (id: string, sessionId: string, reason: string) =>
    send<{ ok: true; revokedId: string }>(
      `/api/staff/${id}/sessions/${sessionId}/revoke`,
      'POST',
      { reason }
    ),

  revokeAllOtherSessions: (id: string, reason: string) =>
    send<{ ok: true; revokedCount: number }>(
      `/api/staff/${id}/sessions/revoke-all-others`,
      'POST',
      { reason }
    ),
};
