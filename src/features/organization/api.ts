import type {
  BankAccount,
  Branding,
  Department,
  Organization,
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

export const organizationApi = {
  // organization
  get: () => getJson<Organization>('/api/organization'),
  update: (patch: Partial<Organization>) =>
    send<Organization>('/api/organization', 'PATCH', patch),

  // departments
  listDepartments: () =>
    getJson<ListResponse<Department>>('/api/organization/departments'),
  createDepartment: (input: Partial<Department>) =>
    send<Department>('/api/organization/departments', 'POST', input),
  updateDepartment: (id: string, patch: Partial<Department>) =>
    send<Department>(`/api/organization/departments/${id}`, 'PATCH', patch),
  deleteDepartment: (id: string) =>
    send<{ ok: true; deletedIds: string[] }>(
      `/api/organization/departments/${id}`,
      'DELETE'
    ),
  moveDepartment: (id: string, newParentId: string | null) =>
    send<Department>(`/api/organization/departments/${id}/move`, 'POST', {
      newParentId,
    }),

  // bank accounts
  listBankAccounts: () =>
    getJson<ListResponse<BankAccount>>('/api/organization/bank-accounts'),
  createBankAccount: (input: Partial<BankAccount>) =>
    send<BankAccount>('/api/organization/bank-accounts', 'POST', input),
  updateBankAccount: (id: string, patch: Partial<BankAccount>) =>
    send<BankAccount>(`/api/organization/bank-accounts/${id}`, 'PATCH', patch),
  deleteBankAccount: (id: string) =>
    send<{ ok: true }>(`/api/organization/bank-accounts/${id}`, 'DELETE'),
  setDefaultBankAccount: (id: string) =>
    send<BankAccount>(
      `/api/organization/bank-accounts/${id}/set-default`,
      'POST'
    ),

  // branding
  getBranding: () => getJson<Branding>('/api/organization/branding'),
  updateBranding: (patch: Partial<Branding>) =>
    send<Branding>('/api/organization/branding', 'PATCH', patch),
};
