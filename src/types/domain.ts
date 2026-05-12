// UNIPAY domain models. Source of truth — never invent statuses, roles, or channels in UI code.

export type Role = 'owner' | 'finance_manager' | 'operator' | 'viewer';

export type PaymentStatus =
  | 'paid'
  | 'processing'
  | 'pending'
  | 'overdue'
  | 'failed'
  | 'refunded';

export type AccountStatus = 'active' | 'inactive';

export type PaymentChannel =
  | 'payme'
  | 'click'
  | 'uzum'
  | 'apelsin'
  | 'tezpay'
  | 'mpay'
  | 'cash'
  | 'manual';

export type Currency = 'UZS' | 'USD';

export type Locale = 'ru' | 'uz';

export type StatusDomain = 'payment' | 'account' | 'payout' | 'verification';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'muted';

export type DepartmentType = 'faculty' | 'department' | 'class' | 'group' | 'other';

export type EducationType = 'full-time' | 'part-time' | 'evening' | 'remote';

export type PayoutStatus = 'settled' | 'pending' | 'failed';

export type BankAccountVerification = 'verified' | 'pending' | 'failed';

export const ORG_TYPES = ['university', 'school', 'kindergarten', 'college', 'other'] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const LEGAL_FORMS = ['llc', 'jsc', 'state', 'private', 'ngo', 'other'] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

// Money is stored in MINOR units (UZS in tiyins, USD in cents) as bigint.
// UI must divide by 100 at display time. Never store, pass, or render floats.
export interface Money {
  amount: bigint;
  currency: Currency;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  organizationId: string;
  status: AccountStatus;
  createdAt: Date;
  onboardingComplete: boolean;
}

export interface Department {
  id: string;
  parentId: string | null;
  name: { ru: string; uz?: string };
  type: DepartmentType;
  studentCount: number;
  headStaffId?: string;
  paymentTypes?: ('tuition' | 'dormitory' | 'other')[];
  notes?: string;
  children?: Department[];
}

/**
 * Student-level payment health. Distinct from transaction `PaymentStatus` because
 * a student's overall position is an aggregate ('partial' = some schedule rows paid)
 * and never carries transaction-only states like 'processing' / 'failed' / 'refunded'.
 */
export type StudentPaymentStatus = 'paid' | 'partial' | 'pending' | 'overdue';

export type PaymentType = 'tuition' | 'dormitory' | 'other';

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dob?: string;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  departmentId: string;
  year?: number;
  educationType: EducationType;
  enrollmentDate: string;
  endDate?: string;
  status: AccountStatus;
  avatarUrl?: string;
  currentBalance: Money;
  paymentStatus: StudentPaymentStatus;
  lastPaymentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A row of a student's payment schedule. Status mirrors `StudentPaymentStatus` but
 * applies to that single row (not the student in aggregate).
 */
export type ScheduleRowStatus = 'paid' | 'partial' | 'pending' | 'overdue';

export interface ScheduleRow {
  id: string;
  studentId: string;
  period: string;
  type: PaymentType;
  amount: Money;
  paid: Money;
  remaining: Money;
  dueDate: string;
  status: ScheduleRowStatus;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reusable payment schedule template. Applied to a set of departments / years / students;
 * each application generates a `ScheduleRow` per target student.
 */
export interface ScheduleTemplate {
  id: string;
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
  appliedCount: number;
  createdAt: string;
  createdBy?: string;
}

export interface StudentNote {
  id: string;
  studentId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type StudentActivityAction =
  | 'created'
  | 'updated'
  | 'profile_updated'
  | 'department_changed'
  | 'status_changed'
  | 'schedule_row_added'
  | 'schedule_row_updated'
  | 'schedule_row_removed'
  | 'template_applied'
  | 'note_added'
  | 'sms_sent'
  | 'deactivated'
  | 'reactivated'
  | 'deleted'
  | 'imported';

export interface StudentActivityEntry {
  id: string;
  studentId: string;
  action: StudentActivityAction;
  actorId?: string;
  actorName?: string;
  field?: string;
  before?: string | null;
  after?: string | null;
  createdAt: string;
}

/**
 * Server-side staging area for an in-progress xlsx/csv import. Rows carry per-cell
 * errors so the Review step can highlight and inline-edit until the batch is clean.
 */
export interface ImportRowError {
  field: string;
  code: string;
  message: string;
}

export interface ImportRow {
  index: number;
  raw: {
    studentId?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    email?: string;
    departmentId?: string;
    departmentPath?: string;
    year?: string;
    educationType?: string;
    enrollmentDate?: string;
    amount?: string;
    dueDate?: string;
  };
  errors: ImportRowError[];
}

export interface ImportSession {
  id: string;
  fileName: string;
  totalRows: number;
  okCount: number;
  errorCount: number;
  rows: ImportRow[];
  status: 'parsed' | 'committing' | 'committed' | 'failed';
  createdAt: string;
}

export const FAILURE_CODES = [
  'INSUFFICIENT_FUNDS',
  'CARD_DECLINED',
  'TIMEOUT',
  'INVALID_AMOUNT',
] as const;
export type FailureCode = (typeof FAILURE_CODES)[number];

export type TransactionEventType =
  | 'created'
  | 'processed'
  | 'settled'
  | 'failed'
  | 'refunded';

export interface TransactionEvent {
  type: TransactionEventType;
  at: string;
  actor?: 'system' | 'user' | 'provider' | 'admin';
}

export const MANUAL_PAYMENT_METHODS = ['cash', 'bank_transfer', 'other'] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  departmentId: string;
  scheduleId?: string;
  amount: Money;
  commission: Money;
  net: Money;
  channel: PaymentChannel;
  status: PaymentStatus;
  paymentMethod?: ManualPaymentMethod;
  receiptNumber?: string;
  note?: string;
  failureCode?: FailureCode;
  events?: TransactionEvent[];
  createdAt: string;
  receiptUrl?: string;
}

export const REFUND_REASONS = [
  'duplicate',
  'wrong_amount',
  'service_not_provided',
  'other',
] as const;
export type RefundReason = (typeof REFUND_REASONS)[number];

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Refund {
  id: string;
  transactionId: string;
  studentId: string;
  studentName: string;
  amount: Money;
  reason: RefundReason;
  note: string;
  status: RefundStatus;
  requestedAt: string;
  resolvedAt?: string;
  bankRef?: string;
  refundTransactionId?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  mfo: string;
  accountNumber: string;
  holderName: string;
  currency: Currency;
  label?: string;
  isDefault: boolean;
  verification: BankAccountVerification;
}

export interface Organization {
  id: string;
  name: { ru: string; uz?: string; en?: string };
  type: OrgType;
  tin: string;
  legalForm: LegalForm;
  region: string;
  address: string;
  website: string;
  foundedYear?: number;
}

export interface Branding {
  logoDataUrl: string;
  primaryColor: string;
  receiptFooter: string;
}

export type StaffStatus = 'active' | 'inactive' | 'pending';

export const STAFF_INVITABLE_ROLES = ['finance_manager', 'operator', 'viewer'] as const;
export type StaffInvitableRole = (typeof STAFF_INVITABLE_ROLES)[number];

export interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  locale?: Locale;
  timezone?: string;
  role: Role;
  status: StaffStatus;
  departmentIds: string[];
  createdAt: string;
  lastLoginAt?: string;
  invitedAt?: string;
  invitedBy?: string;
  isOwner: boolean;
}

export type StaffActivityAction =
  | 'login'
  | 'role_changed'
  | 'access_changed'
  | 'contact_updated'
  | 'student_added'
  | 'transaction_created'
  | 'report_exported'
  | 'invite_sent'
  | 'invite_resent'
  | 'invite_cancelled'
  | 'deactivated'
  | 'reactivated'
  | 'password_reset'
  | 'session_revoked'
  | 'sessions_revoked_all_others';

export interface StaffActivityEntry {
  id: string;
  staffId: string;
  action: StaffActivityAction;
  target?: string;
  ip?: string;
  device?: string;
  createdAt: string;
}

export interface StaffSession {
  id: string;
  staffId: string;
  device: string;
  os?: string;
  browser?: string;
  ip: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  current: boolean;
}

export type StaffResource =
  | 'students'
  | 'payments'
  | 'reports'
  | 'staff'
  | 'settings'
  | 'audit';

export interface StaffPermission {
  resource: StaffResource;
  read: boolean;
  write: boolean;
  destructive: boolean;
}

export type StaffPermissionMatrix = StaffPermission[];

/**
 * Static role → capability mapping. Source of truth for the permission matrix
 * surfaced on the staff detail page until the backend exposes a real `permissions` API.
 */
export const ROLE_PERMISSIONS: Record<Role, StaffPermissionMatrix> = {
  owner: [
    { resource: 'students', read: true, write: true, destructive: true },
    { resource: 'payments', read: true, write: true, destructive: true },
    { resource: 'reports', read: true, write: true, destructive: true },
    { resource: 'staff', read: true, write: true, destructive: true },
    { resource: 'settings', read: true, write: true, destructive: true },
    { resource: 'audit', read: true, write: true, destructive: true },
  ],
  finance_manager: [
    { resource: 'students', read: true, write: true, destructive: false },
    { resource: 'payments', read: true, write: true, destructive: true },
    { resource: 'reports', read: true, write: true, destructive: false },
    { resource: 'staff', read: true, write: false, destructive: false },
    { resource: 'settings', read: true, write: false, destructive: false },
    { resource: 'audit', read: true, write: false, destructive: false },
  ],
  operator: [
    { resource: 'students', read: true, write: true, destructive: false },
    { resource: 'payments', read: true, write: true, destructive: false },
    { resource: 'reports', read: true, write: false, destructive: false },
    { resource: 'staff', read: true, write: false, destructive: false },
    { resource: 'settings', read: false, write: false, destructive: false },
    { resource: 'audit', read: false, write: false, destructive: false },
  ],
  viewer: [
    { resource: 'students', read: true, write: false, destructive: false },
    { resource: 'payments', read: true, write: false, destructive: false },
    { resource: 'reports', read: true, write: false, destructive: false },
    { resource: 'staff', read: true, write: false, destructive: false },
    { resource: 'settings', read: false, write: false, destructive: false },
    { resource: 'audit', read: false, write: false, destructive: false },
  ],
};

export interface Payout {
  id: string;
  periodFrom: string;
  periodTo: string;
  transactionsCount: number;
  gross: Money;
  commission: Money;
  net: Money;
  bankAccountId: string;
  bankRef?: string;
  status: PayoutStatus;
  completedAt?: string;
}

/**
 * Per-transaction line of a payout's settlement breakdown. Surfaced on
 * `/payouts/:id` so finance reviewers can reconcile each transaction's
 * contribution to the net amount. Distinct from `Transaction` because
 * the wire shape carries only the fields the breakdown table renders.
 */
export interface PayoutBreakdownRow {
  transactionId: string;
  studentId: string;
  studentName: string;
  channel: PaymentChannel;
  status: PaymentStatus;
  amount: Money;
  commission: Money;
  net: Money;
  createdAt: string;
}

/**
 * Payout disbursement cadence for the institution. Drives whether the
 * `/payouts/request` page surfaces the manual request form or an
 * informational card. Sourced from `GET /api/payouts/balance` — not on
 * the `Organization` model — so future plan tiers (e.g. `weekly`,
 * `monthly`) can ship without an org-shape migration.
 */
export type PayoutPlan = 'auto' | 'request';
