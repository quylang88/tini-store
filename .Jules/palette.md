## 2024-05-23 - Assistant UX Polish
**Learning:** Hidden actions (like clipboard copy in context menus) need immediate, explicit feedback. A simple haptic tap isn't enough; changing the button text/icon to "Copied" provides certainty. Also, icon-only buttons in dense UIs (like headers) are prime candidates for missing `aria-label`s, which is a critical accessibility gap.
**Action:** Always pair hidden actions with visual + haptic feedback. Audit headers for icon-only buttons and ensure `aria-label` is present.

## 2026-01-24 - Semantic Tabs
**Learning:** Navigation components like tabs often default to generic `div`s and `button`s in React. This strips away semantic meaning for screen readers, who can't distinguish a list of buttons from a tab interface.
**Action:** Always wrap tab groups with `role="tablist"` and give individual triggers `role="tab"` with `aria-selected` state. This transforms a "list of buttons" into a navigable component pattern.
