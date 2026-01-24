## 2024-05-23 - Assistant UX Polish
**Learning:** Hidden actions (like clipboard copy in context menus) need immediate, explicit feedback. A simple haptic tap isn't enough; changing the button text/icon to "Copied" provides certainty. Also, icon-only buttons in dense UIs (like headers) are prime candidates for missing `aria-label`s, which is a critical accessibility gap.
**Action:** Always pair hidden actions with visual + haptic feedback. Audit headers for icon-only buttons and ensure `aria-label` is present.

## 2026-01-24 - PWA Native Feel
**Learning:** In PWAs, accidental text selection on interactive elements (cards, list items) triggers native OS selection handles, instantly breaking the illusion of a "native app". This is a major immersion breaker on iOS.
**Action:** Apply `select-none` to all interactive card/list containers that act as buttons. This ensures touch interactions feel solid and app-like.

## 2026-05-23 - Interactive Card Accessibility
**Learning:** Adding `select-none` to improve PWA touch feel inadvertently makes elements harder to identify as interactive for keyboard users unless explicit `focus-visible` styles are added. Also, "Clickable Cards" (divs with onClick) must manually implement `tabIndex` and `onKeyDown` (Enter/Space) to bridge the gap between "App-like" feel and Web Accessibility standards.
**Action:** When creating "App-like" cards using `div`s, always pair `select-none` with `tabIndex="0"`, `role="button"` (if no nested interactive elements), `onKeyDown` handlers, and clear `focus-visible` rings.
