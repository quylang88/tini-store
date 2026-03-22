
## 2024-05-20 - Optimize Array.from mapped array generation
**Learning:** `Array.from({ length: N }, (_, i) => ...)` has significant performance overhead due to generating an object with a length property and processing it through the iterator protocol and a map function.
**Action:** Default to standard `for` loops and `new Array(length)` for runtime generated arrays. Substitute completely static `Array.from` calls with constant arrays.
