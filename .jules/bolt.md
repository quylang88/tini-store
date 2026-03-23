
## 2025-02-19 - Optimize Aggregation Calculations over Arrays
**Learning:** Chaining multiple `.filter().reduce()` operations or nesting `.reduce()` calls to aggregate data over the same array structures incurs unnecessary intermediate array creation and O(N) functional iterations.
**Action:** Default to using single-pass `for...of` loops and pre-calculating or accumulating multiple target aggregates inside a single loop where appropriate, instead of splitting them up into sequential array methods, especially in highly computational hot-paths or deeply nested component hooks.
