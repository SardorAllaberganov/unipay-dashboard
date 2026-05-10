import { http, HttpResponse } from 'msw';
import type { Role, User } from '@/types/domain';

const ORG_ID = 'org-unipay-dev';
const NOW = new Date();

function user(
  id: string,
  email: string,
  fullName: string,
  role: Role,
  onboardingComplete: boolean
): User {
  return {
    id,
    email,
    fullName,
    phone: null,
    role,
    organizationId: ORG_ID,
    status: 'active',
    createdAt: NOW,
    onboardingComplete,
  };
}

const FAKE_USERS: Record<Role, User> = {
  owner: user('u-owner', 'owner@unipay.dev', 'Алишер Каримов', 'owner', false),
  finance_manager: user('u-finance', 'finance@unipay.dev', 'Дилнура Юсупова', 'finance_manager', true),
  operator: user('u-operator', 'operator@unipay.dev', 'Шохрух Эргашев', 'operator', true),
  viewer: user('u-viewer', 'viewer@unipay.dev', 'Мадина Тошева', 'viewer', true),
};

function pickRole(email: string): Role {
  const lower = email.toLowerCase();
  // Dev fixture prefixes
  if (lower.startsWith('owner')) return 'owner';
  if (lower.startsWith('finance')) return 'finance_manager';
  if (lower.startsWith('operator')) return 'operator';
  if (lower.startsWith('viewer')) return 'viewer';
  // Domain hints
  if (lower.includes('@admin.')) return 'owner';
  if (lower.includes('@finance.')) return 'finance_manager';
  if (lower.includes('@operator.')) return 'operator';
  if (lower.includes('@viewer.')) return 'viewer';
  return 'finance_manager';
}

function fakeJwt(role: Role): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ role, iat: Date.now() }));
  return `${header}.${payload}.fake-signature-${role}`;
}

export const authHandlers = [
  http.post('/api/auth/sign-in', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email ?? '';
    const password = body.password ?? '';
    if (!email.includes('@') || password.length < 6) {
      return HttpResponse.json(
        { error: { code: 'invalid_credentials' } },
        { status: 401 }
      );
    }
    const role = pickRole(email);
    return HttpResponse.json({
      data: { user: FAKE_USERS[role], token: fakeJwt(role) },
    });
  }),

  http.post('/api/auth/sign-out', () => HttpResponse.json({ data: { ok: true } })),

  http.post('/api/auth/forgot-password', () =>
    HttpResponse.json({ data: { ok: true } })
  ),

  http.post('/api/auth/reset-password', async ({ request }) => {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = body.token ?? '';
    if (!token.startsWith('valid-')) {
      return HttpResponse.json(
        { error: { code: 'invalid_token' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({ data: { ok: true } });
  }),

  http.get('/api/auth/me', () => HttpResponse.json({ data: { user: FAKE_USERS.owner } })),
];
