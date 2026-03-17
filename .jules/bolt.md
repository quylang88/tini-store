## 2026-03-17 - [Combine array aggregations into a single pass loop]
**Learning:** Multiple `.reduce()` calls on the same array create redundant O(N) loops and callback allocation overhead. This can impact performance on views processing large orders with many items.
**Action:** Use a single-pass `for...of` loop when calculating multiple aggregates (like total quantity, estimated profit) from the same array.
