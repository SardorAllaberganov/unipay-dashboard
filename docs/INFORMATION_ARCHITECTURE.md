# UNIPAY — Information Architecture

> The single map of every page, tab, and locked feature in the merchant dashboard, with a per-route role visibility overlay.
> For workflow narratives across roles, see [USER_FLOWS_BY_ROLE.md](./USER_FLOWS_BY_ROLE.md).

---

## 1. Overview

UNIPAY is a merchant dashboard for Uzbek educational institutions to manage tuition payments. It has **9 functional modules** and a **4-role permission model**.

### The 4 roles (from [src/types/domain.ts](../src/types/domain.ts) — `Role`)

| Role | Primary job | Onboarding |
|---|---|---|
| **Owner** | Institution-wide control: org setup, staff management, billing, audit | Goes through 5-step wizard on first sign-in (`onboardingComplete: false`) |
| **Finance Manager** | Daily financial operations: payments, refunds, payouts, reports | Bypasses onboarding |
| **Operator** | Front-line work: add students, record payments, chase overdues | Bypasses onboarding |
| **Viewer** | Read-only consumption: dashboards, reports, lookup | Bypasses onboarding |

### Source-of-truth notes

- **Routes** — [src/router.tsx](../src/router.tsx)
- **Sidebar grouping + icons** — [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx)
- **Roles + resource permissions matrix** — [src/types/domain.ts](../src/types/domain.ts) (`ROLE_PERMISSIONS`)
- **Tab labels** — Component-level `*TabsNav.tsx` files; i18n keys resolve via [src/lib/i18n/locales/ru.json](../src/lib/i18n/locales/ru.json) and [uz.json](../src/lib/i18n/locales/uz.json)
- **Module status** — [docs/product_states.md](./product_states.md)

### Spec-vs-runtime caveat

There is **no route-level `<RoleGuard>`** in [src/router.tsx](../src/router.tsx) today. Every authenticated user can navigate to every authenticated route by URL. Permission gating is enforced **only inside individual components** (e.g. `StaffDetailPage` hides the Sessions tab unless the viewer is the Owner or themselves; `StudentDetailActionBar` hides Delete unless `isOwner`).

In the role-visibility matrix below:
- ✓ — **spec'd visible** AND component-level gating allows the action
- 🟡 — **runtime-visible** today by URL, but `ROLE_PERMISSIONS` says it shouldn't be (a future route-guard would hide it)
- ✗ — **spec'd hidden** AND no component renders the action

---

## 2. Top-level navigation (sidebar)

The sidebar has **6 sections**. Order, icons, and i18n keys are defined in [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx). During onboarding all items are tooltip-locked (`onboarding.sidebarLockedTooltip`).

| Section (i18n key) | Label (RU) | Item | Route | Icon | Status |
|---|---|---|---|---|---|
| `nav.section.main` | Главное | Dashboard | `/` | `LayoutDashboard` | active |
| `nav.section.organization` | Организация | Organization | `/organization` | `Building2` | active |
| | | Staff | `/staff` | `Users` | active |
| `nav.section.students` | Студенты | Students | `/students` | `GraduationCap` | active |
| | | Documents | `/locked/documents` | `FileText` | 🔒 coming soon |
| `nav.section.payments` | Платежи | Transactions | `/payments/transactions` | `ArrowLeftRight` | active |
| | | Pending | `/payments/pending` | `Clock` | active |
| | | Refunds | `/payments/refunds` | `Undo2` | active |
| | | SMS Campaigns | `/locked/sms-campaigns` | `MessageSquare` | 🔒 coming soon |
| `nav.section.finance` | Финансы | Reports | `/reports` | `FileBarChart` | active |
| | | Payouts | `/payouts` | `Banknote` | active |
| | | AI Insights | `/locked/ai-insights` | `Bot` | 🔒 coming soon |
| `nav.section.system` | Система | Settings | `/settings` | `Settings` | active |
| | | Mobile App | `/locked/mobile-app` | `Smartphone` | 🔒 coming soon |

---

## 3. Full route tree

```
/                                              Dashboard
│
├── /sign-in                                   Auth — sign in
├── /forgot-password                           Auth — request password reset
├── /reset-password                            Auth — set new password
│
├── /onboarding/:step                          5-step wizard (sequential guard)
│   ├── /onboarding/1                          Step 1 — Institution info
│   ├── /onboarding/2                          Step 2 — Contact + branding
│   ├── /onboarding/3                          Step 3 — Bank accounts
│   ├── /onboarding/4                          Step 4 — Departments
│   └── /onboarding/5                          Step 5 — Invite staff
│
├── /organization                              OrganizationLayout (h1 + tabs + outlet)
│   ├── /organization/profile                  Profile tab (default)
│   ├── /organization/departments              Departments tab
│   ├── /organization/bank-accounts            Bank Accounts tab
│   ├── /organization/branding                 Branding tab
│   ├── /organization/bank-accounts/new        Add bank account (sub-page)
│   └── /organization/departments/new          Add department (sub-page)
│
├── /staff                                     Staff list
│   └── /staff/:id                             Staff detail — 4 tabs:
│                                                • Profile
│                                                • Role & Permissions
│                                                • Activity log
│                                                • Sessions  (Owner OR self only)
│
├── /students                                  Students list
│   ├── /students/new                          Add student
│   ├── /students/import                       Import wizard (4 internal steps)
│   ├── /students/schedules                    Schedule templates
│   ├── /students/:id                          Student profile — 4 tabs:
│   │                                            • Schedule
│   │                                            • Transactions
│   │                                            • Notes
│   │                                            • Activity
│   └── /students/:id/edit                     Edit student
│
├── /payments
│   ├── /payments/transactions                 Transactions list
│   │   └── /payments/transactions/:id         Transaction detail
│   ├── /payments/pending                      Pending + overdue
│   └── /payments/refunds                      Refunds queue
│
├── /reports                                   ReportsLayout (h1 + tabs + outlet)
│   ├── /reports/summary                       Summary tab (default)
│   └── /reports/export                        Export tab
│
├── /payouts                                   Payouts history
│   ├── /payouts/request                       Request payout (or auto-info if `plan === 'auto'`)
│   └── /payouts/:id                           Payout detail — timeline + breakdown
│
├── /settings                                  SettingsLayout (h1 + side-tabs + outlet)
│   ├── /settings/general                      General tab (default)
│   ├── /settings/security                     Security tab
│   ├── /settings/api                          API & Webhooks tab
│   ├── /settings/integrations                 Integrations tab
│   ├── /settings/notifications                Notifications tab
│   ├── /settings/billing                      Billing tab
│   ├── /settings/audit                        Audit log tab
│   └── /settings/preferences                  Preferences tab
│
├── /locked/:feature                           Coming-soon landing (see §6)
│
└── /system/preview/*                          QA-only error-state previews
    ├── /system/preview/404
    ├── /system/preview/500
    ├── /system/preview/403
    ├── /system/preview/offline
    ├── /system/preview/maintenance
    └── /system/preview/error-boundary
```

### Tab summary

| Module | Tab count | Tabs |
|---|:-:|---|
| Organization | 4 | Profile · Departments · Bank Accounts · Branding |
| Staff Detail | 3–4 | Profile · Role & Permissions · Activity · Sessions* |
| Student Profile | 4 | Schedule · Transactions · Notes · Activity |
| Reports | 2 | Summary · Export |
| Settings | 8 | General · Security · API · Integrations · Notifications · Billing · Audit · Preferences |

*Sessions tab on Staff Detail is conditional: visible only when the current user is the Owner, or when viewing their own profile ([src/features/staff/pages/StaffDetailPage.tsx:97-99](../src/features/staff/pages/StaffDetailPage.tsx)).

---

## 4. Role visibility matrix

This table maps every authenticated route to what each role *should* see (per `ROLE_PERMISSIONS`) and what they *actually* see today (component-level gating only). See the **spec-vs-runtime caveat** in §1.

Legend: ✓ visible · ✓ʳ read-only · 🟡 runtime-visible but spec says no · ✗ hidden

| Route group | Owner | Finance Manager | Operator | Viewer | Notes |
|---|:-:|:-:|:-:|:-:|---|
| `/sign-in`, `/forgot-password`, `/reset-password` | ✓ | ✓ | ✓ | ✓ | Public |
| `/onboarding/1…5` | ✓ | 🟡 | 🟡 | 🟡 | DEV fixtures: only Owner has `onboardingComplete: false`. In practice Owner-only. |
| `/` (Dashboard) | ✓ | ✓ | ✓ | ✓ʳ | Greeting + KPIs — read-only on Viewer (no actions to take) |
| `/organization/profile` | ✓ | ✓ʳ | 🟡 | 🟡 | `settings.read=false` for Operator/Viewer per spec; runtime currently allows visit |
| `/organization/departments` | ✓ | ✓ʳ | 🟡 | 🟡 | Same as above |
| `/organization/bank-accounts` (+ `/new`) | ✓ | ✓ʳ | 🟡 | 🟡 | Same |
| `/organization/branding` | ✓ | ✓ʳ | 🟡 | 🟡 | Same |
| `/staff` (list) | ✓ | ✓ʳ¹ | ✓ʳ | ✓ʳ | All roles have `staff.read=true`. Owner + Finance Manager see kebab actions. |
| `/staff/:id` | ✓ | ✓ʳ¹ | ✓ʳ | ✓ʳ | Sessions tab Owner-only or self-only |
| `/students` (list) | ✓ | ✓ | ✓ | ✓ʳ | Bulk actions hidden for Viewer |
| `/students/new` | ✓ | ✓ | ✓ | 🟡 | `students.write=false` for Viewer; runtime currently allows visit |
| `/students/import` | ✓ | ✓ | ✓ | 🟡 | Same |
| `/students/schedules` | ✓ | ✓ | ✓ | 🟡 | Same |
| `/students/:id` | ✓ | ✓ | ✓ | ✓ʳ | Detail view; action bar hides Edit/SMS/Deactivate for Viewer (not yet enforced) |
| `/students/:id` — Delete button | ✓ | ✗ | ✗ | ✗ | Owner only ([StudentDetailActionBar.tsx:25](../src/features/students/components/profile/StudentDetailActionBar.tsx)) |
| `/students/:id/edit` | ✓ | ✓ | ✓ | 🟡 | `students.write=false` for Viewer |
| `/payments/transactions` (+ `:id`) | ✓ | ✓ | ✓ | ✓ʳ | All read; Viewer has no write |
| `/payments/pending` | ✓ | ✓ | ✓ | ✓ʳ | Same |
| `/payments/refunds` | ✓ | ✓² | ✓ʳ | ✓ʳ | `payments.destructive=true` for Owner + Finance Manager only |
| `/reports/summary` | ✓ | ✓ | ✓ʳ | ✓ʳ | All read; only Owner + Finance Manager can configure |
| `/reports/export` | ✓ | ✓ | ✓ʳ | ✓ʳ | Same |
| `/payouts` (history) | ✓ | ✓ | ✓ʳ | ✓ʳ | Read-all; request flow gated below |
| `/payouts/request` | ✓ | ✓ | 🟡 | 🟡 | `reports.write=false` for Operator/Viewer (payouts inherits); runtime allows visit |
| `/payouts/:id` | ✓ | ✓ | ✓ʳ | ✓ʳ | Confirm/Cancel buttons gated by status, not by role today |
| `/settings/*` (all 8 tabs) | ✓ | ✓ʳ | ✗ | ✗ | `settings.read=false` for Operator + Viewer per spec |
| `/settings/audit` | ✓ | ✓ʳ | ✗ | ✗ | `audit.read=false` for Operator + Viewer per spec |
| `/locked/:feature` | ✓ | ✓ | ✓ | ✓ | Coming-soon landings open to all |

**Footnotes**

¹ **Staff management actions for Finance Manager** — `ROLE_PERMISSIONS.finance_manager.staff.write = false`, but `PERMISSIONED_ROLES = ['owner', 'finance_manager']` in both [StaffRowKebab.tsx:38](../src/features/staff/components/list/StaffRowKebab.tsx) and [StaffDetailKebab.tsx:48](../src/features/staff/components/detail/StaffDetailKebab.tsx). This is a known runtime/spec divergence — the current UI lets Finance Manager invite/edit staff. Resolve by aligning either the matrix or the kebab.

² **Refund destructive actions** — `ROLE_PERMISSIONS.payments.destructive = true` for Owner + Finance Manager only.

---

## 5. Resource permission matrix (verbatim)

From [src/types/domain.ts:418-451](../src/types/domain.ts) (`ROLE_PERMISSIONS`). 4 roles × 6 resources × `{read, write, destructive}`.

| Resource | Owner | Finance Manager | Operator | Viewer |
|---|---|---|---|---|
| **students** | R · W · D | R · W · — | R · W · — | R · — · — |
| **payments** | R · W · D | R · W · D | R · W · — | R · — · — |
| **reports** | R · W · D | R · W · — | R · — · — | R · — · — |
| **staff** | R · W · D | R · — · — | R · — · — | R · — · — |
| **settings** | R · W · D | R · — · — | — · — · — | — · — · — |
| **audit** | R · W · D | R · — · — | — · — · — | — · — · — |

R = read · W = write · D = destructive · — = denied

---

## 6. Coming Soon feature inventory

Locked features open at `/locked/:feature`. The slug → content map lives in [src/features/coming-soon/data/featureContent.ts](../src/features/coming-soon/data/featureContent.ts) (`FEATURE_REGISTRY`). 9 features are registered; 4 are reachable from the sidebar.

| Slug | Sidebar item? | Where it's linked from |
|---|:-:|---|
| `documents` | ✓ Students section | Sidebar |
| `sms-campaigns` | ✓ Payments section | Sidebar |
| `ai-insights` | ✓ Finance section | Sidebar |
| `mobile-app` | ✓ System section | Sidebar |
| `integrations-hemis` | ✗ | Settings → Integrations |
| `integrations-1c` | ✗ | Settings → Integrations |
| `multi-currency` | ✗ | Organization → Bank Accounts (USD picker) |
| `custom-roles` | ✗ | Settings → Security or Staff (planned) |
| `billing-upgrade` | ✗ | Settings → Billing (CTA) |

Direct URL access works for any slug; an unknown slug falls back to the generic illustration via `resolveFeature(slug)`.

---

## 7. Auth surfaces

Eager-loaded for zero flash on the unauthenticated path ([src/router.tsx:29-31](../src/router.tsx)).

| Route | Component | Purpose |
|---|---|---|
| `/sign-in` | `SignInPage` | Email + password (DEV: role inferred from email prefix) |
| `/forgot-password` | `ForgotPasswordPage` | Request reset email |
| `/reset-password` | `ResetPasswordPage` | Set new password from emailed token |

No dedicated MFA, magic-link, or SSO route exists today. Idle session expiry is enforced by `useIdleTimeout()` in `AuthGuard` ([src/router.tsx:131-134](../src/router.tsx)).

---

## 8. Maintenance contract

Update this document when **any** of the following changes:

| Change | What to update here |
|---|---|
| Add/remove a route in [src/router.tsx](../src/router.tsx) | §3 route tree, §4 visibility matrix |
| Add/remove a sidebar item in [Sidebar.tsx](../src/components/layout/Sidebar.tsx) | §2 nav table |
| Add/remove a tab in any `*TabsNav.tsx` | §3 tab summary, §4 if role-conditional |
| Edit `ROLE_PERMISSIONS` in [domain.ts](../src/types/domain.ts) | §5 matrix, re-audit §4 |
| Add a new role to `Role` | §1 roles table, §4 column, §5 column |
| Add a coming-soon feature to `FEATURE_REGISTRY` | §6 inventory |
| Add a route-level guard | Drop the spec-vs-runtime caveat in §1, flip 🟡 cells to ✗ |

Cross-checks before merging:
1. `git grep -nE "path: ['\"]" src/router.tsx | wc -l` should match the route count in §3.
2. Every i18n key referenced (e.g. `nav.section.main`) must exist in both [ru.json](../src/lib/i18n/locales/ru.json) and [uz.json](../src/lib/i18n/locales/uz.json).
3. Run `npm run audit:discipline` per [STYLE_DISCIPLINE.md](../STYLE_DISCIPLINE.md) §0.9.
