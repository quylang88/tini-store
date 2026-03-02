## 2023-10-27 - [Memoize getProductStats with WeakMap]
**Learning:** Functions calculating derived stats based on product references (like `getProductStats`) that are called extensively within loops (e.g. `useDashboardLogic.js`) can create high GC pressure due to repeated object allocations.
**Action:** Use a `WeakMap` keyed by the product object reference to cache and return the exact same derived stat object, avoiding `O(N)` repeated execution and intermediate object creation.
