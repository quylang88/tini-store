## 2024-05-23 - Assistant UX Polish
**Learning:** Hidden actions (like clipboard copy in context menus) need immediate, explicit feedback. A simple haptic tap isn't enough; changing the button text/icon to "Copied" provides certainty. Also, icon-only buttons in dense UIs (like headers) are prime candidates for missing `aria-label`s, which is a critical accessibility gap.
**Action:** Always pair hidden actions with visual + haptic feedback. Audit headers for icon-only buttons and ensure `aria-label` is present.
