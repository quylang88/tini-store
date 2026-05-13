## 2025-05-22 - [O(1) Product Lookup in Purchase List]
**Learning:** Chained `.find()` and `.map()` calls in core utility functions create O(N) or even O(N^2) bottlenecks when processing large inventory sets (e.g., 10k products). Replacing them with memoized `Map` lookups and imperative `for` loops with pre-allocated arrays significantly reduces execution time and GC pressure.
**Action:** Use memoized `Map` structures for ID and Name lookups in React hooks and pass them to heavy-lifting utility functions to maintain O(1) performance.

## 2026-05-06 - [O(1) Warehouse Lookup Maps]
**Learning:** Initializing multiple lookup maps (`keyMap`, `labelMap`, `shortLabelMap`) and static objects (`EMPTY_STOCK`) in a single pass via an IIFE avoids redundant iterations and allows O(1) lookups in utility functions. This pattern is significantly faster than repeated O(N) `.find()` calls on configuration arrays.
**Action:** Centralize configuration-based lookups into pre-computed maps within an IIFE at the module level.
