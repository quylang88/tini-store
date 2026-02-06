# Bolt's Journal

This journal tracks critical performance learnings to avoid repeating mistakes or ineffective optimizations.

## Format
`## YYYY-MM-DD - [Title]`
`**Learning:** [Insight]`
`**Action:** [How to apply next time]`

## 2024-05-22 - [WeakMap Caching for Derived Objects]
**Learning:** `useMemo` in React components (like `ProductListItem`) re-runs when dependencies change (`[product]`), even if the relevant internal structure (`stockByWarehouse`) hasn't changed. By caching derived data (like normalized stock) in a module-level `WeakMap` keyed by the internal structure, we can return stable object references.
**Action:** Use `WeakMap` to cache heavy or frequently accessed derived data where the input object reference is stable but its parent might change. Check if the parent re-renders often (e.g., list items).
