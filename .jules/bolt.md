## 2024-05-23 - Search Performance Optimization
**Learning:** React render loops (like filtering) often hide expensive operations like regex-based string normalization. Pre-calculating these derived values outside the render loop (using useMemo) can significantly reduce CPU time during high-frequency events like typing.
**Action:** Always check for repeated transformations in `filter` or `map` loops and lift them up if possible.
