
## 2024-05-18 - Single-pass loop vs multiple chained array operations
**Learning:** Chaining `.filter().reduce()` in React components dealing with thousands of items (e.g. `paidOrders`) allocates intermediate arrays and blocks the main thread with GC overhead. Instantiating `new Date()` within loops also incurs significant overhead.
**Action:** Replace `array.filter().reduce()` chains with a single `for` loop to manually accumulate totals. Use `Date.parse()` to get ms timestamps directly for comparison with pre-calculated boundary timestamps. This strategy improves calculation speed ~2.5x in JS.
