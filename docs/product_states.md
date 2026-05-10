# product_states.md — UNIPAY Merchant Dashboard

Status table for every surface and foundation slice. Updated via `/doc_sync` when statuses flip.

Status legend: ✅ Done · 🚧 In progress · ❌ Todo · ⏸ Deferred

## Foundations

| Slice | Status | Notes |
|---|---|---|
| Vite + React 18 + TS strict scaffold | ✅ | `noUncheckedIndexedAccess` on |
| Tailwind v3 + shadcn primitives | ✅ | Full set generated under `components/ui/` |
| Color scales (brand/slate/success/warning/danger/info) | ✅ | HSL ramps in `globals.css`, exposed via `tailwind.config.ts` |
| Legacy semantic aliases (`--primary-light`, `--success-light`, etc.) | ✅ | Backward-compat layer pointing into scales |
| Motion tokens + `prefers-reduced-motion` | ✅ | `--duration-fast/base/slow`, `--ease-standard/emphasized` |
| Density token (`--row-h`) | ✅ | Driven by `html[data-density]`, consumed by `<TableRow>` |
| Tabular numerals DOM hook | ✅ | `html[data-tabular-nums="true"]` |
| Skip-link | ✅ | First child of AppShell, targets `#main-content` |
| Module-level state stores (preferences / maintenance / auth) | ✅ | `useSyncExternalStore` pattern, cross-tab via storage events |
| ThemeProvider (light / dark / system) | ✅ | Dark token coverage not QA'd in every component yet |
| Domain types (`Role`, `Money` bigint, `Tone`, `Locale`) | ✅ | `src/types/domain.ts` |
| i18n RU + UZ foundation keys | ✅ | App-shell + system-state keys seeded |
| MSW worker + handler scaffold | ✅ | `auth` handler stub, others empty |
| HashRouter + route gates | ✅ | `MaintenanceGate`, `PathAwareAuthGuard`, `SystemErrorBoundary` |
| §0.9 audit greps script | ✅ | `npm run audit:discipline` |
| `STYLE_DISCIPLINE.md` v2.0 | ✅ | Full §0.1-§0.12 + audit greps |
| `docs/DECISIONS.md` log | ✅ | Empty stub |
| `ai_context/AI_CONTEXT.md` + `HISTORY.md` | ✅ | This pass |
| Branded favicon + `theme-color` meta | ✅ | `public/favicon.svg`, brand-600 UP mark |
| GitHub Pages Jekyll bypass | ✅ | `.nojekyll` at repo root + `public/.nojekyll` (lands in `dist/`) |
| Radius bump (Card 12px / controls 8px) | ✅ | Card → `rounded-xl`; Button / Input / Select / Textarea / Toggle / Topbar search → `rounded-lg` |
| Auth feature module (`src/features/auth/`) | ✅ | `signIn`/`forgot`/`reset` pages, schemas, `useFailedAttempts` store, `DevRoleSwitcher`, `PasswordField`, `LockedAlert`, MSW endpoints |
| AuthLayout lg+ brand panel split | ✅ | `bg-brand-600` left half with logo + tagline + radial gradient; form column right with ThemeToggle |
| `signIn` async via MSW | ✅ | `POST /api/auth/sign-in` returns user + JWT-shaped token; role by email-prefix or domain hint |
| Onboarding feature module (`src/features/onboarding/`) | ✅ | 5 step pages, components (Layout, Indicator, ActionBar, PhoneInput, ColorPicker, LogoUploader, ReceiptPreview, BankCombobox, BankAccountFields, DepartmentTreeEditor, InviteStaffFields, **SkipSetupButton**), Context, hooks, fixtures, MSW endpoints |
| Onboarding Skip Setup affordance | ✅ | Ghost button in sticky bar on every step → `ConfirmDialog` → reuses `useOnboardingComplete` + `updateUser` + navigate `/` |
| `AppShellContext.onboardingActive` flag | ✅ | Set by `OnboardingPage` mount/unmount; consumed by Sidebar (locks nav) and AppShell (drops `<main>` top padding) |
| `User.onboardingComplete` + `updateUser(patch)` | ✅ | Domain field + auth-store patcher; DEV owner defaults `false` to trigger wizard, other DEV roles `true` |
| `canvas-confetti` (dynamic import) | ✅ | Bundled to its own ~4.3 KB gzipped chunk via `import()` in Step 5 finish flow |
| Dashboard feature module (`src/features/dashboard/`) | ✅ | Greeting title (Tashkent-aware) + DateRangePicker URL-synced (`?range=&from=&to=`) + 4 KPI cards + RevenueChart (BarChart + D/W/M Tabs + count↔amount Switch) + PaymentStatusChart (donut + center total + legend) + RecentTransactions + UnpaidStudents (bulk-remind → ConfirmDialog ≥20 → toast). All 5 panels render the §0.8 six states. MSW seeds 240 deterministic students; `?_state=partial\|empty\|error` QA hook. |
| `KpiSparkline` (Recharts AreaChart) | ✅ | Brand-600 stroke + gradient fill; replaces the deleted legacy `shared/Sparkline.tsx` |
| `lib/greeting.ts` | ✅ | Tashkent-aware `getGreetingKey()` via `Intl.DateTimeFormat`; `setTimeout(msUntilNextHour)` self-re-arms |

## App shell

| Slice | Status | Notes |
|---|---|---|
| `AppShell` (flex h-dvh + sidebar var + skip-link) | ✅ | Auto-collapse at `(max-width: 1023px)` |
| `Sidebar` (sections, before: accent stripe) | ✅ | Role-aware filtering registry empty for now |
| `TopBar` (breadcrumbs, ⌘K search button, kbd hint) | ✅ | Smart `lg-` hide for non-leaf crumbs |
| `UserMenu` (avatar trigger + dropdown) | ✅ | Sign-out + settings + shortcuts entry |
| `ThemeToggle` (light / dark / system) | ✅ | Dropdown with icons |
| `NotificationsBell` (popover + dot) | ✅ | Conditional unread dot via `unreadCount` prop; localized labels (`notifications.*`); empty body for now |
| `CommandPalette` (cmdk, navigate + theme) | ✅ | Search verbs not yet wired |
| `HelpOverlay` (grouped shortcut list) | ✅ | Sourced from `shortcuts.ts` |
| Chord listener (`g d`, `g s`, etc.) | ❌ | Registry exists, dispatcher pending |
| `OfflineBanner` (between TopBar and main) | ✅ | Cached-from time captured at first mount |
| Mobile sidebar Sheet | ✅ | 280px, opens via TopBar hamburger |

## System states (§0.11)

| State | Status | Notes |
|---|---|---|
| `SystemStateLayout` (in-shell + full-bleed) | ✅ | AuthLayout owns its own TooltipProvider |
| `NotFoundState` | ✅ | Wired into `*` and `PathAwareAuthGuard` |
| `ServerErrorState` (with copy-on-click ref id) | ✅ | `lib/systemEvents.logPageError()` generates id |
| `ForbiddenState` | ✅ | Tone: warning |
| `MaintenanceState` | ✅ | Reads `useMaintenanceState`; ticks once a minute |
| `OfflineState` | ✅ | `forceVisible` for preview |
| `SystemErrorBoundary` | ✅ | Wraps `<AppRoutes>`; `getDerivedStateFromError` + `componentDidCatch` |
| URL trigger `?maintenance=on\|off` | ✅ | Boots from URL, strips param via `history.replaceState` |
| Preview routes (`/system/preview/*`) | ✅ | All 5 reachable |

## Pages

| Page | Status | Notes |
|---|---|---|
| `/sign-in` | ✅ | RHF + Zod, password show/hide, rememberMe (visual), `?next=` + `?expired=1`, lockout (5/15min), DevRoleSwitcher, async `signIn` via MSW |
| `/forgot-password` | ✅ | Email form → success view (always 200, no enumeration leak); ArrowLeft "Назад ко входу" |
| `/reset-password` | ✅ | `?token=` required (must start `valid-`); password 8+ letter+digit, confirm; toast + redirect on success/reject |
| `/onboarding/:step` | ✅ | 5 linear steps (org info, contact+branding, bank accounts, departments, invites). Sticky step indicator + fixed action bar (Pattern A). Sidebar nav locked while active. Save & exit + offline queue. Confetti on finish. |
| `/` Dashboard | ✅ | Greeting header + DateRangePicker (ZhiPay format) + 4 KPI cards (1-col mobile · 2-col `sm:` · 4-col `lg:`) + RevenueChart + PaymentStatusChart + RecentTransactions + UnpaidStudents w/ bulk-remind. Full 6-state coverage per panel via `?_state=` QA hook. |
| `/organization` | ❌ | Placeholder |
| `/staff` | ❌ | Placeholder |
| `/students` + `/students/:id` | ❌ | Placeholder |
| `/payments/transactions` + `/:id` | ❌ | Placeholder |
| `/payments/pending` | ❌ | Placeholder |
| `/payments/refunds` | ❌ | Placeholder |
| `/reports` | ❌ | Placeholder |
| `/payouts` + `/:id` | ❌ | Placeholder |
| `/settings` | ❌ | Placeholder |

## Domain primitives

| Primitive | Status | Notes |
|---|---|---|
| `Money` (bigint-aware) | ✅ | Tabular + mono; negatives go red |
| `MaskedAccount` | ✅ | `••••0123` |
| `WriteButton` | ✅ | Disables + tooltip when offline |
| `KeyboardHint` (Kbd alias) | ✅ | Canonical chip class |
| `StatusBadge` | ✅ | 9 variants, color paired with icon |
| `ChannelBadge` | ✅ | 8 channels |
| `RoleBadge` | ✅ | Updated for `finance_manager` |
| `BackLink` | ✅ | Canonical `Назад к {plural}` + ArrowLeft |
| `DetailHeader` | ✅ | Row 1 / Row 2 / Row 3 (chips) |
| `DetailActionBar` | ✅ | Fixed-bottom, offsets by `--sidebar-width` |
| `KpiCard` (feature-local) | ✅ | Lives in [`features/dashboard/components/`](../src/features/dashboard/components/KpiCard.tsx). Hero `text-2xl md:text-3xl font-mono tabular` (wraps at UZS thousand-space separators); supports optional `to?` for click navigation; sparkline below content via `KpiSparkline`. Legacy `shared/KpiCard.tsx` retired. |
| `KpiSparkline` (Recharts AreaChart) | ✅ | Brand-600 stroke + gradient fill; replaces the deleted legacy `shared/Sparkline.tsx` |
| `DataTable` | ✅ | All 6 states; mobile card stack via `mobileCardRender` |
| `EmptyState` / `ErrorState` / `OfflineState` / `LoadingTable` / `LoadingChart` / `LoadingCard` / `PartialBanner` | ✅ | All 6 states covered |
| `ConfirmDialog` | ✅ | Default reason note `minReasonLength` raised 10 → 20 per §0.9 v2.0; per-call override available for low-stakes notes; i18n-driven label via `common.reasonLabel` (ICU `{{count}}`). |
| `ResponsiveSheet` | ✅ | Bottom Sheet on `<md`, Dialog on `md+` |
| `DateRangePicker` | ✅ | ZhiPay format: quick-select sidebar (Today / Yesterday / 7d / 30d / Custom) + 2-month calendar with custom prev/next header + Apply/Cancel footer. `DateRangeValue` API (preset keys + optional customFrom/customTo); helpers `resolveDateRange()` + `useDateRangeLabel()` in sibling [`dateRange.ts`](../src/components/shared/dateRange.ts). Trigger via `children` asChild. Mobile collapses to single month. |
| `TreePicker` | ✅ | Recursive checkbox tree |

## Outstanding follow-ups

- Chord listener (`g d`, `g s`, `g p`, `g y`, `g r`, `g ,`) — wire into `useKeyboardShortcuts` or a separate hook.
- Real auth wiring (currently sessionStorage placeholder; idle timeout works).
- Dark-mode token coverage QA across every component.
- `/api/organization` endpoint — Dashboard institution subtitle uses a placeholder constant until this lands.
- Dashboard date-range filter — MSW handlers accept `?range=&from=&to=` but the seed isn't date-windowed; wire when backend/fixtures need it.
- Dashboard panel deep-links target `/payments/transactions`, `/payments/pending`, `/payments/pending?tab=overdue` — all resolve to `<Placeholder />` today.
- Sidebar role-aware filtering registry — decide which items each role sees.
- Feature pages 4–12 land via subsequent prompts (students, transactions, pending, refunds, reports, payouts, settings).
- `docs/models.md`, `docs/product_requirements_document.md`, `docs/mermaid_schemas/` — not yet present; spawn when feature work begins.
