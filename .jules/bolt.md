## 2025-05-20 - Duplicated Logic in List Items
**Learning:** `ProductItem` was re-implementing `availableStock` calculation using `find` (O(M)) for every item in the list, resulting in O(N*M) complexity on render. The parent hook `useOrderCatalog` already had an optimized O(1) Map-based lookup.
**Action:** Always check if parent hooks have already computed the data needed by list items. Prop drill the optimized getter/data instead of re-calculating it in the child component, especially for expensive operations inside lists.
