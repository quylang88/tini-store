## 2024-05-23 - List Performance: Handler Dependencies
**Learning:** In list views, passing the full item object to handlers (e.g., `onDelete(item)`) instead of just `id` allows using functional state updates (`setItems(prev => prev.filter(i => i.id !== item.id))`) without depending on the full `items` array in the handler's closure. This enables stable `useCallback` references that don't change when the list changes, preventing all rows from re-rendering when one row is modified.
**Action:** Prefer `handler(item)` signature for list actions to decouple handlers from list state.
