// Typed fetch wrappers for the Coming Soon system. Single endpoint — Notify-Me
// signup. Wire shape mirrors project conventions: envelope via `{ data: T }`.

export interface NotifyMeBody {
  feature: string;
  email: string;
}

export interface NotifyMeResponse {
  feature: string;
  email: string;
  /** ISO timestamp of when the signup landed. */
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
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

export const comingSoonApi = {
  notify(body: NotifyMeBody): Promise<NotifyMeResponse> {
    return fetchJson<NotifyMeResponse>('/api/coming-soon/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
};
