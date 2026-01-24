
const HISTORY_KEY = "shop_import_history";

export const getImportHistory = () => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to load import history", error);
    return [];
  }
};

const saveImportHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    // Dispatch event for cross-component sync
    window.dispatchEvent(new Event("shop_import_history_change"));
  } catch (error) {
    console.error("Failed to save import history", error);
  }
};

export const restoreImportHistory = (history) => {
    if (!Array.isArray(history)) return;
    saveImportHistory(history);
};

/**
 * Logs a new import transaction.
 * @param {Object} product - The product object.
 * @param {Object} lot - The purchase lot being added.
 */
export const logImportTransaction = (product, lot) => {
  const history = getImportHistory();

  const existingIndex = history.findIndex((h) => h.id === lot.id);

  const record = {
    id: lot.id,
    productId: product.id,
    productName: product.name,
    importDate: lot.createdAt || new Date().toISOString(),
    cost: Number(lot.cost) || 0,
    costJpy: lot.costJpy ? Number(lot.costJpy) : undefined, // Save JPY cost if available
    priceAtPurchase: Number(lot.priceAtPurchase) || 0,
    originalQuantity: Number(lot.quantity) || 0,
    remainingQuantity: Number(lot.quantity) || 0,
    warehouse: lot.warehouse || "lamDong",
    shipping: lot.shipping ? { ...lot.shipping } : null,
  };

  if (existingIndex !== -1) {
    history[existingIndex] = { ...history[existingIndex], ...record };
  } else {
    history.push(record);
  }

  saveImportHistory(history);
};

/**
 * Updates an existing history record (e.g. user edits the import details).
 * @param {Object} updatedRecord
 */
export const updateImportHistoryRecord = (updatedRecord) => {
  const history = getImportHistory();
  const index = history.findIndex((h) => h.id === updatedRecord.id);

  if (index !== -1) {
    history[index] = { ...history[index], ...updatedRecord };
    saveImportHistory(history);
  }
};

/**
 * Syncs history remaining quantity based on stock consumption or restoration.
 * @param {string} productId
 * @param {Array} allocations - [{ lotId, quantity }]
 * @param {string} mode - 'consume' (default) or 'restore'
 */
export const syncHistoryWithStock = (productId, allocations, mode = 'consume') => {
  if (!allocations || allocations.length === 0) return;

  const history = getImportHistory();
  let changed = false;

  allocations.forEach((alloc) => {
    const record = history.find((h) => h.id === alloc.lotId);
    if (record) {
      const delta = Number(alloc.quantity) || 0;
      let newRemaining = Number(record.remainingQuantity) || 0;

      if (mode === 'restore') {
        newRemaining += delta;
      } else {
        newRemaining = Math.max(0, newRemaining - delta);
      }

      record.remainingQuantity = newRemaining;
      changed = true;
    }
  });

  if (changed) {
    saveImportHistory(history);
  }
};
