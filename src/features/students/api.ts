import type {
  EducationType,
  ImportRow,
  ImportSession,
  Money,
  PaymentType,
  ScheduleRow,
  ScheduleRowStatus,
  ScheduleTemplate,
  Student,
  StudentActivityAction,
  StudentActivityEntry,
  StudentNote,
  StudentPaymentStatus,
  Transaction,
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
  if (!res.ok) {
    let code = `request_failed:${res.status}`;
    try {
      const parsed = (await res.json()) as { error?: { code?: string } };
      if (parsed?.error?.code) code = parsed.error.code;
    } catch {
      // ignore
    }
    throw new Error(code);
  }
  const parsed = (await res.json()) as ApiResponse<T>;
  return parsed.data;
}

// ---------- list params ----------

export interface StudentsListParams {
  search?: string;
  departmentIds?: string[];
  years?: number[];
  paymentStatuses?: StudentPaymentStatus[];
  educationTypes?: EducationType[];
  statuses?: Array<'active' | 'inactive'>;
  page?: number;
  pageSize?: number;
}

function buildStudentsQuery(params: StudentsListParams): string {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  for (const d of params.departmentIds ?? []) q.append('departmentId', d);
  for (const y of params.years ?? []) q.append('year', String(y));
  for (const s of params.paymentStatuses ?? []) q.append('paymentStatus', s);
  for (const e of params.educationTypes ?? []) q.append('educationType', e);
  for (const s of params.statuses ?? []) q.append('status', s);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface ActivityParams {
  page?: number;
  pageSize?: number;
  action?: StudentActivityAction;
  from?: string;
  to?: string;
}

function buildActivityQuery(params: ActivityParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.action) q.set('action', params.action);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ---------- input types ----------

export interface CreateStudentInput {
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dob?: string;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  departmentId: string;
  educationType: EducationType;
  enrollmentDate: string;
  templateId?: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dob?: string;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  departmentId?: string;
  educationType?: EducationType;
  enrollmentDate?: string;
  endDate?: string;
  status?: 'active' | 'inactive';
  avatarUrl?: string;
}

export interface ScheduleRowInput {
  period: string;
  type: PaymentType;
  amount: Money;
  paid?: Money;
  remaining?: Money;
  dueDate: string;
  status?: ScheduleRowStatus;
}

export interface ScheduleRowPatch {
  period?: string;
  type?: PaymentType;
  amount?: Money;
  paid?: Money;
  dueDate?: string;
  status?: ScheduleRowStatus;
}

export interface NoteInput {
  body: string;
}

export interface BulkRemindInput {
  studentIds: string[];
}

export interface BulkChangeDeptInput {
  studentIds: string[];
  departmentId: string;
}

export interface BulkDeactivateInput {
  studentIds: string[];
  reason: string;
}

export interface ScheduleTemplateInput {
  name: string;
  type: PaymentType;
  amountMode: 'single' | 'per-department';
  amount?: Money;
  perDepartmentAmounts?: Array<{ departmentId: string; amount: Money }>;
  dueDate: string;
  periodLabel: string;
  appliesTo: {
    departmentIds: string[];
    years: number[];
    studentIds: string[];
  };
}

export interface ApplyTemplateInput {
  departmentIds?: string[];
  years?: number[];
  studentIds?: string[];
  reason: string;
}

// ---------- API surface ----------

export const studentsApi = {
  list: (params: StudentsListParams = {}) =>
    getJson<ListResponse<Student>>(`/api/students${buildStudentsQuery(params)}`),

  getById: (id: string) => getJson<Student>(`/api/students/${id}`),

  checkId: (studentId: string) =>
    getJson<{ available: boolean }>(`/api/students/check-id?id=${encodeURIComponent(studentId)}`),

  create: (input: CreateStudentInput) => send<Student>('/api/students', 'POST', input),

  update: (id: string, patch: UpdateStudentInput) =>
    send<Student>(`/api/students/${id}`, 'PATCH', patch),

  delete: (id: string, reason: string) =>
    send<{ id: string; deleted: true }>(`/api/students/${id}`, 'DELETE', { reason }),

  schedule: (id: string) =>
    getJson<ListResponse<ScheduleRow>>(`/api/students/${id}/schedule`),

  addScheduleRow: (id: string, input: ScheduleRowInput) =>
    send<ScheduleRow>(`/api/students/${id}/schedule`, 'POST', input),

  patchScheduleRow: (id: string, rowId: string, patch: ScheduleRowPatch) =>
    send<ScheduleRow>(`/api/students/${id}/schedule/${rowId}`, 'PATCH', patch),

  deleteScheduleRow: (id: string, rowId: string) =>
    send<{ id: string; deleted: true }>(`/api/students/${id}/schedule/${rowId}`, 'DELETE'),

  transactions: (id: string) =>
    getJson<ListResponse<Transaction>>(`/api/students/${id}/transactions`),

  notes: (id: string) => getJson<ListResponse<StudentNote>>(`/api/students/${id}/notes`),

  addNote: (id: string, input: NoteInput) =>
    send<StudentNote>(`/api/students/${id}/notes`, 'POST', input),

  activity: (id: string, params: ActivityParams = {}) =>
    getJson<ListResponse<StudentActivityEntry>>(
      `/api/students/${id}/activity${buildActivityQuery(params)}`,
    ),

  sendSms: (id: string, message: string) =>
    send<{ sent: true }>(`/api/students/${id}/sms`, 'POST', { message }),

  // ---- import ----
  importParse: async (file: File): Promise<ImportSession> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/students/import/parse', { method: 'POST', body: fd });
    if (!res.ok) {
      let code = `request_failed:${res.status}`;
      try {
        const parsed = (await res.json()) as { error?: { code?: string } };
        if (parsed?.error?.code) code = parsed.error.code;
      } catch {
        // ignore
      }
      throw new Error(code);
    }
    const body = (await res.json()) as ApiResponse<ImportSession>;
    return body.data;
  },

  importPatchRow: (sessionId: string, index: number, patch: Partial<ImportRow['raw']>) =>
    send<ImportRow>(`/api/students/import/${sessionId}/row/${index}`, 'PATCH', patch),

  importCommit: (sessionId: string, reason?: string) =>
    send<{ id: string; importedCount: number; status: 'committed' }>(
      `/api/students/import/${sessionId}/commit`,
      'POST',
      reason ? { reason } : {},
    ),

  importErrorReport: (sessionId: string) =>
    getJson<{ rows: ImportRow[] }>(`/api/students/import/${sessionId}/error-report.xlsx`),

  // ---- bulk ----
  bulkRemind: (input: BulkRemindInput) =>
    send<{ sent: number }>('/api/students/bulk-remind', 'POST', input),

  bulkExport: (input: BulkRemindInput) =>
    send<{ exported: number; downloadUrl: string }>('/api/students/bulk-export', 'POST', input),

  bulkChangeDept: (input: BulkChangeDeptInput) =>
    send<{ updated: number }>('/api/students/bulk-change-dept', 'POST', input),

  bulkDeactivate: (input: BulkDeactivateInput) =>
    send<{ updated: number }>('/api/students/bulk-deactivate', 'POST', input),

  // ---- templates ----
  listTemplates: () =>
    getJson<ListResponse<ScheduleTemplate>>('/api/students/schedules-templates'),

  createTemplate: (input: ScheduleTemplateInput) =>
    send<ScheduleTemplate>('/api/students/schedules-templates', 'POST', input),

  updateTemplate: (id: string, input: Partial<ScheduleTemplateInput>) =>
    send<ScheduleTemplate>(`/api/students/schedules-templates/${id}`, 'PATCH', input),

  deleteTemplate: (id: string, reason: string) =>
    send<{ id: string; deleted: true }>(`/api/students/schedules-templates/${id}`, 'DELETE', { reason }),

  applyTemplate: (id: string, input: ApplyTemplateInput) =>
    send<{ id: string; appliedCount: number }>(
      `/api/students/schedules-templates/${id}/apply`,
      'POST',
      input,
    ),
};
