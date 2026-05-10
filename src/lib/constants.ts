import type { PaymentChannel, PaymentStatus, Role } from '@/types/domain';

export const PAYMENT_CHANNELS: PaymentChannel[] = [
  'payme',
  'click',
  'uzum',
  'apelsin',
  'tezpay',
  'mpay',
  'cash',
  'manual',
];

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  payme: 'Payme',
  click: 'Click',
  uzum: 'Uzum',
  apelsin: 'Apelsin',
  tezpay: 'TezPay',
  mpay: 'MPAY',
  cash: 'Cash',
  manual: 'Manual',
};

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'paid',
  'processing',
  'pending',
  'overdue',
  'failed',
  'refunded',
];

export const ROLES: Role[] = ['owner', 'finance_manager', 'operator', 'viewer'];

export const SUPPORTED_LOCALES = ['ru', 'uz'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 64;

export const FEATURE_DARK_MODE = import.meta.env.VITE_FEATURE_DARK_MODE === 'true';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
