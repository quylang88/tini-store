## 2025-05-22 - [O(1) Product Lookup in Purchase List]
**Learning:** Chained `.find()` and `.map()` calls in core utility functions create O(N) or even O(N^2) bottlenecks when processing large inventory sets (e.g., 10k products). Replacing them with memoized `Map` lookups and imperative `for` loops with pre-allocated arrays significantly reduces execution time and GC pressure.
**Action:** Use memoized `Map` structures for ID and Name lookups in React hooks and pass them to heavy-lifting utility functions to maintain O(1) performance.
