# Accessibility (WCAG 2.1 AA)

Target: WCAG 2.1 Level AA across mobile and admin dashboard.

## Color & contrast

- Body text: contrast **≥ 4.5:1** against background.
- Large text (≥ 18pt regular or 14pt bold): contrast **≥ 3:1**.
- Non-text UI (icons, focus rings, form borders): contrast **≥ 3:1**.
- **Never rely on color alone** for status — pair with icon, label, or position.

## Tap targets

- **Mobile:** minimum 44 × 44 pt.
- **Admin dashboard:** minimum 24 × 24 px (mouse precision allowed), but keep clickable area ≥ 32 × 32.
- Avoid placing two tap targets within 8pt of each other.

## Dynamic type

- Mobile: respect OS text-size setting up to 200%.
- Layouts must reflow — no horizontal scroll, no clipped text.
- Test every screen at default + 200%.

## Screen reader

- Every interactive element has a label (`aria-label` or platform equivalent).
- Decorative icons marked decorative.
- Status changes announced via live region (e.g. "Transfer completed").
- Reading order matches visual order.

## Focus

- Visible focus ring on every focusable element — admin dashboard especially (keyboard-first audience).
- Tab order is sequential and predictable.
- Modals trap focus; ESC dismisses.
- Skip-links on admin dashboard ("skip to main content").

## Motion

- Honor `prefers-reduced-motion`. Where motion conveys state, fall back to instantaneous transitions.
- No flashing > 3 Hz.
- No autoplaying video with motion in onboarding.

## Design spec annotations

Every handoff package includes:
- Focus order diagram for the screen.
- Screen-reader label for every non-decorative element.
- Min-tap-target rectangles called out.
- Reduced-motion fallback noted where animations are non-trivial.

See [`handoff.md`](./handoff.md) for the full handoff contract.

## Admin dashboard specifics

- **Keyboard-first** — every action available without a mouse.
- Hotkey conventions documented (e.g. `j/k` to move through queue, `c` to clear flag).
- Dense data tables: row hover state must not be the only signal — use selectable row + persistent indicator.

## Localization × accessibility

- Test screen-reader pronunciation for `uz` (limited TTS support — keep proper nouns sensible).
- Bidi (mixed-script with Latin code names like "MyID") renders correctly.
- Number / date announcement matches locale (see [`localization.md`](./localization.md)).

## Acceptance criteria addendum

Every design ticket includes an "A11y checks" sub-list:

- [ ] Contrast verified (text + non-text)
- [ ] Tap targets ≥ 44pt (mobile) / ≥ 24px (admin)
- [ ] Dynamic type tested at 200%
- [ ] Focus order documented
- [ ] Screen-reader labels documented
- [ ] Reduced-motion fallback documented (if animation present)
- [ ] Color-only signals removed (icon / label / position pair added)

## Cross-references
- Layered tokens (focus-ring, min-tap-target, contrast pairs): [`design-system-layers.md`](./design-system-layers.md)
- Localization: [`localization.md`](./localization.md)
- Handoff package: [`handoff.md`](./handoff.md)
- Review checklist: [`design-review-checklist.md`](./design-review-checklist.md)
