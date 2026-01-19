
export const getProductDate = (product) => {
  // If product has purchaseLots, find the latest created date
  if (product.purchaseLots && Array.isArray(product.purchaseLots) && product.purchaseLots.length > 0) {
    // Lots are usually appended, so the last one is likely the newest,
    // but let's sort to be safe or use reduce.
    const latestLot = product.purchaseLots.reduce((latest, current) => {
      const latestDate = new Date(latest.createdAt || 0);
      const currentDate = new Date(current.createdAt || 0);
      return currentDate > latestDate ? current : latest;
    }, product.purchaseLots[0]);

    if (latestLot && latestLot.createdAt) {
      return new Date(latestLot.createdAt).getTime();
    }
  }

  // Fallback to product creation date
  if (product.createdAt) {
    return new Date(product.createdAt).getTime();
  }

  // Fallback to ID if it's timestamp-like (numeric or starts with timestamp)
  // Our IDs are often Date.now().toString()
  const idTimestamp = Number(product.id);
  if (!isNaN(idTimestamp) && idTimestamp > 1600000000000) { // Basic sanity check for recent timestamp
    return idTimestamp;
  }

  return 0; // Unknown date, push to bottom
};
