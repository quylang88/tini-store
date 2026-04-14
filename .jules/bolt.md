## 2024-05-24 - [Optimize Order Detail & List Rendering with Map lookups & for...of]
**Learning:** Using `Array.prototype.find()` inside a `.map()` or loop creates an O(N*M) time complexity bottleneck, especially when rendering lists or processing large arrays like order items and products. Additionally, using `.reduce()` creates intermediate function allocations.
**Action:** Always pre-compute a dictionary/Map using `useMemo` before mapping over items to achieve O(1) lookups, yielding significant performance gains (e.g., ~126x faster). Combine aggregations and use `for...of` loops instead of `.reduce()`.

## 2024-10-26 - [Optimize nested array and object aggregations via Map lookups and for...of iteration]
**Learning:** Chaining array methods `.filter().reduce()` causes intermediate array allocations and excessive callback overhead. Additionally, repeated Date parsing (e.g. `new Date(order.date).getTime()`) inside iterative comparisons compounds performance bottlenecks.
**Action:** Replace functional array chains with single-pass `for...of` loops. When calculating derived values on objects inside iteration arrays (like timestamp parsing), cache the computed result using a module-level `WeakMap` keyed by the object reference to completely eliminate redundant processing while ensuring garbage collection safety.
