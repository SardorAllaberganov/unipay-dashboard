import { http, HttpResponse } from 'msw';
import type { Role, User } from '@/types/domain';

const ORG_ID = 'org-unipay-dev';
const NOW = new Date();

function user(id: string, email: string, fullName: string, role: Role): User {
  return {
    id,
    email,
    fullName,
    phone: null,
    role,
    organizationId: ORG_ID,
    status: 'active',
    createdAt: NOW,
  };
}

const FAKE_USERS: Record<Role, User> = {
  owner: user('u-owner', 'owner@unipay.dev', 'Алишер Каримов', 'owner'),
  finance_manager: user('u-finance', 'finance@unipay.dev', 'Дилнура Юсупова', 'finance_manager'),
  operator: user('u-operator', 'operator@unipay.dev', 'Шохрух Эргашев', 'operator'),
  viewer: user('u-viewer', 'viewer@unipay.dev', 'Мадина Тошева', 'viewer'),
};

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string; role?: Role };
    const role = body.role ?? 'owner';
    return HttpResponse.json({
      data: { user: FAKE_USERS[role], token: `fake-token-${role}-${Date.now()}` },
    });
  }),
  http.post('/api/auth/logout', () => HttpResponse.json({ data: { ok: true } })),
  http.get('/api/auth/me', () => HttpResponse.json({ data: { user: FAKE_USERS.owner } })),
];
