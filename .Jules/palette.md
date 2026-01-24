# Palette's Journal

## 2025-05-22 - [Accessible Interactive Cards]
**Learning:** Many dashboard cards (`div`) are made clickable via `onClick` but lack semantic button traits, making them invisible to keyboards and screen readers.
**Action:** When adding `onClick` to a non-button element, always wrap logic to conditionally add `role="button"`, `tabIndex="0"`, and `onKeyDown` (Enter/Space) handlers.
