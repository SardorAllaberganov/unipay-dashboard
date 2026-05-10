# HISTORY.md — UNIPAY Merchant Dashboard

Append-only log of major changes. Most recent on top.

---

## 2026-05-10 — Prompt 0 v2.0 — Foundation rewrite

**Summary.** Re-scaffolded the entire foundation against the v2.0 prompt: scale-based color tokens, motion + density + tabular as DOM hooks, module-level state stores via `useSyncExternalStore`, AppShell pattern with command palette + help overlay + breadcrumb topbar, system states catalog with reference-id error reporting, HashRouter with maintenance gate + path-aware auth guard, AuthLayout for full-bleed system surfaces, new domain primitives (`Money` bigint, `MaskedAccount`, `WriteButton`, `KeyboardHint`).

**Files written / replaced.**
- Tokens: [`tailwind.config.ts`](../tailwind.config.ts), [`src/styles/globals.css`](../src/styles/globals.css)
- Domain: [`src/types/domain.ts`](../src/types/domain.ts) (Role `finance_manager`, Money `bigint`, Tone, Locale, StatusDomain)
- Stores: [`src/lib/preferences.ts`](../src/lib/preferences.ts), [`src/lib/maintenanceState.ts`](../src/lib/maintenanceState.ts), [`src/lib/auth.ts`](../src/lib/auth.ts), [`src/lib/referenceId.ts`](../src/lib/referenceId.ts), [`src/lib/systemEvents.ts`](../src/lib/systemEvents.ts), [`src/lib/tone.ts`](../src/lib/tone.ts), [`src/lib/format.ts`](../src/lib/format.ts) (bigint-aware)
- Hooks: [`src/hooks/useNetworkState.ts`](../src/hooks/useNetworkState.ts), [`src/hooks/useKeyboardShortcuts.ts`](../src/hooks/useKeyboardShortcuts.ts)
- Provider: [`src/providers/ThemeProvider.tsx`](../src/providers/ThemeProvider.tsx)
- Auth chrome: [`src/components/auth/AuthLayout.tsx`](../src/components/auth/AuthLayout.tsx)
- System states: [`src/components/system/SystemStateLayout.tsx`](../src/components/system/SystemStateLayout.tsx), [`SystemErrorBoundary.tsx`](../src/components/system/SystemErrorBoundary.tsx), [`NotFoundState.tsx`](../src/components/system/NotFoundState.tsx), [`ServerErrorState.tsx`](../src/components/system/ServerErrorState.tsx), [`ForbiddenState.tsx`](../src/components/system/ForbiddenState.tsx), [`MaintenanceState.tsx`](../src/components/system/MaintenanceState.tsx), [`OfflineState.tsx`](../src/components/system/OfflineState.tsx), [`OfflineBanner.tsx`](../src/components/system/OfflineBanner.tsx)
- Domain primitives: [`src/components/unipay/Money.tsx`](../src/components/unipay/Money.tsx), [`MaskedAccount.tsx`](../src/components/unipay/MaskedAccount.tsx), [`WriteButton.tsx`](../src/components/unipay/WriteButton.tsx), [`KeyboardHint.tsx`](../src/components/unipay/KeyboardHint.tsx), [`index.ts`](../src/components/unipay/index.ts)
- Layout shell: [`AppShell.tsx`](../src/components/layout/AppShell.tsx), [`AppShellContext.tsx`](../src/components/layout/AppShellContext.tsx), [`UnipayLogo.tsx`](../src/components/layout/UnipayLogo.tsx), [`Sidebar.tsx`](../src/components/layout/Sidebar.tsx), [`Topbar.tsx`](../src/components/layout/Topbar.tsx), [`UserMenu.tsx`](../src/components/layout/UserMenu.tsx), [`CommandPalette.tsx`](../src/components/layout/CommandPalette.tsx), [`HelpOverlay.tsx`](../src/components/layout/HelpOverlay.tsx), [`ThemeToggle.tsx`](../src/components/layout/ThemeToggle.tsx), [`NotificationsBell.tsx`](../src/components/layout/NotificationsBell.tsx), [`shortcuts.ts`](../src/components/layout/shortcuts.ts)
- Pages: [`src/pages/SignIn.tsx`](../src/pages/SignIn.tsx), [`Dashboard.tsx`](../src/pages/Dashboard.tsx), [`Placeholder.tsx`](../src/pages/Placeholder.tsx)
- Router: [`src/router.tsx`](../src/router.tsx) (HashRouter, gates, system preview routes)
- Entry: [`src/App.tsx`](../src/App.tsx), [`src/main.tsx`](../src/main.tsx)
- Primitives updated: [`src/components/ui/table.tsx`](../src/components/ui/table.tsx) (uses `var(--row-h)`), [`button.tsx`](../src/components/ui/button.tsx) (h-9 default), [`card.tsx`](../src/components/ui/card.tsx) (`p-5`), [`input.tsx`](../src/components/ui/input.tsx) / [`select.tsx`](../src/components/ui/select.tsx) / [`tabs.tsx`](../src/components/ui/tabs.tsx) / [`toggle.tsx`](../src/components/ui/toggle.tsx) (h-9 alignment)
- New primitive: [`src/components/ui/kbd.tsx`](../src/components/ui/kbd.tsx)
- i18n: [`src/lib/i18n/locales/ru.json`](../src/lib/i18n/locales/ru.json), [`uz.json`](../src/lib/i18n/locales/uz.json) — restructured for `nav.section.*` / `system.*` / `common.actions.*`
- Mocks: [`src/mocks/handlers/auth.ts`](../src/mocks/handlers/auth.ts) (matches new `User` shape)
- Docs: [`STYLE_DISCIPLINE.md`](../STYLE_DISCIPLINE.md) v2.0 (§0.11 + §0.12 added by user), [`docs/DECISIONS.md`](../docs/DECISIONS.md), [`ai_context/AI_CONTEXT.md`](./AI_CONTEXT.md), `ai_context/HISTORY.md` (this file), [`docs/product_states.md`](../docs/product_states.md)

**Files removed.** `src/app/` (App.tsx, router.tsx, providers.tsx, layouts/), `src/features/`, `src/stores/` (Zustand-based — replaced by useSyncExternalStore stores in `lib/`), `src/components/layout/MobileTabNav.tsx`, `src/components/layout/nav-config.tsx`, `src/lib/api/` (TanStack Query client moved into `App.tsx` inline), `src/lib/is-detail-route.ts` (no longer needed; detail routes detected via TopBar breadcrumb logic).

**Verifications.** typecheck · `eslint --max-warnings 0` · `vite build` · §0.9 audit greps — all clean.

**Lessons.**
- `text-xs` audit needs care in code comments — Unicode arrows and the literal token `<svg` in comments will trip the grep. Use ASCII-only descriptions.
- Mac case-insensitive filesystem treats `Topbar.tsx` and `TopBar.tsx` as the same file — exported component name controls the import name.
- Backward-compat token aliases (`--primary-light`, `--success-light`, `--surface-2`) save a wide refactor of existing components after a token system rewrite. Layered tokens beat hard cutovers.

---

_(Add new entries above this line.)_
