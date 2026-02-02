## 2024-05-23 - [Optimizing Heavy UI Component Re-renders]
**Learning:** Heavy components like `ProductFilterHeader` (containing animations and tabs) can cause significant render lag if not memoized, especially when parent components manage frequent state updates (like scroll position or form inputs).
**Action:** Always wrap heavy, static UI sections in `React.memo` and ensure callback props are stable using `useCallback`.
