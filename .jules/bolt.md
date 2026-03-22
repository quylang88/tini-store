
## 2024-10-24 - [Optimize Autocomplete Suggestion Filtering]
**Learning:** Chaining `.filter(condition).slice(0, limit)` on large arrays generates performance overhead by continuing iteration for the entire array (O(N)) even after the limit is reached, while concurrently constructing a potentially massive intermediate array in memory.
**Action:** Replace this pattern with a `for...of` loop containing an `if` block that `push()`es matches to a pre-declared array. Immediately `break` the loop when the array length hits the required `limit`. Always hoist invariant string normalization/transformations out of the loop.
