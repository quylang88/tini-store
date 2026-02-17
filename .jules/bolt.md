## 2026-02-17 - Optimize React.memo with Primitive Props
**Learning:** `React.memo` is only effective if props are stable. Passing a function (even with `useCallback`) can still trigger re-renders if its dependencies change (e.g. `getAvailableStock` depending on `stockMap` depending on `products`).
**Action:** Calculate values in the parent component and pass primitives (e.g. `availableStock` number) instead of functions to memoized children. This ensures the child only re-renders when the *value* changes, not just the function reference.
