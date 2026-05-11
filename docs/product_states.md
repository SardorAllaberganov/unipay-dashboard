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
| MSW worker in production builds (demo deploy) | ✅ | DEV-only gate dropped in [`main.tsx`](../src/main.tsx); `worker.start()` takes `serviceWorker.url` built from `import.meta.env.BASE_URL` so the worker resolves under both `/` (dev) and `/unipay-dashboard/` (Pages). ~97 KB gzipped chunk. Gate behind `VITE_USE_MOCKS` when the real backend lands. See DECISIONS 2026-05-11. |
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
| Organization feature module (`src/features/organization/`) | ✅ | 5 sub-pages + 2 add-pages, 7 components, 8 hooks, schemas, api.ts. Nested route layout with horizontal-scroll tabs. dnd-kit tree with delay-based touch activation + cycle prevention. |
| MSW handler `mocks/handlers/organization.ts` | ✅ | 16 endpoints, TATU org fixture, 111-node tree (3×4×2×3), 2 bank accounts, server-side `setTimeout(5000)` verification flip. `?_state=partial\|empty\|error` QA override on every GET. |
| `Organization`, `Branding`, `LegalForm`, `OrgType` domain types | ✅ | Added to `src/types/domain.ts`. `OrgType` and `LegalForm` re-exported from `features/onboarding/schemas.ts` for back-compat. |
| Shared `LogoUploader` / `ColorPicker` / `ReceiptPreview` | ✅ | Promoted from `features/onboarding/components/` to `src/components/shared/`. `LogoUploader` parameterized with `labels` + `maxSizeBytes` + `minDimensions` + `accept`. Receipt copy moved to `common.receipt.*` namespace. |
| `@dnd-kit/{core,sortable,utilities}` | ✅ | Departments tree drag/drop. **Split sensors:** `MouseSensor { distance: 4 }` for instant desktop drag + `TouchSensor { delay: 250, tolerance: 8 }` (long-press touch). `<DragOverlay>` portaled to `document.body` with `zIndex={40}` (below Radix Dialog z-50). Source row dims to `opacity: 0.4` and stays in tree slot — no layout shift. Root drop banner is absolute-positioned over the top of the scroll area (zero shift on drag start) + `closestCenter` + `MeasuringStrategy.Always` so root-drop reliably registers. |
| Staff feature module (`src/features/staff/`) | ✅ | Folders: `pages/` (List + Detail) · `components/{list,detail,dialogs,shared}/` · `hooks/` · `schemas.ts` · `api.ts`. 2 pages + 7 detail components + 9 dialogs + 9 hooks. Reuses shared `<RoleBadge>` (deviation logged), §0.5 Pattern B, full Pattern-B kebab with 10 actions, permissions matrix via `ROLE_PERMISSIONS`, cross-tab sessions sync via storage event. |
| MSW handler `mocks/handlers/staff.ts` | ✅ | 15 endpoints (list / detail w/ permissions snapshot / activity w/ filters / sessions / invite / patch / deactivate / reactivate / reset-password / resend-invite / cancel-invite / delete-account / transfer-ownership / revoke-session / revoke-all-others). Seed: 1 owner + 2 finance + 3 operators + 1 viewer + 2 pending invites; ~180 activity entries with `ip`+`device`; 10 sessions across active members. `?_state=partial\|empty\|error` honored. |
| `DataTable` extension — `rowHref` + `onRowClick` + `rowClassName` | ✅ | When `rowHref(row) => string` provided, rows render as semantic links: plain click → SPA navigate, cmd/ctrl/shift-click → new tab, middle-click via `onAuxClick`, Enter/Space activates, `role="link"`, `tabIndex={0}`. Optional `getRowNavigateState` passes React Router state (used by `<StaffTable>` to preserve list URL for the back link). `rowClassName(row)` adds per-row classes (used for pending-invite `before:` accent stripe). |
| `DetailPageSkeleton` shared primitive | ✅ | `src/components/shared/DetailPageSkeleton.tsx` — §0.5-shaped skeleton (back-link row + identity row + chips + tab strip + body). Configurable via `avatar` / `chips` / `tabs` props. Used by `StaffDetailPage` loading state; future detail pages (Student / Transaction / Payout) consume the same primitive. |
| `ConfirmDialog` default-label fix | ✅ | Cancel + Confirm fallbacks were `t('common.cancel')` / `t('common.confirm')` which return the literal keys (the actual keys live at `common.actions.cancel` / `common.actions.confirm`). Fixed in `src/components/shared/ConfirmDialog.tsx`. |
| `StaffSession` + `StaffPermission` + `ROLE_PERMISSIONS` domain types | ✅ | Added to `src/types/domain.ts`. Static role→permission matrix for the 4 roles × 6 resources × `{read, write, destructive}`. Powers the Role & Permissions tab matrix and the EditRoleDialog live diff until a real backend permissions API lands. |
| Students feature module (`src/features/students/`) | ✅ | 5 pages (List / Add / Detail / Schedules / Import) + 22 components (`list/` × 6 · `add/` × 3 · `profile/` × 9 · `schedules/` × 3 · `shared/` × 1) + 9 hooks + `schemas.ts` + `api.ts`. Pattern A on Add / Detail / Import / Schedules. Detail = 2-col on `lg+` (Personal/Academic cards left + 4 underline tabs right: Schedule / Transactions / Notes / Activity). Inline-edit cells on Schedule rows (`text-sm` minimum, Enter saves / Esc cancels / blur commits). 4-step Import wizard with internal step state; xlsx template + error report via dynamic-import. Bulk select with fixed-bottom `<BulkActionBar>` (remind / export / change-dept / deactivate-with-reason ≥20). |
| MSW handler `mocks/handlers/students.ts` | ✅ | 24 endpoints. Deterministic seed via `mulberry32(0x5740e7)` — 200+ students distributed across 72 group leaves of the existing 111-node tree, 2–3 schedule rows per student with realistic paid/partial/overdue mix, transactions tied to paid/partial rows, 0–2 notes per student, 3–6 activity entries per student, 3 pre-seeded schedule templates. List filter accepts `search` / `departmentId[]` (with subtree expansion through ancestor walk) / `year[]` / `paymentStatus[]` / `educationType[]` / `status[]` + pagination. Import `POST /parse` fabricates 25–44 rows with ~15% deliberate errors + 1 duplicate-studentId planted; `POST /commit` requires reason ≥20 when committed count > 100. `?_state=partial\|empty\|error` honored on every GET. |
| Students domain types (`src/types/domain.ts`) | ✅ | `StudentPaymentStatus = 'paid'\|'partial'\|'pending'\|'overdue'` (distinct from transaction `PaymentStatus`), `PaymentType = 'tuition'\|'dormitory'\|'other'`, `ScheduleRow` + `ScheduleRowStatus`, `ScheduleTemplate` (single-amount or per-dept amounts), `StudentNote` (append-only), 15-action `StudentActivityAction` + `StudentActivityEntry`, `ImportRow` + `ImportRowError` + `ImportSession`. `Student.paymentStatus` re-typed to `StudentPaymentStatus`; `Student` extended with optional `lastPaymentAt` / `createdAt` / `updatedAt`. |
| Shared `<TreePicker>` (generic) | ✅ | `src/components/shared/TreePicker.tsx` — over `TreeItem<TMeta>[]` flat shape with `parentId: string \| null`. `mode: 'single' \| 'multi'`; multi supports `subtreeToggle?: boolean` (default `true`). Optional `leafOnly` restricts single-mode to terminal nodes. Search with ancestor auto-expand, optional `renderMeta`. Consumed 5 places in Students module (list filter / Add Student / EditStudentSheet / Apply Template / Change Department bulk). |
| `<PanelStates>` promoted to `src/components/shared/` | ✅ | Moved from `features/dashboard/components/`. 9 importers repointed (5 dashboard + 4 organization). Default empty-state copy switched to `common.states.noData` (generic); dashboard's `RecentTransactions` + `UnpaidStudents` pass explicit `body={t('dashboard.empty.noData')}` to preserve period-specific copy. Resolves the Prompt 4 cross-feature-import flag. |
| `<DataTable>` per-column `ColumnMeta` (`headerClassName` / `cellClassName` / `cellColSpan`) | ✅ | TanStack `react-table` module augmentation. Lets consumers collapse actions / status / amount columns to content via `meta: { headerClassName: 'w-[1%]' }`, right-align with `cellClassName: 'text-right'`, or merge tail cells per row via `cellColSpan: (row) => N`. First merge consumer: staff list pending rows merge `status + actions` so the "Ожидает" badge + kebab share a single right-aligned cell. Body row renderer walks cells with a skip counter to honor the colSpan. |
| `<DialogFooter>` mobile gap fix | ✅ | shadcn primitive originally used `sm:space-x-2` which left mobile (`flex-col-reverse`) with zero gap between stacked buttons. Now uses `gap-2` (works on both axes). Affects every Dialog / ConfirmDialog. |
| `<DialogHeader>` text alignment | ✅ | Changed from `text-center sm:text-left` to `text-left` always. The shadcn default conflicted with `ConfirmDialog`'s flex-wrapped title (left-aligned by flex) vs description (inheriting mobile text-center) producing mismatched headers. |
| Native date / time input picker indicator styling | ✅ | [`globals.css`](../src/styles/globals.css) — `justify-content: space-between` on `input[type='date' \| 'datetime-local' \| 'month' \| 'time' \| 'week']` so the native date editor sits flush-left and the calendar indicator flush-right (shadcn's base `flex` packed them together otherwise). Indicator styled with `margin-left: auto` + visible muted-foreground tone + dark-mode `filter: invert()`. |
| `<StatusBadge>` `'partial'` variant | ✅ | New variant: `CircleDot` icon + `info` tone. Used by Student list / Schedule row status. Added `status.partial` i18n key (RU+UZ). |
| `<WriteButton>` offline tooltip i18n | ✅ | Tooltip now reads `t('common.offline.tooltip')` instead of hardcoded RU. Added `common.offline.tooltip` to ru.json + uz.json. |
| `<ErrorState>` + `<OfflineState>` i18n key fix | ✅ | Stale paths `states.errorTitle` / `states.errorDescription` / `states.offlineTitle` / `states.offlineDescription` / `common.retry` repointed to canonical `common.states.errorTitle` / `common.states.errorBody` / `system.offline.title` / `system.offline.body` / `common.actions.retry`. Visible symptom (literal key strings in the UI) gone. |
| `BigInt.prototype.toJSON` global patch | ✅ | One-line patch in [`src/main.tsx`](../src/main.tsx) so `JSON.stringify` serializes `bigint` as a JSON number. Required by MSW handlers that respond with `Money`-bearing objects (`HttpResponse.json` calls `JSON.stringify`, which throws on raw bigint). UZS tiyins fit comfortably in `Number.MAX_SAFE_INTEGER`. |
| `xlsx@0.18.5` (dynamic import only) | ✅ | Used by Import wizard Step 1 (template generator: Students sheet + Instructions sheet) and Step 3 error-report download. Both call sites use `await import('xlsx')` — ships as its own ~142 KB gzip chunk that loads only when the user triggers a download. Main bundle unaffected. |

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
| `/sign-in` | ✅ | RHF + Zod, password show/hide, rememberMe (visual), `?next=` + `?expired=1`, lockout (5/15min), DevRoleSwitcher (DEV-only), async `signIn` via MSW (runs in both dev + prod builds). `defaultValues` pre-fills `owner@unipay.dev` / `demo1234` in every environment for the demo deploy (see DECISIONS 2026-05-11). |
| `/forgot-password` | ✅ | Email form → success view (always 200, no enumeration leak); ArrowLeft "Назад ко входу" |
| `/reset-password` | ✅ | `?token=` required (must start `valid-`); password 8+ letter+digit, confirm; toast + redirect on success/reject |
| `/onboarding/:step` | ✅ | 5 linear steps (org info, contact+branding, bank accounts, departments, invites). Sticky step indicator + fixed action bar (Pattern A). Sidebar nav locked while active. Save & exit + offline queue. Confetti on finish. |
| `/` Dashboard | ✅ | Greeting header + DateRangePicker (ZhiPay format) + 4 KPI cards (1-col mobile · 2-col `sm:` · 4-col `lg:`) + RevenueChart + PaymentStatusChart + RecentTransactions + UnpaidStudents w/ bulk-remind. Full 6-state coverage per panel via `?_state=` QA hook. |
| `/organization` → `/organization/profile` | ✅ | Index route redirects to `profile`. `<OrganizationLayout>` renders `<PageHeader>` + `<OrgTabsNav>` + `<Outlet />`. Mobile-bleed `overflow-x-auto whitespace-nowrap` tabs strip. |
| `/organization/profile` | ✅ | 2-col `md:grid-cols-2`. RHF + Zod profile schema. Left = identity fields (RU/UZ/EN names, type read-only, TIN read-only, legalForm, region, address, website, foundedYear). Right = branding preview card + live `<ReceiptPreview>` + "Edit on Branding tab" link. Bottom Save WriteButton. 6 states. |
| `/organization/departments` | ✅ | 2-pane on `md+` (tree 2fr / detail panel 3fr), mobile = tree + bottom Sheet on tap. Tree: `useDepartments` flat-list + `buildTree` memo, debounced search auto-expands ancestors, `@dnd-kit` drag-drop with `delay:250 tolerance:8` (touch scroll wins by default), cycle-prevention via `descendantIds` banned-set, reparent ConfirmDialog with `requireReason` when affected students > 50. Detail panel form (RU/UZ name, type, headStaffId, paymentTypes checkboxes, notes, read-only studentCount) with Save / Cancel / Delete (cascade-aware ConfirmDialog reason ≥20). 6 states. |
| `/organization/bank-accounts` | ✅ | Card list, 1 per account (`Card overflow-hidden`). Each row: bank icon + name + `<MaskedAccount>` + label + currency + Default badge + verification `<StatusBadge>`. Actions: Set default / Edit (Sheet) / Delete (ConfirmDialog reason ≥20). MSW seeds 2 verified UZS accounts. 6 states. |
| `/organization/branding` | ✅ | 2-col. Left = `<LogoUploader>` (2MB / min 256×256) + delete-logo (ConfirmDialog reason ≥20) + `<ColorPicker>` + receipt-footer Textarea (max 200, char counter). Right = live `<ReceiptPreview>`. Brand color does **not** mutate `:root` — applied inline on receipt header only. |
| `/organization/bank-accounts/new` | ✅ | Standalone page (sibling of OrganizationLayout, no tabs). §0.5 Pattern A: back link → `text-page-title` → form (`max-w-2xl`) → fixed-bottom Cancel/Save action bar. Optimistic create → MSW returns `verification: 'pending'` → server-side `setTimeout(5000)` flips to `'verified'`; client refetch at 5.5s picks it up. |
| `/organization/departments/new[?parentId=X]` | ✅ | Standalone page (sibling of OrganizationLayout, no tabs). §0.5 Pattern A. Reads `?parentId` query for nested adds; surfaces parent name in subtitle. Defaults `type` to `faculty` when root, `department` when nested. |
| `/staff` | ✅ | List page. `<PageHeader>` + Invite WriteButton, `<StaffFilters>` (Search 200ms debounce + Role Select + Status Select; URL params `?q=&role=&status=&page=`), `<StaffTable>` (DataTable consumer with `rowHref` → click/cmd-click/middle-click navigates to `/staff/:id`; pending-invite rows get `before:` warning-600 accent stripe). Row kebab: Open / Edit role / Reset password / (Deactivate \| Cancel invite). 6 states. Mobile: card stack via `mobileCardRender`. |
| `/staff/:id` | ✅ | Full detail page (§0.5 Pattern B). `<StaffDetailHeader>` (back link preserves list URL via `location.state.from`; avatar + name + email + RoleBadge + StatusBadge + kebab pinned top-right of title block; chips row: registered / last login / dept count / invite-sent). 4 tabs (Profile / Role & Permissions / Activity Log / Sessions — Sessions only for own profile or Owner): Profile = single Card with identity header + editable form (fullName/email/phone/locale/timezone via RHF+Zod) + read-only metadata (memberId with copy, createdAt, lastLoginAt, createdBy linked); Role & Permissions = 3 cards (role + matrix `6 resources × {read,write,destructive}` + dept access chips); Activity = filters card (action Select + DateRangePicker) + DataTable with 6 states; Sessions = header card (Revoke-all-others WriteButton) + DataTable (revoke per-row, cross-tab sync via storage event). Tab visual matches `OrgTabsNav` (underline, not segment). |
| `/students` | ✅ | List page with bulk-select Pattern A `<BulkActionBar>` (only renders when rows selected). URL-synced filters: `?q=` search · `?dept=` (comma-joined ids, subtree expansion) · `?year=` 1-6 · `?status=paid,partial,pending,overdue` · `?edu=` full-time/part-time/evening/remote · `?page=`. Filters wrap in a `<FilterStack>` per group (uppercase tracking-wider label above chips); collapsible on mobile via bottom Sheet. 50-per-page pagination. Mobile card layout: identity row + status/balance row + dept·year subtitle + last-payment line. Row kebab: Open / Send SMS / Change Dept / Deactivate (reason ≥20). |
| `/students/new` | ✅ | Standalone Pattern A page (sibling of list). RHF + Zod 3 sections (Personal / Academic / Payment Setup). Async studentId uniqueness via debounced `useCheckStudentId` mutation (Loader2/Check/X icon overlay). Department picker is a single-mode `<TreePicker leafOnly>` so year + group are derived from the leaf path. Payment Setup toggle: apply template → Select; or manual `useFieldArray` rows. Action bar = Cancel · Save-and-add-another (preserves academic dropdowns) · Save-and-close. |
| `/students/:id` | ✅ | Detail page (§0.5 Pattern A: back link + identity row + chips + `pb-28` + fixed-bottom `<StudentDetailActionBar>` with Edit / Send SMS / Deactivate / Delete; Delete is Owner-only behind a tooltip-gated disabled button). 2-col on `lg+`: Personal/Academic cards left + 4 underline-tabs right (matches `<OrgTabsNav>`): Schedule (inline-edit period/type/amount/paid/dueDate cells via `<InlineEditCell>`, Apply Template flow with reason ≥20), Transactions (DataTable + `<TransactionDetailSheet>` right-Sheet ≥md / bottom <md), Notes (append-only timeline + Add note, audit-trail copy), Activity (action Select + DateRangePicker + paginated DataTable). |
| `/students/:id/edit` | ✅ | Standalone Pattern A page (sibling of `/students/:id`, no detail tabs render). RHF + Zod `editProfileSchema` — all personal + academic fields except studentId (read-only post-creation). Two `<Card>` sections (Personal / Academic) inside `max-w-2xl space-y-8`. Fixed-bottom action bar Cancel (ghost, left) + Save (WriteButton, right, `md:justify-between`). Replaces the earlier `<EditStudentSheet>` (deleted) — user wanted page consistency with Add. |
| `/students/import` | ✅ | 4-step wizard (internal step state, single route). Step 1 dynamic-imports `xlsx` and writes a 2-sheet template (Students 13 columns + Instructions field×description×example). Step 2 drag-drop or file picker (.xlsx/.csv, max 5 MB / 5 000 rows). Step 3 inline-edit review table — per-cell error cells get `bg-destructive/10` + `text-sm` error message; PATCH on blur/Enter. Download-error-report button generates xlsx client-side. Step 4 commit; requires reason ≥20 when committed count > 100. Success summary + "К списку студентов" link. |
| `/students/schedules` | ✅ | Card list of `<ScheduleTemplate>` records (small N — not a DataTable). `<TemplateCard>` shows name / type / amount (single or per-dept marker) / period / dueDate / applied-count + Edit / Duplicate / Apply / Delete. Template form in `<ResponsiveSheet>` with amountMode RadioCard toggle, dueDate, periodLabel, appliesTo (TreePicker multi + year chips). Live preview count via debounced `studentsApi.list` total. Apply opens `<ApplyTemplateDialog>` (reason ≥20 + preview count). |
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
| `TreePicker` | ✅ | Generic over `TreeItem<TMeta>[]` flat shape (`parentId: string \| null`). `mode: 'single' \| 'multi'`; multi has `subtreeToggle` (default `true`). Optional `leafOnly` (single-mode group-leaf select), `renderMeta`, search w/ ancestor auto-expand. |
| `InlineEditCell` (feature-local) | ✅ | `src/features/students/components/profile/InlineEditCell.tsx`. Click-to-edit table cell; `text-sm` minimum even in compact density per §0.2. Enter saves (Promise), Esc cancels, blur commits. Pencil icon appears on hover/focus only. Promote to `shared/` when a second feature needs it. |

## Outstanding follow-ups

- Chord listener (`g d`, `g s`, `g p`, `g y`, `g r`, `g ,`) — wire into `useKeyboardShortcuts` or a separate hook.
- Real auth wiring (currently sessionStorage placeholder; idle timeout works).
- Dark-mode token coverage QA across every component.
- Dashboard institution subtitle still uses placeholder constant `УНИПЭЙ · Университет` — wire to the now-available `GET /api/organization` endpoint.
- Dashboard date-range filter — MSW handlers accept `?range=&from=&to=` but the seed isn't date-windowed; wire when backend/fixtures need it.
- Dashboard panel deep-links target `/payments/transactions`, `/payments/pending`, `/payments/pending?tab=overdue` — all resolve to `<Placeholder />` today.
- Sidebar role-aware filtering registry — decide which items each role sees.
- Promote `BankCombobox` (`features/onboarding/components/`) to `src/components/shared/`. Currently cross-feature-imported by Organization. (`PanelStates` already promoted with Prompt 6.)
- Promote `useDepartments` data hook from `features/organization/hooks/` to `src/hooks/` once a third consumer needs it (staff + students cross-feature-import it today).
- Promote `<InlineEditCell>` from `features/students/components/profile/` to `src/components/shared/` when a second feature needs click-to-edit table cells (likely Transactions or Payouts).
- Department detail panel's `headStaffId` is a plain text Input — swap to a real staff Combobox now that `/staff` exists.
- `TemplateForm` per-department amount editing deferred (MSW already accepts `perDepartmentAmounts[]`; UI placeholder only). Add per-dept amount sub-form when a customer asks.
- `TemplateForm.appliesTo.studentIds` individual-student picker deferred. MSW + apply endpoint accept `studentIds[]`; add a searchable `<StudentMultiPicker>` Combobox over `useStudents` when needed.
- Feature pages 7–12 land via subsequent prompts (transactions, pending, refunds, reports, payouts, settings). **Staff (Prompt 5) + Students (Prompt 6) are done.**
- `docs/models.md`, `docs/product_requirements_document.md`, `docs/mermaid_schemas/` — not yet present; spawn when the schema / flow sources of truth need to be canonicalised for the backend team.
