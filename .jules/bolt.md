## 2026-01-24 - Unstable Callback Breaks Memoization
**Learning:** Even with `React.memo`, if a callback prop (like `onDelete`) depends on the list state (e.g. `products`), it will be recreated on every list update, causing ALL memoized items to re-render.
**Action:** Decouple callbacks from list state by passing the full item object to the callback and using functional state updates (e.g. `setItems(prev => prev.filter(...))`). This removes the dependency on the list itself.
