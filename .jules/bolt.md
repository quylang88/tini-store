## 2024-05-22 - Sorting in Render
**Learning:** Found O(N log N) sorting logic inside the render function of `OrderListView`. This runs on every re-render (e.g., scroll events).
**Action:** Always check list components for inline sorting/filtering. Use `useMemo` for derived data that depends on props.
