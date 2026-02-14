## 2024-05-22 - Optimizing Frequent Filter Calculations
**Learning:** When moving expensive calculations from a filter loop (O(N*M)) to a pre-calculated Map (O(1)), ensure the `useCallback` dependent on that Map includes the Map in its dependency array. React Compiler or manual verification is crucial to avoid stale closure bugs where the callback uses an empty or old Map.
**Action:** Always verify `useCallback` dependencies when introducing new memoized data structures.
