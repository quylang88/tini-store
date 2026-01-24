# Palette's Journal

## 2025-05-22 - [Accessible Interactive Cards]
**Learning:** Many dashboard cards (`div`) are made clickable via `onClick` but lack semantic button traits.
**Action:**
- Always add `role="button"` to provide semantic meaning for screen readers.
- For desktop/web, add `tabIndex="0"` and `onKeyDown` (Enter/Space) for keyboard support.
- **Exception:** For strictly mobile/touch-first PWAs (like this iPhone optimized app), keyboard handlers may be omitted to reduce complexity if explicitly requested, but `role="button"` must be preserved for VoiceOver.
