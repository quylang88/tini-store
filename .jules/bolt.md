## 2024-05-18 - Init

## 2024-05-18 - Optimize StatsDetail Array Iterations and Date Parsing
**Learning:** Chaining `.filter().reduce()` operations with internal `new Date()` instantiation creates significant overhead for large datasets, especially when calculating derived metrics like `comparisonStats`. Relying on direct ISO string comparison is risky as the format isn't guaranteed. Using `Date.parse()` combined with a single-pass loop reduces garbage collection overhead and intermediate object allocation.
**Action:** Always replace `.filter().reduce()` chains with single `for...of` loops when traversing large lists of objects (like `orders`). Avoid instantiating `Date` objects in loops if `Date.parse()` or timestamp math (`getTime()`) can be used to compare dates safely.
