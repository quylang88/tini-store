## 2025-05-22 - Custom Tabs Accessibility Pattern
**Learning:** This app frequently uses custom scrollable containers (`ScrollableTabs`) for category filtering, implemented as simple buttons. These lack `role="tablist"` and `role="tab"`, making the structure opaque to screen readers which just see a sequence of buttons.
**Action:** For any horizontal scrollable filter/nav list, default to `role="tablist"` pattern instead of generic buttons to convey structure and selection state.
