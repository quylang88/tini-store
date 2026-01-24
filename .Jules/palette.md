## 2024-05-23 - Assistant UX Polish
**Learning:** Hidden actions (like clipboard copy in context menus) need immediate, explicit feedback. A simple haptic tap isn't enough; changing the button text/icon to "Copied" provides certainty. Also, icon-only buttons in dense UIs (like headers) are prime candidates for missing `aria-label`s, which is a critical accessibility gap.
**Action:** Always pair hidden actions with visual + haptic feedback. Audit headers for icon-only buttons and ensure `aria-label` is present.

## 2026-01-24 - PWA Native Feel
**Learning:** In PWAs, accidental text selection on interactive elements (cards, list items) triggers native OS selection handles, instantly breaking the illusion of a "native app". This is a major immersion breaker on iOS.
**Action:** Apply `select-none` to all interactive card/list containers that act as buttons. This ensures touch interactions feel solid and app-like.

## 2026-05-23 - iOS PWA Scroll Chaining
**Learning:** On iOS PWAs, scrolling to the edge of a modal or inner list often "chains" to the body, causing the whole app to rubber-band or shake. This breaks the "modal" illusion. Adding `overscroll-contain` (Tailwind) to the scrollable container fixes this instant immersion breaker.
**Action:** Always add `overscroll-contain` to scrollable modal content areas and main viewports in PWA contexts.
