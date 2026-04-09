## 2024-05-24 - [Avoid Array.reduce for hot path calculations]
**Learning:** Using `Array.reduce` for simple sum aggregations creates unnecessary function allocation overhead inside components, especially when rendering lists (e.g. `OrderListItem.jsx`). Using a `for...of` loop is significantly faster.
**Action:** Replace `reduce` with `for...of` loops for calculating estimated profit or total amounts.

## 2024-05-24 - [Use Map for product lookups]
**Learning:** O(N*M) nested `.find()` lookups during rendering for lists can bottleneck React rendering. Using `useMemo` to build a product Map is much faster.
**Action:** Caching an O(1) Map with `useMemo` when looking up reference data in render functions.
