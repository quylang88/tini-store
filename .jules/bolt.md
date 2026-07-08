## 2025-05-22 - [O(1) Product Lookup in Purchase List]
**Learning:** Chained `.find()` and `.map()` calls in core utility functions create O(N) or even O(N^2) bottlenecks when processing large inventory sets (e.g., 10k products). Replacing them with memoized `Map` lookups and imperative `for` loops with pre-allocated arrays significantly reduces execution time and GC pressure.
**Action:** Use memoized `Map` structures for ID and Name lookups in React hooks and pass them to heavy-lifting utility functions to maintain O(1) performance.

## 2026-05-06 - [O(1) Warehouse Lookup Maps]
**Learning:** Initializing multiple lookup maps (`keyMap`, `labelMap`, `shortLabelMap`) and static objects (`EMPTY_STOCK`) in a single pass via an IIFE avoids redundant iterations and allows O(1) lookups in utility functions. This pattern is significantly faster than repeated O(N) `.find()` calls on configuration arrays.
**Action:** Centralize configuration-based lookups into pre-computed maps within an IIFE at the module level.

## 2025-02-18 - Optimize duplicate code check in ProductBasicInfoModal
**Learning:** Replaced Array.prototype.find() with a for...of loop in src/screens/Inventory.jsx to check for duplicate productCode. While both are O(N), for...of avoids callback overhead and allows early breaking, providing a minor performance improvement. However, for a true O(1) lookup on large datasets, a memoized Map should be used. Given this runs onSave (infrequently) and the list isn't rendered here, the for...of loop is sufficient and simplifies the logic without requiring complex state management just for this check.
**Action:** Use for...of loop over Array.prototype.find() for simple linear searches, especially when early return/break is possible, to reduce callback overhead. If performance becomes a bottleneck for very large N in frequent operations, consider using a memoized Map/Set for O(1) lookups.
