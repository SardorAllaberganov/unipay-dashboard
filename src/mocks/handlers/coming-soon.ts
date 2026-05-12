// MSW handlers for the Coming Soon system. Single endpoint — Notify-Me signup.
// Stores submissions in an in-memory Map keyed by `${feature}:${email}` so a
// repeat signup is idempotent (200 always; backend de-dupes silently).
import { http, HttpResponse } from 'msw';

interface SignupRecord {
  feature: string;
  email: string;
  createdAt: string;
}

const signupsStore = new Map<string, SignupRecord>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const comingSoonHandlers = [
  http.post('/api/coming-soon/notify', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      feature?: string;
      email?: string;
    };
    if (!body.feature || typeof body.feature !== 'string') {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'feature' } },
        { status: 400 },
      );
    }
    if (!body.email || !EMAIL_RE.test(body.email)) {
      return HttpResponse.json(
        { error: { code: 'invalid_input', field: 'email' } },
        { status: 400 },
      );
    }
    // Simulate a realistic submit duration so the loading state is visible.
    await new Promise((r) => setTimeout(r, 700));
    const key = `${body.feature}:${body.email.toLowerCase()}`;
    const existing = signupsStore.get(key);
    const record: SignupRecord = existing ?? {
      feature: body.feature,
      email: body.email,
      createdAt: new Date().toISOString(),
    };
    if (!existing) signupsStore.set(key, record);
    return HttpResponse.json({ data: record });
  }),
];
