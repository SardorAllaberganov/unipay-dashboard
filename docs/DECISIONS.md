# DECISIONS.md

Log every deviation from `STYLE_DISCIPLINE.md` here.

## Format

For each deviation:

1. **Rule** — the specific § number being deviated from.
2. **Reason** — technical constraint, product requirement, or accessibility trade-off.
3. **Scope** — which file / feature / route is affected.
4. **Review date** — when to revisit and either ratify or revert.

A deviation that isn't logged here is a bug.

---

## 2026-05-12 · Polish (P12) — hex colors inside `<ReceiptPreviewIframe>` srcDoc CSS are allow-listed (iframe context can't reference `--brand-*` variables)

1. **Rule** — §0.1 "Colors via scale tokens; never hardcoded hex in className".
2. **Reason** — [`<ReceiptPreviewIframe>`](../src/features/payments/components/ReceiptPreviewIframe.tsx) renders a printable tuition receipt inside an `<iframe srcDoc={html}>`. The iframe is a separate browsing context with its own CSS scope — it CANNOT resolve `hsl(var(--brand-600))` etc. because the parent's CSS custom properties don't cascade across the iframe boundary. The ~25 hex values in the inline CSS string map 1:1 to the project's scale tokens (slate-900 `#111827` for headings · slate-700 `#1f2937` for body · slate-500 `#6b7280` for muted · slate-200 `#e5e7eb` for borders · slate-400 `#9ca3af` for disclaimer · success-700 `#15803d` + success-light `#dcfce7` for paid status chip · warning-700 `#b45309` + warning-light `#fef3c7` for refunded status chip). They're the resolved hex form of tokens for an iframe-document context, not arbitrary brand drift.
3. **Scope** — [`src/features/payments/components/ReceiptPreviewIframe.tsx`](../src/features/payments/components/ReceiptPreviewIframe.tsx) only. Every other surface still uses scale tokens via `hsl(var(...))`.
4. **Review date** — Revisit when the receipt either (a) becomes a server-rendered PDF (then this whole inline CSS goes away) or (b) gets refactored to read computed style values from the parent at iframe-render time via `window.getComputedStyle(document.documentElement).getPropertyValue('--slate-900')` and inject them as variables on the iframe. Either path eliminates the hex.

## 2026-05-12 · Polish (P12) — also: `#1558B0` (anchor brand color) appears in 7 user-pickable Branding contexts

1. **Rule** — §0.1 "Only static globals.css uses hex; never in className."
2. **Reason** — The Branding flow (Onboarding Step 2 · Organization Profile · Organization Branding tab · ColorPicker primitive · ReceiptPreview primitive · MSW seed · Step2ContactBranding draft) lets the user pick their primary brand color. The DEFAULT value when nothing is picked yet is the anchor `#1558B0` (= `brand-600`). These are explicit defaults for a user-pickable color field — not visual-style decisions baked into class strings. The defaults must be hex because: (a) the picker stores hex in `Branding.primaryColor: string`, (b) the receipt iframe applies it via inline `style.backgroundColor`, (c) HSL conversion is per-render — meaningless at the seed/default level.
3. **Scope** — `'#1558B0'` appears in 7 files as the default for `Branding.primaryColor`: ColorPicker · ReceiptPreview · Step2ContactBranding · ProfilePage · BrandingPage · MSW handler · `<input value={...}>`. Never in className.
4. **Review date** — Stable. If the brand anchor ever moves, update all 7 in one PR.

## 2026-05-12 · Polish (P12) — theme is a React Context (`providers/ThemeProvider.tsx`), not a `lib/theme.ts` `useSyncExternalStore` store

1. **Rule** — §0.12 v2.0 names `src/lib/theme.ts` as a `useSyncExternalStore` module store alongside the other 5 (`auth.ts` · `preferences.ts` · `maintenanceState.ts` · `sessions.ts` · `useNetworkState.ts`).
2. **Reason** — The original Prompt 0 scaffold implemented theme as a React Context provider, and the convention stuck across Prompts 1–11. Functionally the provider is equivalent: localStorage `unipay-theme` key for persistence · cross-tab sync via storage event · DOM side effect (`<html data-theme>` attr) inside the setter · exposes a `useTheme()` hook for consumers. The only difference from the lib/-store pattern is the implementation — Context vs `useSyncExternalStore`. No consumer code would change in a migration; only the implementation. Migrating now risks subtle re-render behavior changes (Context triggers all subscribers on any value change; `useSyncExternalStore` consumers can selectively re-render via stable snapshots), with zero user-facing benefit. The structural divergence is documented; functional parity preserved.
3. **Scope** — [`src/providers/ThemeProvider.tsx`](../src/providers/ThemeProvider.tsx). All theme consumers import `useTheme` from `@/providers/ThemeProvider`. No `src/lib/theme.ts` exists.
4. **Review date** — Revisit if (a) a new module store needs to read theme from outside React (consumer would need `getTheme()` non-React snapshot), or (b) the Context's "re-render all subscribers" semantics cause a measurable performance hit somewhere. Until then, the divergence stays.

## 2026-05-12 · Polish (P12) — route-level code-splitting via `React.lazy()` ships in every feature route except auth

1. **Rule** — Spec §11 Performance acceptance: "every feature route lazy-loaded".
2. **Reason** — Before P12, every feature page was statically imported in `router.tsx`, producing a 528 KB gzipped main bundle (2.0× over the <250KB target). Route-level `React.lazy()` brings that to 245 KB while keeping the auth flow (sign-in / forgot-password / reset-password) and system primitives eager so the unauthenticated entry path has no flash-of-skeleton. Per-feature chunks are now 2–19 KB gzipped each. The Suspense fallback is a lightweight `<RouteFallback>` skeleton mimicking the AppShell content area so the layout shell doesn't blank during chunk loading.
3. **Scope** — [`src/router.tsx`](../src/router.tsx). 22 feature page imports moved from `import X from '...'` to `const X = lazy(() => import('...'))`. Payments pages required named-export normalization (`.then(m => ({ default: m.X }))`) since those pages weren't default-exported originally.
4. **Review date** — Stable. If the Recharts shared chunk (112 KB gzipped) becomes a meaningful TTI cost, split it further via Recharts tree-shaking or lazy-load chart components inline.

## 2026-05-12 · Coming Soon — sidebar items with `status: 'coming-soon'` ARE clickable (route to `/locked/:feature`), not strictly non-clickable

1. **Rule** — Spec §13: "Lock icon + non-clickable + tooltip 'Скоро. Свяжитесь с продажами для разблокировки.'"
2. **Reason** — The spec's "non-clickable" intent reads as "doesn't navigate to the would-be live feature route". But making the items entirely inert hurts both discoverability and keyboard accessibility: a focused-but-inactive nav item with no action surfaces only the tooltip, which screen-readers don't reliably announce when they're not pointer-hover. We route the click to `/locked/:feature` instead — the user gets to the Coming Soon page where they can read about the feature, see the bullets, and submit a Notify-Me. The `<Lock>` icon + muted color + tooltip + `aria-label="{label} — Скоро"` collectively signal the state. This matches the spec's spirit ("non-clickable to the live feature") while preserving discovery + a11y.
3. **Scope** — [`src/components/layout/Sidebar.tsx`](../src/components/layout/Sidebar.tsx) `NavItemView` coming-soon branch. Affects: `nav.documents`, `nav.smsCampaigns`, `nav.aiInsights`, `nav.mobileApp`.
4. **Review date** — Revisit if user-testing shows people clicking expecting the live feature. At that point, switch to a `<button>`-based variant that opens the tooltip as a popover on tap instead of navigating.

## 2026-05-12 · Coming Soon — `<BlurredScreenshot>` is CSS-only (gradient + grid pattern + lucide overlay), no real screenshots

1. **Rule** — No specific § rule; this is a content-debt decision.
2. **Reason** — Spec §13 names "blurred screenshot" as the illustration. Shipping real product screenshots in Prompt 11 would require either (a) maintaining 9 PNG/JPG assets per feature × 2 themes = ~18 binary files in the repo, with the maintenance burden of keeping them in sync with the design language, or (b) building actual feature mockups solely for the placeholder. Neither is worth the cost for a Phase-2 placeholder. A CSS composition (gradient + faint grid + centered icon under `[filter:blur(6px)]`) feels indistinguishable from a real blurred screenshot at a glance and is zero-maintenance.
3. **Scope** — [`src/features/coming-soon/components/BlurredScreenshot.tsx`](../src/features/coming-soon/components/BlurredScreenshot.tsx). Used by `<LockedFeaturePage>` (when `showBlurredPreview: true` in registry) and `<AIInsightsTeaser>` (compact variant).
4. **Review date** — When real feature work begins shipping, swap the placeholder for actual screenshots. Extend `<BlurredScreenshot>` with an optional `srcDataUri` prop; consumers either provide a screenshot or get the CSS fallback.

## 2026-05-12 · Coming Soon — slugs are kebab-case (no dots), i18n keys use the slug as a literal child key

1. **Rule** — 2026-05-12 LESSON "i18next splits dots in keys by default — domain identifiers must be NESTED in JSON".
2. **Reason** — Coming Soon feature slugs are kebab-case (`sms-campaigns`, `integrations-hemis`, `billing-upgrade`, etc.). i18next's default `keySeparator: '.'` does NOT split at `-`, so a dynamic key like `t(\`comingSoon.features.${slug}.title\`)` resolves correctly even though the slug contains dashes. JSON structure:
   ```json
   "features": {
     "sms-campaigns": { "title": "...", "subtitle": "...", "bullets": { "0": "...", ... } }
   }
   ```
   If we had used dot-separated slugs (e.g. `sms.campaigns`), the same dot-splitting bug from the 2026-05-12 Settings audit would resurface. Bullets use indexed object keys (`0`, `1`, `2`) rather than a JSON array so the i18next lookup `t('...bullets.0')` works without `returnObjects`.
3. **Scope** — `comingSoon.features.<slug>.*` i18n keys in [`ru.json`](../src/lib/i18n/locales/ru.json) and [`uz.json`](../src/lib/i18n/locales/uz.json). Slug source of truth: [`src/features/coming-soon/data/featureContent.ts`](../src/features/coming-soon/data/featureContent.ts) `FEATURE_REGISTRY`.
4. **Review date** — Stable. Documented in LESSONS for future modules with dynamic identifier-keyed i18n namespaces.

## 2026-05-12 · Settings — `MySession` is a new domain type distinct from `StaffSession`

1. **Rule** — `.claude/rules/core-principles.md` "Match the schema. If the design needs a field that doesn't exist, propose a model change first."
2. **Reason** — Spec §12.2 needs an "Active sessions" section showing devices the **current user** is signed in from. The existing `StaffSession` interface carries a `staffId` foreign-key because it's surfaced from the staff-feature `/api/staff/:id/sessions` endpoint (Owner role managing other people). The current-user equivalent comes from `/api/me/sessions` — same conceptual shape minus the FK. Reusing `StaffSession` would push a meaningless `staffId` field into wire responses; renaming `staffId` to optional bleeds the staff-feature semantics. A new `MySession` interface (id + device + os + browser + ip + location + lastActiveAt + createdAt + current) keeps both wire shapes honest. The two endpoints resolve through the same underlying auth sessions table on the backend, but the API contracts stay separate.
3. **Scope** — [`src/types/domain.ts`](../src/types/domain.ts) `MySession` interface (alongside the existing `StaffSession`). [`/api/me/sessions`](../src/mocks/handlers/settings.ts) MSW endpoint. [`src/lib/sessions.ts`](../src/lib/sessions.ts) module store. [`src/features/settings/hooks/useMyActiveSessions.ts`](../src/features/settings/hooks/useMyActiveSessions.ts). Staff feature's `StaffSession` + `useStaffSessions` unchanged.
4. **Review date** — Revisit when the real backend lands. If it consolidates both surfaces under one endpoint shape, collapse the two types.

## 2026-05-12 · Settings — new `src/lib/sessions.ts` module store sits alongside `lib/auth.ts` rather than extending it

1. **Rule** — `.claude/rules/design-system-layers.md` "Cross-cutting concerns live at the Token layer (read by every layer above)." Plus the project's `useSyncExternalStore` precedent in `lib/auth.ts` / `lib/preferences.ts` / `lib/maintenanceState.ts`.
2. **Reason** — Spec §12.2 requires the active-sessions list to update across browser tabs immediately when a session is revoked. The auth store already manages the current session (sessionStorage-backed) + idle timeout. Coupling the new "list of all my sessions" cache into `lib/auth.ts` would mix concerns: auth.ts is about "am I signed in right now" while sessions.ts is about "what devices is my account signed in from". They share zero overlapping state. Splitting keeps each store small and lets `lib/sessions.ts` carry its own storage-event key (`unipay-my-sessions-sync`) without polluting the auth sync key. Pattern reference for both: `useSyncExternalStore` with module-level cache + listener Set + storage-event subscription.
3. **Scope** — New file [`src/lib/sessions.ts`](../src/lib/sessions.ts). Consumed by [`useMyActiveSessions`](../src/features/settings/hooks/useMyActiveSessions.ts) which subscribes via `subscribeToCrossTabSessions` and invalidates the TanStack Query on cross-tab events.
4. **Review date** — Revisit if a 2nd consumer outside `/settings/security` needs to read the sessions list — at that point promote the cache + add a hook export. Today it's a single-consumer store but the pattern is established.

## 2026-05-12 · Settings — `<PasswordConfirmDialog>` ships feature-local under `src/features/settings/components/` (4 internal consumers, 0 external)

1. **Rule** — `.claude/rules/design-system-layers.md` Patterns layer: "New composite element used on ≥ 2 screens → Components" (and the project's convention of promoting once a 3rd domain consumer appears, established by `<PayoutIdCopy>` from Prompt 9).
2. **Reason** — Spec §12.2-12.3 names 4 flows that need password confirmation: reveal API key plaintext (password-only) · disable 2FA (password + reason ≥20) · reveal webhook signing secret (password-only) · rotate webhook signing secret (password + reason ≥20). All 4 live inside the Settings module. Building a single feature-local primitive (with optional `requireReason` + `minReasonLength` props) covers all 4 without forking, and the existing shared `<ConfirmDialog>` doesn't carry a password field. Promoting to `src/components/shared/` before a 3rd domain (outside Settings) needs it would speculate on an API. The same precedent applies to `<CopyableTextRow>` + `<CopyOrLoseItPanel>` — both feature-local for now.
3. **Scope** — [`src/features/settings/components/PasswordConfirmDialog.tsx`](../src/features/settings/components/PasswordConfirmDialog.tsx). All 4 consumers are inside `src/features/settings/components/` (TwoFaCard / ApiKeysCard / WebhookConfigCard).
4. **Review date** — Revisit when a 3rd domain outside Settings asks for a password-confirm flow (e.g. payout finalization, staff role transfer). At that point promote + add a separate ADR.

## 2026-05-12 · Settings — `/locked/billing-upgrade` Placeholder route reserved here, content lands in Prompt 11

1. **Rule** — No specific rule; this is a Doc-Cascade entry recording an inter-prompt dependency.
2. **Reason** — Spec §12.5 names the Billing tab's "Улучшить план" CTA as routing to `/locked/billing-upgrade`. That route's content is owned by Prompt 11 (Locked / Coming Soon pages). Registering it as a `<Placeholder />` in Prompt 10 lets the CTA work today (no 404) and lets Prompt 11 land just by swapping the element. `/locked` was added to `KNOWN_PATH_PREFIXES` so deep-link-before-sign-in resolves to a sign-in redirect rather than a full-bleed 404.
3. **Scope** — [`src/router.tsx`](../src/router.tsx) Placeholder route + KNOWN_PATH_PREFIXES entry.
4. **Review date** — Replace the Placeholder when Prompt 11 ships.

## 2026-05-12 · Settings — Preferences tab is a 7th tab rather than folded into General

1. **Rule** — Spec §12 (in original v1.x) named 6 tabs. The user's Prompt 10 brief offered "fold Preferences into General if you'd rather" as an explicit alternative.
2. **Reason** — General owns server-side org/account settings (contact email, phone, timezone, language — all persisted on the backend). Preferences owns local-only UI prefs (density, tabular numerals — `localStorage`-backed via `lib/preferences.ts`, never sent to the backend). The two have different persistence semantics and different "blast radius" if a value is wrong. A dedicated tab also gives Preferences its own "local to this browser" note + a live preview table, both of which would feel out of place under General. Worth the 7th tab.
3. **Scope** — [`src/features/settings/pages/PreferencesTab.tsx`](../src/features/settings/pages/PreferencesTab.tsx) + `<SettingsTabsNav>` 7-tab list. `settings.tabs.preferences` i18n key.
4. **Review date** — Revisit if user research shows confusion ("where do I change theme density?"). The current implementation keeps the surface honest about which settings are local vs. server-side.

## 2026-05-12 · Payouts — `<StatusTimeline>` surfaces 4 UI milestones derived from the 3-value `PayoutStatus` enum

1. **Rule** — `.claude/rules/status-machines.md` "Never invent states. If a design needs a state that doesn't exist, propose a model + state-machine update first."
2. **Reason** — Spec §11.2 names a 4-step timeline (Created → Processing → Settled → Reconciled). The domain `PayoutStatus = 'settled' | 'pending' | 'failed'` (line 37 of [`domain.ts`](../src/types/domain.ts)) intentionally has only 3 terminal/in-flight states. The 4-milestone labels are **UI decoration** describing how a finance reviewer reads the lifecycle — they are not new domain states. Mapping: `pending` → past: Created · current: Processing · future: Settled, Reconciled. `settled` → past: Created, Processing, Settled · current: Reconciled. `failed` → past: Created · failed marker on Processing · future: Settled, Reconciled. The single source of truth is still `PayoutStatus`; the timeline computes its visual treatment in [`computeStates(status)`](../src/features/payouts/components/StatusTimeline.tsx).
3. **Scope** — [`src/features/payouts/components/StatusTimeline.tsx`](../src/features/payouts/components/StatusTimeline.tsx) only. No domain change. If "Reconciled" ever needs to gate user-facing behavior (CTA visibility, exportability), promote it to a domain status and update this entry.
4. **Review date** — Revisit when the backend exposes a separate `reconciled_at` field on `Payout`. At that point either (a) keep the UI mapping unchanged + read `reconciled_at` for the Reconciled marker tooltip, or (b) split `settled` into `settled` + `reconciled` if reconciliation becomes a user-actionable state.

## 2026-05-12 · Payouts — `plan: 'auto'|'request'` lives on `GET /api/payouts/balance`, not on the `Organization` model

1. **Rule** — `.claude/rules/core-principles.md` "Match the schema. Never propose UI that contradicts the domain. If the design needs a field that doesn't exist or a state that isn't in the machine, propose a model change first."
2. **Reason** — Spec §11.3 makes the Request page conditional on the institution's payout plan. The natural place would be `Organization.plan` — but that field doesn't exist, and the plan is a billing/operational decision that may evolve (`weekly`, `monthly`, tiered limits) independently from the org's identity (name, TIN, region). Co-locating it with the live balance keeps both "current state of payouts" facts (available + plan + next-expected) in a single response and avoids forcing every screen that reads org data to also pull a billing-shaped field. The wire shape is `{ available: MoneyJson, plan: PayoutPlan, nextExpectedAt?: string }`.
3. **Scope** — [`src/types/domain.ts`](../src/types/domain.ts) adds `export type PayoutPlan = 'auto' | 'request';` (no change to `Organization`). [`src/mocks/handlers/payouts.ts`](../src/mocks/handlers/payouts.ts) `GET /api/payouts/balance`. [`src/features/payouts/hooks/usePayoutBalance.ts`](../src/features/payouts/hooks/usePayoutBalance.ts) + [`RequestPayoutPage`](../src/features/payouts/pages/RequestPayoutPage.tsx) branches on `balance.plan`.
4. **Review date** — Revisit when the real billing service lands. If plan becomes editable by Owner role, the canonical source becomes a settings endpoint and `/balance` reads it as a denormalized snapshot.

## 2026-05-12 · Payouts — `GET /:id/breakdown.xlsx` returns a CSV-shaped text blob with `.xlsx` filename as a stub

1. **Rule** — `.claude/rules/handoff.md` "All artifacts must be production-shaped. No 'TODO' frames."
2. **Reason** — The "Скачать выписку Excel" affordance is part of acceptance, but generating a real `.xlsx` (binary OOXML) on the MSW side requires either bundling `xlsx` for the worker (it's already lazy-imported on the import-students page only, adding ~142KB to every MSW startup) or shipping a stub. CSV with the same header + row shape is a one-line client-import swap when real Excel generation lands, and the response already uses the xlsx MIME type and `.xlsx` filename so consumers won't change. Consistent with the Reports module precedent (`/mock-downloads/*` placeholder pattern).
3. **Scope** — [`src/mocks/handlers/payouts.ts`](../src/mocks/handlers/payouts.ts) `GET /api/payouts/:id/breakdown.xlsx`. Real Excel generation is a follow-up — logged in `ai_context/AI_CONTEXT.md` "Open work" until backend lands.
4. **Review date** — When the real backend service ships; at that point the MSW handler can be deleted and the real endpoint's streamed blob replaces it.

## 2026-05-11 · Reports — `<KpiCard>` + `<KpiSparkline>` promoted from `features/dashboard/components/` to `src/components/shared/`

1. **Rule** — `design-system-layers.md` import-direction: a Components-layer primitive consumed by ≥ 2 features moves to `src/components/shared/` rather than cross-feature-importing from another `features/` folder.
2. **Reason** — Prompt 8 (Reports / Summary KPI row) needs the same KPI card visual rhythm as the Dashboard. Two clean options: cross-feature import or shared promotion. The flagged "PanelStates cross-feature import" pattern from Prompt 6 explicitly bumped that primitive to `shared/` for exactly this reason; same precedent here. The component has no dashboard-only props or behavior — it's a pure rendering primitive with `label / value / delta / spark / icon / to` API. No token or API change; only the import path moves. `KpiSparkline` came along since it's `KpiCard`'s only direct dep.
3. **Scope** — created [`src/components/shared/KpiCard.tsx`](../src/components/shared/KpiCard.tsx) and [`src/components/shared/KpiSparkline.tsx`](../src/components/shared/KpiSparkline.tsx); deleted the originals at `src/features/dashboard/components/`; repointed [`KpiRow.tsx`](../src/features/dashboard/components/KpiRow.tsx) import. Reports module ([`SummaryKpiRow.tsx`](../src/features/reports/components/SummaryKpiRow.tsx)) is the second consumer.
4. **Review date** — Stable; revisit only if a third feature wants a divergent KPI visual (e.g. different sparkline color tone) — at which point we'd add a `tone` prop, not fork.

## 2026-05-11 · Reports — single canonical `?range=&from=&to=` URL state, shared across Summary and Export tabs

1. **Rule** — Prompt 8 acceptance: "Tab nav between Summary/Export persists range param via URL."
2. **Reason** — Both tabs need to see the same active date range so the user's "I'm looking at Q1" mental model survives a tab switch. Two ways to wire this: layout-owned state via React Context, or URL as source-of-truth read independently by each page. URL wins because (a) browser back/forward navigates between ranges, (b) deep-link sharing carries the range, (c) tabs nav becomes a plain `<Link>` with the search params copied into the `to` — no React state hand-off. Export's form `dateRange` field is initialized from the URL but doesn't write back (form-local once dirtied), so editing one doesn't surprise the other.
3. **Scope** — [`src/features/reports/hooks/useReportRangeParam.ts`](../src/features/reports/hooks/useReportRangeParam.ts) (URL parse/serialize), [`ReportsTabsNav.tsx`](../src/features/reports/components/ReportsTabsNav.tsx) (Link preserves search params), [`SummaryPage.tsx`](../src/features/reports/pages/SummaryPage.tsx) + [`ExportForm.tsx`](../src/features/reports/components/ExportForm.tsx) (read).
4. **Review date** — Stable. Pattern reusable for any future multi-tab feature whose tabs share a primary filter.

## 2026-05-11 · Students — `StudentPaymentStatus` is a separate type from transaction `PaymentStatus`

1. **Rule** — `PaymentStatus` in [`src/types/domain.ts`](../src/types/domain.ts) was the only payment-status enum. The Prompt 6 spec calls for student-level filters / chips "Все / Paid / Pending / Overdue / Partial" — but `PaymentStatus` doesn't include `'partial'` and does include `'processing'` / `'failed'` / `'refunded'` which only make sense for individual transactions.
2. **Reason** — A student's overall position is an aggregate of multiple schedule rows. The natural states are paid (all rows paid), partial (some rows paid), pending (no rows paid yet, no overdue), overdue (any row overdue). Reusing `PaymentStatus` would force `'partial'` into it (polluting transaction tone-mapping with a state that doesn't apply to individual txns) or invent a label override. Cleanest: a separate `StudentPaymentStatus = 'paid'|'partial'|'pending'|'overdue'`. Same 4 values reused for `ScheduleRowStatus`. Added `'partial'` variant to `<StatusBadge>` (`CircleDot` icon + `info` tone).
3. **Scope** — [`src/types/domain.ts`](../src/types/domain.ts), [`src/components/shared/StatusBadge.tsx`](../src/components/shared/StatusBadge.tsx), [`src/lib/i18n/locales/{ru,uz}.json`](../src/lib/i18n/locales/).
4. **Review date** — Stable. Revisit only if the backend collapses transaction-status + aggregate-status into a single field (unlikely; they have different lifecycles).

## 2026-05-11 · Students — Year/Class/Group as a single `<TreePicker leafOnly>` leaf-select, not 3 cascading Selects

1. **Rule** — PRD §8.3 says "Year / Class / Group — cascading dropdowns based on department structure" which reads as three parallel `<Select>` fields.
2. **Reason** — The org fixture organizes departments as a 4-level tree (Faculty → Department → Year → Group); year and group are NODES inside that tree, not parallel attributes on a student. Three cascading Selects would hard-code the 4-level shape — but `Department.type` is just a label, not a structural guarantee. Picking a group-leaf in the `<TreePicker>` resolves year via the leaf's parent. One field, one validation, naturally adapts to deeper or shallower trees. Same picker handles the "Change Department" bulk action and the "Apply Template" department targeting (multi mode there).
3. **Scope** — [`src/features/students/components/add/AcademicInfoSection.tsx`](../src/features/students/components/add/AcademicInfoSection.tsx), [`src/features/students/components/list/ChangeDepartmentDialog.tsx`](../src/features/students/components/list/ChangeDepartmentDialog.tsx), [`src/features/students/components/schedules/TemplateForm.tsx`](../src/features/students/components/schedules/TemplateForm.tsx), [`src/features/students/components/list/StudentsFilters.tsx`](../src/features/students/components/list/StudentsFilters.tsx), [`src/features/students/components/profile/EditStudentSheet.tsx`](../src/features/students/components/profile/EditStudentSheet.tsx).
4. **Review date** — Revisit if compliance / ministry exports need year + class + group as discrete fields on a student record.

## 2026-05-11 · Students — Mobile bottom tab nav acceptance check passes vacuously

1. **Rule** — Prompt 6 acceptance: "Student profile route on mobile: bottom tab nav hidden (verify `appShellContext.isDetailRoute === true`), `<DetailActionBar>` visible at bottom."
2. **Reason** — The app has no mobile bottom tab nav today (AI_CONTEXT.md documents this). `<AppShellContext>` exposes `onboardingActive` only — no `isDetailRoute`. The acceptance check is vacuously satisfied: there is nothing to hide, and `<StudentDetailActionBar>` correctly renders as the only fixed-bottom chrome. Adding `setIsDetailRoute` as forward-compat invents an API no consumer needs yet — postponed until the tab nav actually ships.
3. **Scope** — [`src/components/layout/AppShellContext.tsx`](../src/components/layout/AppShellContext.tsx) (unchanged). [`src/features/students/pages/StudentProfilePage.tsx`](../src/features/students/pages/StudentProfilePage.tsx) does NOT call any `setIsDetailRoute`.
4. **Review date** — When mobile bottom tab nav lands (post-Prompt 12), extend AppShellContext with `isDetailRoute` + setter and mirror the onboarding pattern.

## 2026-05-11 · Students — `xlsx` dependency added (dynamic-imported only)

1. **Rule** — Each new top-level dependency widens the supply-chain surface; needs explicit justification.
2. **Reason** — Import wizard Step 1 generates a downloadable xlsx template (Students + Instructions sheets); Step 3 generates an error-report xlsx for the user to fix offline. Both are user-facing requirements from §8.4. Hand-rolling xlsx is hostile to the binary format; `xlsx` (SheetJS Community) is the industry-standard reader/writer. Mitigation: every consumer uses `await import('xlsx')` at the call site, so the library ships as its own ~142 KB gzip chunk that loads only when the user clicks "Скачать Excel-шаблон" or "Скачать отчёт об ошибках". Main bundle unaffected.
3. **Scope** — [`package.json`](../package.json), [`src/features/students/components/import/Step1Download.tsx`](../src/features/students/components/import/Step1Download.tsx), [`src/features/students/pages/ImportStudentsPage.tsx`](../src/features/students/pages/ImportStudentsPage.tsx).
4. **Review date** — Stable. The dynamic-import discipline matches the existing `canvas-confetti` pattern.

## 2026-05-11 · Students — `useDepartments` consumed cross-feature (deferred shared promotion)

1. **Rule** — `.claude/rules/design-system-layers.md` import direction: features should not consume other features' Components, Patterns, or Screens.
2. **Reason** — `useDepartments` is a data hook, not a presentation primitive. Department state is a single org-level resource that multiple features need (staff already imports it; students needs it for 4 separate pickers). Promoting to `src/hooks/` requires deciding the right location and a small refactor of organization's own consumer. Acceptable velocity tradeoff — flagged for cleanup when a third consumer needs it. Same call as the earlier `PanelStates` deviation (now resolved).
3. **Scope** — students imports `useDepartments` from `@/features/organization/hooks/useDepartments` in 5 places (list, Add, EditSheet, TemplateForm, ChangeDeptDialog); staff does the same in `DepartmentTreePicker`.
4. **Review date** — Promote when Prompt 7 (Transactions) ships and needs department filtering. Organization's `DepartmentsPage` becomes the canonical writer; everyone else reads via the shared hook.

## 2026-05-11 · Students — `TemplateForm` defers per-department amounts + individual studentIds picker

1. **Rule** — Prompt 6 / PRD §8.5: template form supports amountMode 'single' OR 'per-department' (different amounts per kafedra), and the appliesTo selection should include "individual student multi-select" alongside departments + years.
2. **Reason** — Both are real future requirements but neither is exercised by any of the current 3 pre-seeded templates or the typical demo flow. Per-dept amount editing requires a sub-form (per-row Combobox for department + Input for amount, with add/remove); individual studentIds picker requires a searchable multi-select Combobox over 200+ students. Both add real surface area and review time. The MSW handler + `studentsApi.applyTemplate` + `useApplyTemplate` already accept the full shape (`perDepartmentAmounts: Array<{ departmentId, amount }>` and `appliesTo.studentIds: string[]`) — only the UI is deferred. Single-mode amount editing covers the canonical "Tuition 2026 S1, 5 000 000 UZS" template, which is the realistic 80% case.
3. **Scope** — [`src/features/students/components/schedules/TemplateForm.tsx`](../src/features/students/components/schedules/TemplateForm.tsx) — `amountMode='per-department'` toggle still renders but shows a "use post-save editing" hint instead of per-dept inputs. `appliesTo.studentIds` always submitted as `[]`.
4. **Review date** — When a customer asks for non-uniform tuition per kafedra, add the per-dept amount sub-form. When the use case "apply this template to these 5 specific students" comes up, add a `<StudentMultiPicker>` searchable Combobox over `useStudents`.

## 2026-05-11 · Deploy — MSW ships in production builds (demo deploy)

1. **Rule** — Implicit convention from Prompt 0 v2.0: MSW is a dev-time mock, gated to `import.meta.env.DEV` in [`src/main.tsx`](../src/main.tsx). Reinforced by `STYLE_DISCIPLINE.md` posture that production builds talk to a real backend.
2. **Reason** — The Express+Mongo backend lives in a separate repo and isn't deployed yet, but the frontend is published to GitHub Pages as a portfolio / preview demo. Gating MSW to DEV means the deployed demo has no working sign-in (nor any data loading) — every API call hits a 404. Lifting the gate (and pointing `worker.start()` at `${BASE_URL}mockServiceWorker.js` so the worker resolves under the `/unipay-dashboard/` sub-path) gives the demo a functional sign-in + dashboard + organization flow at zero backend cost. Bundle cost: ~97 KB gzipped `browser-*.js` chunk — acceptable for a demo deploy with no real backend in the picture.
3. **Scope** — [`src/main.tsx`](../src/main.tsx) — `enableMocks()` no longer short-circuits in prod; `worker.start()` takes `serviceWorker.url` built from `import.meta.env.BASE_URL`.
4. **Review date** — When the real backend ships (next major milestone). At that point, replace the unconditional `enableMocks()` with a `VITE_USE_MOCKS` env-flag check (true in dev + preview, false in real prod). Do **not** revert to the DEV-vs-prod ternary — it doesn't survive any preview deploy.

## 2026-05-11 · Auth — sign-in form pre-fills `owner@unipay.dev` / `demo1234` in every environment

1. **Rule** — Standard UX: production sign-in forms ship with empty inputs.
2. **Reason** — The deployed GitHub Pages build is a demo, not a real production sign-in. With MSW now serving the auth endpoint in every environment (see deviation above), a visitor's first interaction should be "click Войти, land inside" — not "type credentials they don't have." The DEV-only `defaultValues` ternary that pre-filled the owner demo account in dev was extended to prod by collapsing the ternary. The pre-filled credentials are not secrets — they're mock-account fixtures published in the public repo.
3. **Scope** — [`src/features/auth/components/SignInForm.tsx`](../src/features/auth/components/SignInForm.tsx) — `defaultValues: { email: 'owner@unipay.dev', password: 'demo1234', rememberMe: false }` unconditionally (was wrapped in `import.meta.env.DEV ? ... : { email: '', password: '', ... }`).
4. **Review date** — Same milestone as the MSW-in-prod deviation: when the real backend lands and a `VITE_USE_MOCKS` flag turns off the mocks for real prod, restore the DEV-only branch (or gate the prefill on the same `VITE_USE_MOCKS` flag). Real production sign-in should never auto-fill credentials.

## 2026-05-11 · Organization — add flows are standalone pages, not Dialogs/Sheets

1. **Rule** — The Prompt 4 spec called for "Add account → `<ResponsiveSheet>` form" and "+ Add подразделение → `<AddDepartmentDialog>`". §0.5 doesn't prescribe a default for create flows — it documents detail-page chrome (back link + action bar) for either pattern.
2. **Reason** — User explicitly requested: "in addition pages in organizations should be separate pages". Create flows tend to grow fields over time (bank account today is 7 fields, departments today is 3 fields; both will accrete more — head-of-staff Combobox once `/staff` exists, payment-types Checkbox group, notes Textarea, etc.). A Sheet/Dialog that grows tall enough to need internal scroll degrades UX (focus-ring clipping, sticky-footer layout fragility, no shareable URL for an in-progress form, no browser back). Promoting create to full pages gives shareable URLs (deep-linkable for "add child under department X" via `?parentId=X`), browser-native back, and clean §0.5 Pattern A action bar without nested-scroll headaches. Edit stays in the Sheet — edit is short, contextual, and benefits from staying near the row being edited.
3. **Scope** — [`AddBankAccountPage.tsx`](../src/features/organization/pages/AddBankAccountPage.tsx) at `/organization/bank-accounts/new`. [`AddDepartmentPage.tsx`](../src/features/organization/pages/AddDepartmentPage.tsx) at `/organization/departments/new[?parentId=X]`. Both registered as **siblings** of the `<OrganizationLayout>` route (not children) so the tabs strip doesn't render on them — back link is the only orientation chrome. The deleted `AddDepartmentDialog.tsx` is replaced; `BankAccountForm.tsx` simplified to edit-only.
4. **Review date** — Permanent shift in product convention. Apply the same pattern to future modules' create flows (Students, Refunds, Reports, etc.) — Sheet/Dialog reserved for edit + confirm + small-scope picker flows only. Revisit only if a usability test exposes a regression (e.g. context loss from leaving the list).

## 2026-05-11 · Organization — cross-feature imports of `PanelStates` and `BankCombobox`

1. **Rule** — `.claude/rules/design-system-layers.md` import direction: Components may reference Tokens / Primitives but NOT other Components, Patterns, or Screens (no sideways imports between features).
2. **Reason** — `<PanelStates>` lives at [`features/dashboard/components/PanelStates.tsx`](../src/features/dashboard/components/PanelStates.tsx) and uses the current `common.states.*` i18n keys; the legacy [`shared/EmptyState`](../src/components/shared/EmptyState.tsx) / [`ErrorState`](../src/components/shared/ErrorState.tsx) / [`OfflineState`](../src/components/shared/OfflineState.tsx) primitives use older keys (`states.errorTitle`, `common.retry`) that don't match the current `common.states.*` namespace. `<BankCombobox>` lives at [`features/onboarding/components/BankCombobox.tsx`](../src/features/onboarding/components/BankCombobox.tsx) and is fully generic but feature-local. Promoting either to `src/components/shared/` requires updating 5 dashboard imports (PanelStates) + 1 onboarding Step 3 import (BankCombobox) + adding the new shared file. Acceptable velocity tradeoff for landing Prompt 4 cleanly; flagged for cleanup.
3. **Scope** — Organization module's Profile / Departments / Bank Accounts / Branding pages import `PanelStates` directly from `@/features/dashboard/components/PanelStates`. `BankAccountForm.tsx` + `AddBankAccountPage.tsx` import `BankCombobox` from `@/features/onboarding/components/BankCombobox`. Both flagged in [`AI_CONTEXT.md`](../ai_context/AI_CONTEXT.md) "Open work" and [`product_states.md`](./product_states.md) outstanding follow-ups.
4. **Review date** — Promote both to `src/components/shared/` before the next feature module lands (Prompt 5 — Students). Promoting `PanelStates` also requires reconciling the older `EmptyState`/`ErrorState`/`OfflineState` primitives — likely retire them since they reference dropped i18n keys.

---

## 2026-05-11 · Dashboard — KPI hero number is `text-2xl md:text-3xl` (responsive, not always `text-3xl`)

1. **Rule** — §0.2 typography lock: `text-3xl` (28px) = "KPI hero numbers".
2. **Reason** — At mobile 2-column grid (~140px card width), full UZS amounts like `298 436 322 UZS` overflow `text-3xl font-mono` and previously clipped via `truncate` to `298 436 322 U…` — a real readability bug reported by the user. The fix uses `text-2xl` (22px, still in the §0.2 scale) on mobile and the canonical `text-3xl` (28px) at `md:` and above. Numbers also wrap naturally at the UZS thousand-space separators since `truncate` is removed; on tiny widths the amount may flow across two lines but stays fully visible.
3. **Scope** — [`src/features/dashboard/components/KpiCard.tsx`](../src/features/dashboard/components/KpiCard.tsx) hero number only. Sparklines, deltas, subtitles unchanged.
4. **Review date** — Revisit if a future format helper (compact UZS like `298.4M UZS`) lets us keep `text-3xl` at all widths without overflow. (Earlier of: compact-format helper landing, or 2026-Q3 design refresh.)

## 2026-05-11 · Dashboard — page mounts at `/` (not `/dashboard`)

1. **Rule** — Prompt 3 (Dashboard Home) header: "Page — `/dashboard`".
2. **Reason** — Same as the 2026-05-10 Auth decision below: the IA has one home route, `/`, and adding a parallel `/dashboard` would create two URLs for the same screen. Sign-in already redirects to `/` per the existing deviation. The greeting page header reads as the dashboard's own surface; no nested routing under `/dashboard/*` exists or is planned.
3. **Scope** — [`src/router.tsx`](../src/router.tsx) routes `<DashboardPage />` at `/`. [`src/features/dashboard/pages/DashboardPage.tsx`](../src/features/dashboard/pages/DashboardPage.tsx) reads `?from=&to=` for the date-range filter; that URL contract is unchanged.
4. **Review date** — Same trigger as the Auth deviation: when/if the IA grows nested dashboard surfaces, lift the page to `/dashboard` and redirect `/`.

## 2026-05-11 · ConfirmDialog — default `minReasonLength` raised 10 → 20

1. **Rule** — §0.9 v2.0: reason notes ≥ 20 chars for destructive actions; ≥ 10 only for low-stakes notes (audit context, optional reviewer comment).
2. **Reason** — [`src/components/shared/ConfirmDialog.tsx`](../src/components/shared/ConfirmDialog.tsx) had a hardcoded `minLength = 10`, predating the v2.0 threshold bump. Updating the default keeps every destructive consumer compliant by default; an explicit `minReasonLength={10}` override is available for low-stakes notes. Dashboard bulk-remind is the first consumer and uses the new default.
3. **Scope** — `ConfirmDialog` default + i18n keys `common.reasonLabel` / `common.reasonPlaceholder` now interpolate `{{count}}`. No other consumers existed at the time of the bump.
4. **Review date** — Re-verify with each new destructive consumer that they don't override below 20 without a compliance signoff.

## 2026-05-10 · Auth — sign-in success redirects to `/` (not `/dashboard`)

1. **Rule** — Prompt 1 (Auth) acceptance criterion: "Successful sign-in redirects to `?next=` if present (must start with `/`), else `/dashboard`."
2. **Reason** — There is no `/dashboard` route in this build. Dashboard lives at `/` (see [`router.tsx`](../src/router.tsx)). Adding a `/dashboard` route or redirect just to satisfy the prompt's literal wording would clutter the IA without user benefit.
3. **Scope** — [`src/features/auth/components/SignInForm.tsx`](../src/features/auth/components/SignInForm.tsx), [`src/features/auth/components/DevRoleSwitcher.tsx`](../src/features/auth/components/DevRoleSwitcher.tsx). Default redirect target is `/`. The `?next=` query parameter still wins when present and starts with `/`.
4. **Review date** — When/if the IA introduces a real `/dashboard` route distinct from `/`, swap the fallback target back to `/dashboard` in both places. (No earlier than 2026-Q3.)

## 2026-05-10 · Auth — password show/hide toggle button is 36×36, not 44×44

1. **Rule** — §0.7 "Tap targets ≥ 44×44pt on mobile."
2. **Reason** — The toggle sits inside the password [`Input`](../src/components/ui/input.tsx) (`h-9` = 36px). Forcing the button to 44px would either break the input height (which is locked to `h-9` per §controls) or have it overflow visually. Standard pattern across major auth surfaces (Stripe, Linear, Vercel) is the same 36px-or-smaller toggle inside an h-9 input.
3. **Scope** — [`src/features/auth/components/PasswordField.tsx`](../src/features/auth/components/PasswordField.tsx). Affects only the show/hide toggle; the input field itself is full-width and meets target on its own.
4. **Review date** — When we revisit form-control density (e.g. lifting `h-9` to `h-10` or moving toggles outside the input), reassess. No fixed date.
