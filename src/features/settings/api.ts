// Typed fetch wrappers for the Settings module — 7 tabs × ~24 endpoints.
// Wire shape mirrors the project convention: amounts as MoneyJson (number tiyins,
// per the global BigInt.prototype.toJSON patch in src/main.tsx), envelopes via
// `{ data: T }`, and a `_meta` partial-shape field on list responses.
import type {
  ApiKey,
  ApiKeyPermission,
  AuditAction,
  AuditLogEntry,
  BillingPlanCode,
  GeneralSettings,
  LoginHistoryEntry,
  MySession,
  NotificationPreferences,
  TwoFactorState,
  WebhookConfig,
  WebhookDelivery,
  WebhookEvent,
} from '@/types/domain';

interface ApiResponse<T> {
  data: T;
}

interface MoneyJson {
  amount: number;
  currency: 'UZS' | 'USD';
}

export interface ResponseMeta {
  partial?: boolean;
  shown?: number;
  total?: number;
}

export interface BillingFeatureJson {
  key: string;
  included: Record<BillingPlanCode, boolean>;
}

export interface BillingPlanInfoJson {
  code: BillingPlanCode;
  name: string;
  monthlyFee: MoneyJson;
  commissionRate: number;
  payoutSchedule: 'daily' | 'weekly' | 'on_request';
}

export interface BillingJson {
  current: BillingPlanCode;
  plans: BillingPlanInfoJson[];
  features: BillingFeatureJson[];
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  _meta?: ResponseMeta;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFaInitResponse {
  qrSvgDataUri: string;
  secret: string; // base32, shown for manual entry
}

export interface TwoFaEnableVerifyBody {
  code: string;
}

export interface TwoFaEnableVerifyResponse {
  recoveryCodes: string[];
}

export interface TwoFaDisableBody {
  password: string;
  reason: string;
}

export interface RevokeSessionBody {
  reason: string;
}

export interface CreateApiKeyBody {
  name: string;
  permissions: ApiKeyPermission[];
}

export interface CreateApiKeyResponse {
  key: ApiKey;
  /** Plaintext — shown ONCE, never persisted client-side. */
  plaintext: string;
}

export interface RevealApiKeyBody {
  password: string;
}
export interface RevealApiKeyResponse {
  plaintext: string;
}

export interface RegenerateApiKeyBody {
  password: string;
}
export interface RegenerateApiKeyResponse {
  key: ApiKey;
  plaintext: string;
}

export interface DeleteApiKeyBody {
  reason: string;
}

export interface WebhookTestResponse {
  status: 'success' | 'failed';
  responseCode: number;
  durationMs: number;
}

export interface WebhookSecretRevealBody {
  password: string;
}
export interface WebhookSecretRevealResponse {
  plaintext: string;
}

export interface WebhookSecretRotateBody {
  password: string;
  reason: string;
}
export interface WebhookSecretRotateResponse {
  plaintext: string;
}

export interface AuditListParams {
  actor?: string;
  action?: AuditAction | '';
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface SaveNotificationsBody {
  matrix: NotificationPreferences['matrix'];
  overdueAlertDays: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(
      (errBody as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`,
    ) as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

function qs(params: Record<string, string | number | undefined | null> | object): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const settingsApi = {
  // ── General ──
  getGeneral(): Promise<GeneralSettings> {
    return fetchJson<GeneralSettings>('/api/settings/general');
  },
  saveGeneral(body: Partial<GeneralSettings>): Promise<GeneralSettings> {
    return fetchJson<GeneralSettings>('/api/settings/general', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  // ── Security ──
  changePassword(body: ChangePasswordBody): Promise<{ ok: true }> {
    return fetchJson<{ ok: true }>('/api/settings/security/change-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  getTwoFa(): Promise<TwoFactorState> {
    return fetchJson<TwoFactorState>('/api/settings/security/2fa');
  },
  initTwoFa(): Promise<TwoFaInitResponse> {
    return fetchJson<TwoFaInitResponse>('/api/settings/security/2fa/init', {
      method: 'POST',
    });
  },
  verifyTwoFa(body: TwoFaEnableVerifyBody): Promise<TwoFaEnableVerifyResponse> {
    return fetchJson<TwoFaEnableVerifyResponse>('/api/settings/security/2fa/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  disableTwoFa(body: TwoFaDisableBody): Promise<{ ok: true }> {
    return fetchJson<{ ok: true }>('/api/settings/security/2fa/disable', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  regenerateRecoveryCodes(body: { password: string }): Promise<{ recoveryCodes: string[] }> {
    return fetchJson<{ recoveryCodes: string[] }>('/api/settings/security/2fa/regenerate-codes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  // ── My sessions ──
  listMySessions(): Promise<ListResponse<MySession>> {
    return fetchJson<ListResponse<MySession>>('/api/me/sessions');
  },
  revokeMySession(id: string, body: RevokeSessionBody): Promise<{ ok: true }> {
    return fetchJson<{ ok: true }>(`/api/me/sessions/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  revokeAllOtherSessions(body: RevokeSessionBody): Promise<{ revoked: number }> {
    return fetchJson<{ revoked: number }>('/api/me/sessions/revoke-others', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  loginHistory(limit = 30): Promise<ListResponse<LoginHistoryEntry>> {
    return fetchJson<ListResponse<LoginHistoryEntry>>(`/api/me/login-history${qs({ limit })}`);
  },

  // ── API Keys ──
  listApiKeys(): Promise<ListResponse<ApiKey>> {
    return fetchJson<ListResponse<ApiKey>>('/api/settings/api-keys');
  },
  createApiKey(body: CreateApiKeyBody): Promise<CreateApiKeyResponse> {
    return fetchJson<CreateApiKeyResponse>('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  revealApiKey(id: string, body: RevealApiKeyBody): Promise<RevealApiKeyResponse> {
    return fetchJson<RevealApiKeyResponse>(
      `/api/settings/api-keys/${encodeURIComponent(id)}/reveal`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  },
  regenerateApiKey(id: string, body: RegenerateApiKeyBody): Promise<RegenerateApiKeyResponse> {
    return fetchJson<RegenerateApiKeyResponse>(
      `/api/settings/api-keys/${encodeURIComponent(id)}/regenerate`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  },
  deleteApiKey(id: string, body: DeleteApiKeyBody): Promise<{ ok: true }> {
    return fetchJson<{ ok: true }>(`/api/settings/api-keys/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  // ── Webhook ──
  getWebhook(): Promise<WebhookConfig> {
    return fetchJson<WebhookConfig>('/api/settings/webhook');
  },
  saveWebhook(body: { url: string; events: WebhookEvent[]; enabled: boolean }): Promise<WebhookConfig> {
    return fetchJson<WebhookConfig>('/api/settings/webhook', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  testWebhook(): Promise<WebhookTestResponse> {
    return fetchJson<WebhookTestResponse>('/api/settings/webhook/test', {
      method: 'POST',
    });
  },
  listWebhookDeliveries(): Promise<ListResponse<WebhookDelivery>> {
    return fetchJson<ListResponse<WebhookDelivery>>('/api/settings/webhook/deliveries');
  },
  retryWebhookDelivery(id: string): Promise<WebhookDelivery> {
    return fetchJson<WebhookDelivery>(
      `/api/settings/webhook/deliveries/${encodeURIComponent(id)}/retry`,
      { method: 'POST' },
    );
  },
  revealWebhookSecret(body: WebhookSecretRevealBody): Promise<WebhookSecretRevealResponse> {
    return fetchJson<WebhookSecretRevealResponse>('/api/settings/webhook/secret/reveal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
  rotateWebhookSecret(body: WebhookSecretRotateBody): Promise<WebhookSecretRotateResponse> {
    return fetchJson<WebhookSecretRotateResponse>('/api/settings/webhook/secret/rotate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  // ── Notifications ──
  getNotifications(): Promise<NotificationPreferences> {
    return fetchJson<NotificationPreferences>('/api/settings/notifications');
  },
  saveNotifications(body: SaveNotificationsBody): Promise<NotificationPreferences> {
    return fetchJson<NotificationPreferences>('/api/settings/notifications', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  // ── Billing ──
  getBilling(): Promise<BillingJson> {
    return fetchJson<BillingJson>('/api/settings/billing');
  },

  // ── Audit log ──
  auditLog(params: AuditListParams): Promise<ListResponse<AuditLogEntry>> {
    return fetchJson<ListResponse<AuditLogEntry>>(`/api/settings/audit${qs(params)}`);
  },
};

export const REASON_MIN_LENGTH = 20;
