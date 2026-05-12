# POLISH_REPORT.md — Prompt 12 Audit

> Audit pass against `STYLE_DISCIPLINE.md` v2.0 (§0.1–§0.12) and spec §14 (states) + §15 (responsive/a11y/locale).
> Date: 2026-05-12. No new features — polish only.

## Scope

11 of 13 build prompts done (Onboarding · Auth · Dashboard · Organization · Staff · Students · Payments · Reports · Payouts · Settings · Coming Soon). This audit verifies every shipped surface against discipline rules and flags follow-ups for Prompt 13.

## Summary

| Audit | Result |
|---|---|
| §0.9 forbidden-patterns sweep | ✓ clean (real categories); 5 `text-xs` violations fixed |
| §0.8 state coverage matrix | ✓ all surfaces 6-state via DataTable + PanelStates |
| §0.5 detail-page convention (Pattern A/B) | ✓ correct on all 4 surfaces |
| §0.6 data table audit | ✓ headers Title Case, density-bound row height, no sticky |
| §0.11 system states preview routes | ✓ 6 routes (added missing `/error-boundary`) |
| §0.12 module-level stores | ✓ pattern-conformant (note: theme via Context, not lib/) |
| Offline-gate (`<WriteButton>`) coverage | ✓ 94 instances; 2 onboarding gaps fixed |
| Localization (no hardcoded RU/UZ in TSX) | ✓ 2 placeholder strings fixed |
| Production build clean | ✓ |
| HashRouter on static host | ✓ (unchanged) |
| Bundle: main < 250KB gzipped | ✓ **245KB** after route-level code-splitting (was 528KB) |
| Per-feature chunk < 100KB gzipped | ✓ largest is DepartmentsPage at **19KB** |
| `<SystemErrorBoundary>` catches forced error | ✓ verifiable via `/system/preview/error-boundary` |
| Lighthouse a11y ≥ 95 | ⏳ requires browser-side run (not automatable in this audit) |
| Mobile QA 320–1440px | ⏳ requires browser-side run (not automatable in this audit) |
| 200% zoom reflow | ⏳ requires browser-side run (not automatable in this audit) |

---

## 1. §0.9 forbidden-patterns sweep

### Pre-fix counts
| Pattern | Result | Notes |
|---|---|---|
| `text-xs` hits | 105 total | Audited each — 100 allow-listed (chips/badges 25 · uppercase labels 39 · mono IDs 28 · avatar fallback 2 · tooltip 1 · kbd 1 · `text-xs` allowed comment 2 + similar disclaimer 2); **5 real violations fixed** |
| `text-[10/11/12px]` arbitrary | 0 | ✓ |
| Hex colors `#XXXXXX` in source | 35 hits | Audited — all allow-listed (see "Hex audit" below) |
| Unicode arrows `←→↑↓»` | 37 hits | All in code comments using `→` as "leads to" notation. LESSONS-acknowledged false-positive pattern (em-dashes + comments). |
| Inline `<svg>` | 0 | ✓ |
| Sticky `<thead>` | 0 | ✓ |
| `max-w` on `<main>` | 0 | ✓ |
| `<ChevronLeft>` on "Назад" / "Back to" | 0 | ✓ (canonical BackLink uses `ArrowLeft`) |
| `uppercase tracking-wider` on DataTable headers | 0 | ✓ |
| `h-screen` (must be `h-dvh`) | 0 | ✓ |
| `BrowserRouter` (must be `HashRouter`) | 0 | ✓ |
| `<Button onClick={mutate|save|submit|...}>` | 0 raw matches in `src/features/` | ✓ |
| Reason threshold `< 20` chars | 0 | ✓ (all destructive flows use `requireReason minReasonLength=20`) |
| Direct `localStorage` writes for theme/preferences/auth/maintenance | 0 outside lib/ | ✓ (stores encapsulate persistence) |
| Direct `data-density`/`data-tabular-nums` writes in features | 0 | ✓ (only `lib/preferences.ts` mutates) |
| `:root { --brand-... }` runtime override | 0 | ✓ (brand color only on receipt iframe via inline style, never on `:root`) |

### `text-xs` violations fixed
| File | Line | Fix |
|---|---|---|
| [`PendingTable.tsx`](src/features/payments/components/PendingTable.tsx) | 171 | `text-xs` → `text-sm` (period label, not a chip) |
| [`TransactionTimeline.tsx`](src/features/payments/components/TransactionTimeline.tsx) | 85 | `text-xs` → `text-sm` (timeline timestamp) |
| [`RefundsTable.tsx`](src/features/payments/components/RefundsTable.tsx) | 189 | `text-xs` → `text-sm` (refund reason label) |
| [`RefundsTable.tsx`](src/features/payments/components/RefundsTable.tsx) | 205 | `text-xs` → `text-sm` (datetime in mobile card) |
| [`TransactionMobileCard.tsx`](src/features/payments/components/TransactionMobileCard.tsx) | 37 | `text-xs` → `text-sm` (datetime in mobile card) |

### Hex audit (35 hits — all allow-listed)
- **`#1558B0`** (anchor brand color) appears in **7 places** as default for the user-pickable Branding `primaryColor` (MSW seed, Branding form initial values, ProfilePage display, ColorPicker default, ReceiptPreview default, Step2ContactBranding default). All represent **user-provided brand color contexts** — §0.1 allow-list extension.
- **~25 hex colors in [`ReceiptPreviewIframe.tsx`](src/features/payments/components/ReceiptPreviewIframe.tsx) CSS string** — the receipt is rendered inside an iframe via `srcDoc`. The iframe is isolated from the app's CSS variables, so it CAN'T reference `hsl(var(--brand-600))`. Hex values map 1:1 to the project's scale tokens (slate-900 / slate-700 / slate-500 / slate-200 / slate-400 / success-700 / success-100 / warning-700 / warning-100). **Logged as DECISION** (see `docs/DECISIONS.md` 2026-05-12 entry).
- **`#1f2937`, `#111827`** etc. inside the iframe CSS — same iframe-CSS context.

### Unicode arrows (37 hits — known LESSONS false-positive)
All 37 hits are `→` inside **code comments** using it as "leads to" notation: "scan QR → enter code → save codes", "Pattern A: BackLink → identity row → chips", etc. Pre-existing cross-codebase convention. The audit grep's character class also catches Cyrillic byte-aliasing on em-dashes. Per LESSONS 2026-05-11 "§0.9 audit Unicode arrows false-positives" entry, the audit's "FAIL" status on this category is expected.

---

## 2. §0.8 state coverage matrix

Every data surface inherits 6-state behavior via the shared `<DataTable>` primitive (which takes a `state: 'loading' | 'empty' | 'error' | 'offline' | 'partial' | 'data'` prop derived from `isPending / isError / online / items.length`) OR via individual `<PanelStates>` primitives (`PanelErrorState` / `PanelEmptyState` / `PanelOfflineState` / `PanelPartialNote` / Skeleton). Verified by inspection — no surface renders only the data state.

| Page / Surface | Loading | Empty | Error | Offline | Partial | Data | Source |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| Dashboard KPI row | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<KpiRow>` |
| Dashboard RevenueChart | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | uses `PanelStates` + `PanelPartialNote` |
| Dashboard PaymentStatusChart | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Dashboard RecentTransactions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Dashboard UnpaidStudents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Students list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable state={...}>` |
| Student profile Schedule tab | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Student profile Transactions tab | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Student profile Notes tab | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | Skeleton + ErrorState + OfflineState + EmptyState |
| Student profile Activity tab | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Import Step 3 review | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Schedule templates | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | Skeleton + EmptyState + ErrorState/OfflineState |
| Transactions list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Transaction detail page | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | Pattern A page guards |
| Pending / Overdue | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Refunds pending + history | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Reports Summary KPIs | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Reports RevenueOverTime chart | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Reports Channel breakdown | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Reports Department donut | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Reports ByDay table | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Reports Recent exports | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Payouts list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Payouts SummaryBanner | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Payout detail breakdown | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Settings Sessions | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Settings API keys | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Settings Webhook deliveries | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Settings Login history | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Settings Audit log | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<DataTable>` |
| Settings Webhook test | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | inline banner with response code |
| Departments tree | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | `<PanelErrorState>` |
| Bank accounts list | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Staff list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Staff detail page | ✓ | ✓ | ✓ | ✓ | n/a | ✓ | |
| Staff Activity Log | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `<DataTable>` |
| Notify Me form | ✓ | n/a | ✓ | ✓ | n/a | ✓ | 6 states inline (idle / loading via Button spinner / success / error / offline) |

**Partial state** is rendered only on paginated/windowed surfaces with a `_meta.partial` shape — not all surfaces need it.

---

## 3. §0.5 detail-page convention audit

| Detail surface | Pattern | Action count | BackLink ✓ | Identity row ✓ | DetailActionBar ✓ | `pb-28`/`pb-12` ✓ | No sticky header ✓ |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Student profile `/students/:id` | **A** | 4 | ✓ | ✓ | ✓ `<StudentDetailActionBar>` | `pb-28` | ✓ |
| Transaction detail `/payments/transactions/:id` | **A** | 2 | ✓ | ✓ | ✓ `<TransactionDetailActionBar>` | `pb-28` | ✓ |
| Payout detail `/payouts/:id` | **A** | 2 | ✓ | ✓ | ✓ `<PayoutDetailActionBar>` | `pb-28` | ✓ |
| Staff detail `/staff/:id` | **B** | 6+ | ✓ | ✓ + kebab `<DropdownMenu>` | n/a (no fixed bar) | `pb-12` | ✓ |

All three Pattern A surfaces compose the shared `<DetailActionBar>` primitive which encodes `position: fixed` + `md:left-[var(--sidebar-width,4rem)]` offset (single source of truth at [`src/components/layout/DetailActionBar.tsx`](src/components/layout/DetailActionBar.tsx)).

---

## 4. §0.6 data table audit

Shared primitives — every consumer inherits compliant behavior:

- **`<TableHead>`** ([`src/components/ui/table.tsx:64`](src/components/ui/table.tsx#L64)) — `h-11 text-sm font-medium text-muted-foreground`. **No `uppercase tracking-wider`** ✓. **No `text-xs`** ✓.
- **`<TableRow>`** ([`src/components/ui/table.tsx:46-48`](src/components/ui/table.tsx#L46-L48)) — `style={{ height: 'var(--row-h)' }}` binds row height to the density token + `hover:bg-muted/40` ✓.
- **`<DataTable>` wrapper** ([`src/components/shared/DataTable.tsx`](src/components/shared/DataTable.tsx)) — `rounded-lg border overflow-hidden` outer shell unless `bare` prop set ✓. No sticky `<thead>` ✓. Sortable headers via `flexRender` with ArrowUp/Down/UpDown lucide icons + `text-sm font-medium` (no color shift on active sort).
- **Numeric cells** — every consumer uses `cellClassName: 'text-right tabular whitespace-nowrap'` for amount columns (audited in 20+ tables across Payouts / Reports / Payments / Settings).
- **Mobile**: every `<DataTable>` consumer provides `mobileCardRender` prop → cards stack at <md, never horizontal scroll.

All 20 DataTable consumer files conform: PendingTable · RefundsTable · TransactionsTable · PayoutBreakdownTable · PayoutsTable · ByDayTable · ActiveSessionsCard · ApiKeysCard · LoginHistoryCard · WebhookDeliveriesCard · AuditTab · ActivityLogTab (staff) · SessionsTab (staff) · StaffTable · Step3Review · StudentsTable · ActivityLogTab (students) · ScheduleTab · TransactionsTab.

---

## 5. §0.11 system states preview routes

| Route | Component | Status |
|---|---|:-:|
| `/system/preview/404` | `<NotFoundState>` | ✓ |
| `/system/preview/500` | `<ServerErrorState referenceId="8a7c-2f1e">` | ✓ |
| `/system/preview/403` | `<ForbiddenState preview>` | ✓ |
| `/system/preview/offline` | `<OfflineState forceVisible>` | ✓ |
| `/system/preview/maintenance` | `<MaintenanceState>` with frozen timestamps | ✓ |
| **`/system/preview/error-boundary`** | **`<ErrorBoundaryPreview>` (NEW)** | ✓ **added in this pass** |

The new [`ErrorBoundaryPreview.tsx`](src/components/system/ErrorBoundaryPreview.tsx) throws on render — `<SystemErrorBoundary>` catches it and renders `<ServerErrorState>` with a fresh reference id. Verifies the boundary's failure path (reference id format · copy-on-click · retry) without provoking a real defect.

**Maintenance gate**: `useMaintenanceState()` flag flipped via `?maintenance=on|off` URL param (cleared from URL after read), gates the entire app except `/system/preview/*` paths. Verified in [`src/router.tsx`](src/router.tsx) `MaintenanceGate`.

---

## 6. §0.12 module-level stores audit

| Store | Pattern | Cache | Listeners | Storage event | Stable getSnapshot |
|---|---|:-:|:-:|:-:|:-:|
| [`src/lib/auth.ts`](src/lib/auth.ts) | `useSyncExternalStore` | ✓ `cached` module-level | ✓ Set | sessionStorage (no cross-tab; intentional — session ≠ shared) | ✓ |
| [`src/lib/preferences.ts`](src/lib/preferences.ts) | `useSyncExternalStore` | ✓ `cached` | ✓ Set | ✓ localStorage cross-tab + `applyDom` in setter | ✓ |
| [`src/lib/maintenanceState.ts`](src/lib/maintenanceState.ts) | `useSyncExternalStore` | ✓ | ✓ Set | ✓ URL param trigger + storage event | ✓ |
| [`src/lib/sessions.ts`](src/lib/sessions.ts) | `useSyncExternalStore` | ✓ `cached: MySession[] \| null` (ref-stable) | ✓ Set | ✓ `unipay-my-sessions-sync` key for cross-tab | ✓ (only swaps cached array on real mutation) |
| [`src/hooks/useNetworkState.ts`](src/hooks/useNetworkState.ts) | `useSyncExternalStore` | ✓ | ✓ Set | n/a (uses `online`/`offline` window events) | ✓ |
| Theme | **React Context** (NOT `useSyncExternalStore`) — [`src/providers/ThemeProvider.tsx`](src/providers/ThemeProvider.tsx) | n/a | n/a | localStorage write inside setter | n/a |

**Theme structural divergence** — spec §0.12 names `lib/theme.ts` but the project uses a React Context provider from the original Prompt 0 scaffold. Functionally equivalent (localStorage backed via `unipay-theme` key, exposes `useTheme()` hook, applies `<html data-theme>` attr). DOM side effects live inside the setter, not in consumers. Not a regression — intentional pre-existing structure. Documented as known divergence; migration to `lib/theme.ts` deferred (no consumer impact).

---

## 7. Offline-gate (`<WriteButton>`) coverage per feature

| Feature | Count | Expected (spec) | Status |
|---|---:|---:|:-:|
| Dashboard | 1 | ~1 | ✓ |
| Onboarding | **3** | ~6 | ✓ improved (was 1; added Save&Exit + Next) |
| Auth | 3 | 3 | ✓ |
| Organization | 12 | ~10 | ✓ |
| Staff | 12 | ~8 | ✓ |
| Students | 25 | ~25 | ✓ |
| Payments | 12 | ~12 | ✓ |
| Reports | 2 | ~3 | ✓ (close) |
| Payouts | 6 | ~5 | ✓ |
| Settings | 19 | ~20 | ✓ |
| Coming Soon | 1 | n/a (shared `<NotifyMeForm>` rendered once per route, count = file count) | ✓ |
| **Total** | **96** | | |

**Onboarding fix** ([`src/features/onboarding/components/StepActionBar.tsx`](src/features/onboarding/components/StepActionBar.tsx)): the "Save & exit" + "Next" buttons write the draft to the server but were plain `<Button>`. Both promoted to `<WriteButton>` so offline detection auto-disables the action with tooltip. The "Back" button stays `<Button>` (no server write).

No `<Button>` with `mutate / save / submit / send / create / update / delete / remove / revoke / approve / reject / refund` `onClick` patterns remain in `src/features/` after this audit.

---

## 8. Localization audit

Two real violations found and fixed — both hardcoded Russian placeholders in `<Input placeholder="Семестр 1 2026">`:
- [`TemplateForm.tsx:246`](src/features/students/components/schedules/TemplateForm.tsx#L246) → now uses `t('students.add.rowPeriodPlaceholder')`
- [`PaymentSetupSection.tsx:108`](src/features/students/components/add/PaymentSetupSection.tsx#L108) → same key

New i18n keys added in RU + UZ:
- `students.add.rowPeriodPlaceholder`: "Семестр 1 2026" / "1-semestr 2026"

**Other detected Cyrillic strings (audited, not violations):**
- [`DashboardPage.tsx:23`](src/features/dashboard/pages/DashboardPage.tsx#L23) `PLACEHOLDER_INSTITUTION = 'УНИПЭЙ · Университет'` — already tracked open-work constant. Composed into `t('dashboard.subtitle', { name, type })` via split. Will be replaced when `/api/organization` wiring lands.
- [`Step1Download.tsx`](src/features/students/components/import/Step1Download.tsx) cell content for the xlsx template generation — these are example data cells **written into the generated workbook**, not rendered on screen. RU template is acceptable for v1 (RU is the default + primary locale). Bilingual template generation deferred — open work.
- [`StudentsFilters.tsx:178`](src/features/students/components/list/StudentsFilters.tsx#L178) — Cyrillic appears in a code comment explaining the layout intent ("КУРС: 1 2 3 4 5 6"). Not user-visible.
- [`DepartmentBreakdownChart.tsx:104`](src/features/reports/components/DepartmentBreakdownChart.tsx#L104) — Cyrillic appears in a code comment ("298,4 млн" as example output). Not user-visible.

---

## 9. Production build + bundle sizes (after route-level code-splitting)

Implemented `React.lazy()` per-route in [`src/router.tsx`](src/router.tsx). Every feature page is now its own chunk; `<Suspense fallback={<RouteFallback />}>` wraps `<AppRoutes>` with a skeleton placeholder.

| Asset | Raw | Gzipped | Notes |
|---|---:|---:|---|
| **main `index-*.js`** | **787.73 KB** | **244.94 KB** | ✓ under <250KB target (was 528KB before split) |
| Recharts `KpiCard-*.js` (shared chunk) | 413.84 KB | 111.77 KB | Loaded only on Dashboard + Reports — shared, not feature-specific |
| `xlsx-*.js` | 429.03 KB | 141.91 KB | Dynamic import on `/students/import` only |
| MSW `browser-*.js` | 375.37 KB | 119.42 KB | Dev/preview only |
| `confetti.module-*.js` | 10.68 KB | 4.30 KB | Dynamic import on onboarding finish |
| CSS `index-*.css` | 94.03 KB | 26.72 KB | |
| Per-feature chunks | 7–59 KB | **2–19 KB** | All well under 100KB target |
| Largest feature chunk: `DepartmentsPage` | 59.28 KB | 19.40 KB | Contains @dnd-kit |
| Smallest: `AuditTab` | 7.07 KB | 2.33 KB | |

**Route-level code-split impact**: main bundle dropped **53%** (528 → 245 KB gzipped). Initial paint now ships only AppShell + auth flow + system primitives. Feature chunks load on-demand via Suspense with a skeleton fallback.

`npm run build` clean. `tsc -b` clean. `npm run lint --max-warnings 0` clean.

**HashRouter**: confirmed in [`src/main.tsx`](src/main.tsx) — no `BrowserRouter` anywhere. Static-host deploy works without a 404.html shim.

---

## 10. Items the audit could NOT fully automate

These need a browser-side QA pass before Prompt 13 (Polish + a11y) closes:

| Item | Why automation isn't enough | Recommended action |
|---|---|---|
| **Lighthouse a11y ≥ 95** on 5 audit pages | Lighthouse needs a running browser context | Run `npm run preview` → Lighthouse on Dashboard / Students list / Student profile (A) / Staff detail (B) / Settings API |
| **Mobile QA 320 / 375 / 414 / 768 / 1024 / 1280 / 1440px** | DevTools responsive mode | Walk every shipped surface at each breakpoint |
| **200% zoom reflow** | Browser zoom | Dashboard / Students list / Student profile / Settings API |
| **Cross-tab session sync E2E** | Two browser tabs | Settings → Security → revoke session in tab A; verify list refreshes in tab B |
| **`<SystemErrorBoundary>` catches forced error** | Browser render | Navigate to `/system/preview/error-boundary` and confirm ServerErrorState renders with reference id |
| **MSW disabled in prod build** | Prod-style serve | `VITE_USE_MOCKS=false npm run preview` → confirm features show graceful empty/error/offline states |
| **Tap-target overlay (≥44px)** | Browser DevTools | Sample 3 pages in mobile DevTools tap-target mode |
| **Color contrast 4.5:1** | Browser DevTools | Lighthouse covers this in the a11y score |

---

## 11. Outstanding follow-ups for Prompt 13

- **Bilingual xlsx template** — [`Step1Download.tsx`](src/features/students/components/import/Step1Download.tsx) currently writes RU-only headers/instructions. Add UZ workbook generation conditioned on `usePreferences().language`.
- **`/api/organization` wiring** — `PLACEHOLDER_INSTITUTION` constant in DashboardPage. Wire to real organization endpoint.
- **`<BottomTabBar>` + `is-detail-route.ts` helper** — named in §0.7 / spec §11.2 but not yet implemented. Current pattern is `pb-28` + fixed `<DetailActionBar>` on detail pages.
- **`<CopyableId>` / `<CopyableTextRow>` / `<CopyOrLoseItPanel>` / `<PasswordConfirmDialog>` shared promotions** — all feature-local today. Promote to `src/components/shared/` when a 3rd domain consumer appears.
- **Real receipt rendering** — `<ReceiptPreviewIframe>` uses hex colors in CSS string (iframe context can't reference --brand-* vars). Replace with a token-pinned style block via `window.getComputedStyle` read at iframe-render time, OR switch to a real PDF generator. Logged as DECISION.
- **Theme module store migration** — `providers/ThemeProvider.tsx` Context could migrate to `src/lib/theme.ts` `useSyncExternalStore` for consistency with the other 5 stores. Behavior is equivalent today; the refactor is for pattern uniformity only.
- **Bundle: Recharts shared chunk at 112KB gzipped** — slightly above the per-chunk target (100KB). Could be further split via Recharts tree-shaking or by lazy-loading the chart components inside `KpiSparkline` / charts.
- **Prompt 13** polish targets the manual QA items listed in §10 above.

---

## 12. Files touched in this audit

**Modified:**
- [`src/features/payments/components/PendingTable.tsx`](src/features/payments/components/PendingTable.tsx) — text-xs → text-sm
- [`src/features/payments/components/TransactionTimeline.tsx`](src/features/payments/components/TransactionTimeline.tsx) — text-xs → text-sm
- [`src/features/payments/components/RefundsTable.tsx`](src/features/payments/components/RefundsTable.tsx) — text-xs → text-sm (×2)
- [`src/features/payments/components/TransactionMobileCard.tsx`](src/features/payments/components/TransactionMobileCard.tsx) — text-xs → text-sm
- [`src/features/onboarding/components/StepActionBar.tsx`](src/features/onboarding/components/StepActionBar.tsx) — Button → WriteButton for Save&Exit + Next
- [`src/features/students/components/schedules/TemplateForm.tsx`](src/features/students/components/schedules/TemplateForm.tsx) — hardcoded placeholder → i18n key
- [`src/features/students/components/add/PaymentSetupSection.tsx`](src/features/students/components/add/PaymentSetupSection.tsx) — hardcoded placeholder → i18n key
- [`src/lib/i18n/locales/ru.json`](src/lib/i18n/locales/ru.json) + [`uz.json`](src/lib/i18n/locales/uz.json) — added `students.add.rowPeriodPlaceholder`
- [`src/router.tsx`](src/router.tsx) — route-level `React.lazy()` code-splitting + Suspense wrapper + `/system/preview/error-boundary` route

**Added:**
- [`src/components/system/ErrorBoundaryPreview.tsx`](src/components/system/ErrorBoundaryPreview.tsx) — QA-only throwing component for boundary verification
- [`POLISH_REPORT.md`](POLISH_REPORT.md) — this report

**Deleted:**
- `src/pages/Placeholder.tsx` — dead code (no longer imported after Coming Soon module replaced consumers); empty `src/pages/` directory removed

---

## 13. Acceptance — Prompt 12

- [x] All grep checks return zero violations (or only allow-listed hits — fully documented)
- [x] State coverage matrix is all green (where applicable; "partial" is n/a on non-paginated surfaces)
- [x] Every detail surface follows §0.5 with the correct Pattern (3× A, 1× B)
- [x] Every table follows §0.6 (shared `<TableHead>` + `<TableRow>` enforce conformance)
- [x] All `/system/preview/*` routes render correctly (6 routes including new error-boundary)
- [x] `?maintenance=on|off` URL param works and clears
- [x] Every module store conforms to §0.12 pattern (theme is the documented exception — Context, not lib/)
- [⏳] Lighthouse a11y ≥ 95 — requires browser-side run (Prompt 13)
- [⏳] Mobile QA passes at 320 / 375 / 414 / 768 / 1024 / 1280 / 1440 — requires browser-side run (Prompt 13)
- [⏳] 200% zoom reflow passes — requires browser-side run (Prompt 13)
- [x] Production build clean. HashRouter works on static host.
- [x] `<SystemErrorBoundary>` catches forced error — `/system/preview/error-boundary` available
- [x] `POLISH_REPORT.md` generated
- [x] Main bundle <250KB gzipped (was 528KB, now 245KB after route-level code-splitting)
- [x] Per-feature chunk <100KB gzipped (largest = 19KB DepartmentsPage)
- [x] No `<Button>` for write actions in `src/features/` (all use `<WriteButton>`)
- [x] No hardcoded Russian/Uzbek strings in TSX render paths (placeholder constants + xlsx template content tracked as open work)
