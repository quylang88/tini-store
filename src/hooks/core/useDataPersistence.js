import { useEffect, useRef } from "react";

/**
 * A hook to efficiently persist data changes to storage using a batch update strategy.
 * It tracks changes (Added, Updated, Deleted) by comparing the current data
 * with the previous state using a reference map.
 *
 * @param {Array} data - The current list of data items (e.g., products, orders).
 * @param {Function} saveBatchFn - The storage function to call with changes: { added, updated, deleted }.
 * @param {boolean} isLoaded - Flag indicating if the initial data load is complete.
 * @param {string} idKey - The unique key field of items (default: "id").
 */
const useDataPersistence = (data, saveBatchFn, isLoaded, idKey = "id") => {
  const previousDataMapRef = useRef(new Map());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // If data isn't loaded yet, do nothing (and reset init state if we logged out)
    if (!isLoaded) {
      hasInitializedRef.current = false;
      previousDataMapRef.current.clear();
      return;
    }

    // Convert current list to Map for O(1) lookups
    const currentDataMap = new Map();
    data.forEach((item) => {
      if (item && item[idKey]) {
        currentDataMap.set(item[idKey], item);
      }
    });

    // If this is the first render after data load, sync the reference without saving.
    // This optimization prevents the initial "Write-After-Read" that typically happens
    // when syncing state to DB on load.
    if (!hasInitializedRef.current) {
      previousDataMapRef.current = currentDataMap;
      hasInitializedRef.current = true;
      return;
    }

    // Identify changes
    const added = [];
    const updated = [];
    const deleted = [];
    const previousDataMap = previousDataMapRef.current;

    // 1. Find Added and Updated items
    for (const [id, item] of currentDataMap.entries()) {
      if (!previousDataMap.has(id)) {
        added.push(item);
      } else {
        const prevItem = previousDataMap.get(id);
        // We rely on referential equality check (prevItem !== item).
        // React state updates usually create new object references for changed items.
        if (prevItem !== item) {
          updated.push(item);
        }
      }
    }

    // 2. Find Deleted items
    for (const id of previousDataMap.keys()) {
      if (!currentDataMap.has(id)) {
        deleted.push(id);
      }
    }

    // 3. Execute batch save if there are changes
    if (added.length > 0 || updated.length > 0 || deleted.length > 0) {
      saveBatchFn({ added, updated, deleted });
    }

    // 4. Update the reference for the next cycle
    previousDataMapRef.current = currentDataMap;

  }, [data, isLoaded, saveBatchFn, idKey]);
};

export default useDataPersistence;
