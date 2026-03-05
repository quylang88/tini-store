## 2025-03-05 - ⚡ [Stats Detail] Replace filter & reduce with single for...of loop
**Learning:** O(N) iteration avoiding multiple array creation and `.reduce` callback overheads is a solid micro-optimization.
**Action:** Always favor a single `for...of` loop over large data lists replacing chained `.filter` and `.reduce` operations.
