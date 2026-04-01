
## 2024-05-18 - [Cache Derived Properties via WeakMap]
**Learning:** Chained `.filter().reduce()` operations inside `useMemo` hooks cause significant performance issues for large arrays due to redundant parsing and multiple iterations. Mutating the object directly to cache values (like `Date.parse()` timestamps) can trigger ESLint immutability errors or crash if state objects are frozen.
**Action:** Use a module-level `WeakMap` to securely cache derived expensive values (e.g. timestamps from `Date.parse`) keyed by the object itself. Replace chained `.filter().reduce()` calls with a single `for...of` loop to eliminate redundant parsing and garbage collection overhead.
