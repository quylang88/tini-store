
## 2024-03-10 - [Optimize calcStats calculation in StatsDetail]
**Learning:** Chained array methods (`filter().reduce().reduce()`) combined with `new Date()` instantiations inside large data loops cause significant performance overhead due to intermediate array allocations and object instantiations.
**Action:** Replace array method chains with a single-pass `for...of` loop and use `Date.parse()` combined with timestamp comparison (`>=`, `<=`) to avoid object overhead when calculating aggregated stats over large collections.
