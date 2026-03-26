## 2025-03-26 - Optimized analyzeInventory in analyticsService.js
**Learning:** Chaining `.filter().map()` on large arrays creates intermediate arrays and involves multiple iterations. In performance-critical paths, a single `for...of` loop is more efficient as it reduces allocations and iterates only once.
**Action:** Use a single `for...of` loop to replace multiple sequential array transformations when performance is a priority.
