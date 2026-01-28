import { getLatestLot } from "../inventory/purchaseUtils.js";

export const getProductDate = (product) => {
  // If product has purchaseLots, find the latest created date
  // Sử dụng getLatestLot để tận dụng cache WeakMap, tránh lặp lại vòng lặp O(N)
  const latestLot = getLatestLot(product);
  if (latestLot && latestLot.createdAt) {
    return latestLot.createdAt;
  }

  // Fallback to product creation date
  if (product.createdAt) {
    return product.createdAt;
  }

  // Fallback to ID if it's timestamp-like (numeric or starts with timestamp)
  // Our IDs are often Date.now().toString()
  const idTimestamp = Number(product.id);
  if (!isNaN(idTimestamp) && idTimestamp > 1600000000000) {
    // Basic sanity check for recent timestamp
    // Convert to ISO string to maintain comparable type
    return new Date(idTimestamp).toISOString();
  }

  return ""; // Unknown date, push to bottom
};
