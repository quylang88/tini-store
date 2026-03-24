
## 2024-03-22 - Unified Iteration Over Large Arrays in React hooks
**Learning:** React component optimization often misses opportunities where multiple derived arrays or aggregations are calculated separately using chained higher-order functions (`.map().filter().reduce()`). This triggers numerous garbage collections and iterates over the data multiple times (O(3N) or worse).
**Action:** When calculating multiple aggregates (e.g., total revenue, estimated profit, and product-specific stats) from the exact same dataset (like `filteredPaidOrders`), default to a single-pass `for...of` loop within a single `useMemo` block. This reduces iteration overhead and function creation, providing near a 2x raw speed improvement on large order logs, directly impacting dashboard rendering times.
