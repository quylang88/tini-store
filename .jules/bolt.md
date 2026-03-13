
## 2024-05-18 - [Optimize comparisonStats calculation]
**Learning:** Chained array methods (`.filter().reduce()`) over collections like `paidOrders` in `StatsDetail.jsx` create unnecessary intermediate array allocations and compound loop iterations. This pattern is particularly expensive when calculating complex nested metrics (like nested order items).
**Action:** Replace `.filter().reduce()` chains with a single `for...of` loop to calculate multiple aggregate metrics simultaneously (revenue, profit, count). Use `Date.parse()` over `new Date()` instantiation for numeric timestamp bounds checking.
