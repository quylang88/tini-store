## 2024-05-23 - Pre-calculating Sort Keys in Cached Wrappers
**Learning:** When using a `WeakMap` or similar cache for search wrappers, also cache derived values used for sorting (like latest dates or prices). This prevents repeated $O(N)$ traversals (e.g., scanning purchase lots) during the sort phase, which happens frequently on UI interactions.
**Action:** Move `getSortValue` logic into the `searchableProducts` useMemo block to calculate it once per product update, rather than once per sort/filter operation.
