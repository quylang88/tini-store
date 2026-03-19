
## 2024-05-28 - [Single-pass for...of aggregation]
**Learning:** [When multiple derived values (e.g., total price, total quantity, estimated profit) are calculated from the same array using chained or separate \`.reduce()\` calls, it introduces redundant iterations and callback allocations. This is especially taxing in frequently rendered list components or large datasets.]
**Action:** [Combine multiple aggregate calculations into a single-pass \`for...of\` loop instead of multiple \`.reduce()\` iterations. Initialize variables before the loop and accumulate within it, to minimize O(N) operations and eliminate function allocation overheads.]
