## 2024-05-22 - Avoid Date Instantiation in Sort
**Learning:** Instantiating `new Date()` inside a `sort` comparator is a performance anti-pattern (O(N log N) allocations).
**Action:** When sorting by ISO date strings, use `String.prototype.localeCompare` or direct string comparison (`>`) instead of converting to Date objects.
