
## 2024-05-22 - Inventory Scroll Performance
**Learning:** The `useScrollHandling` hook triggers frequent re-renders of the parent `Inventory` component on scroll (to update header/shadow state). Since `ProductList` rendered items inline, the entire list was re-rendering on every scroll event, causing jank.
**Action:** Extract list items into `React.memo` components and stabilize callback props (like `handleDelete`) with `useCallback` to prevent downstream re-renders.
