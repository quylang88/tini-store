## 2025-05-20 - Unstable Hooks Causing List Re-renders
**Learning:** Custom hooks like `useScrollHandling` and `usePagination` returning non-memoized functions (`handleScroll`, `loadMore`) defeat `React.memo` in consumer components. In `OrderCreateView`, this caused the heavy `OrderCreateProductList` to re-render on every scroll event (state update), negating virtualization benefits.
**Action:** When designing hooks that return functions intended to be passed as props to memoized components, always wrap them in `useCallback`.
