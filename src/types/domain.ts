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
  paymentStatus: PaymentStatus;
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  departmentId: string;
  amount: Money;
  commission: Money;
  net: Money;
  channel: PaymentChannel;
  status: PaymentStatus;
  createdAt: string;
  receiptUrl?: string;
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
