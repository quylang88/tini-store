import {  normalizeString } from "../formatters/formatUtils.js";
import {
  getDefaultWarehouse,
  getWarehouseLabel,
  resolveWarehouseKey,
} from "../inventory/warehouseUtils.js";

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const sanitizeFilePart = (value) =>
  normalizeText(value)
    .replace(/#/g, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

export const getOrderReference = (order = {}) => {
  if (order.orderNumber) {
    return `#${order.orderNumber}`;
  }

  const fallbackId = String(order.id || "").slice(-4);
  return fallbackId ? `#${fallbackId}` : "#----";
};

export const getOrderReferenceSlug = (order = {}) =>
  sanitizeFilePart(getOrderReference(order));

export const estimateWrappedLineCount = (text, maxCharsPerLine = 30) => {
  const normalized = normalizeText(text);
  if (!normalized) return 1;

  const words = normalized.split(" ");
  let lines = 1;
  let currentLineLength = 0;

  for (const word of words) {
    const wordLength = word.length;
    if (currentLineLength === 0) {
      currentLineLength = wordLength;
      continue;
    }

    if (currentLineLength + 1 + wordLength > maxCharsPerLine) {
      lines += 1;
      currentLineLength = wordLength;
    } else {
      currentLineLength += 1 + wordLength;
    }
  }

  return lines;
};

export const paginateByBudget = (items, getItemBudget, maxBudget) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const safeMaxBudget = Math.max(1, Number(maxBudget) || 1);
  const pages = [];
  let currentPage = [];
  let currentBudget = 0;

  for (const item of items) {
    const itemBudget = Math.max(1, Number(getItemBudget(item)) || 1);

    if (
      currentPage.length > 0 &&
      currentBudget + itemBudget > safeMaxBudget
    ) {
      pages.push(currentPage);
      currentPage = [];
      currentBudget = 0;
    }

    currentPage.push(item);
    currentBudget += itemBudget;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

export const buildOrdersExportData = (ordersInput, products = []) => {
  const orders = Array.isArray(ordersInput)
    ? ordersInput.filter(Boolean)
    : [ordersInput].filter(Boolean);

  if (orders.length === 0) return null;

  const productMap = new Map();
  products.forEach((product) => {
    if (product?.id) {
      productMap.set(product.id, product);
    }
  });

  const firstOrder = orders[0];
  const orderType = firstOrder.orderType || "delivery";
  const warehouseKey =
    resolveWarehouseKey(firstOrder.warehouse) || getDefaultWarehouse().key;
  const warehouseLabel = getWarehouseLabel(warehouseKey);
  const customerName =
    normalizeText(firstOrder.customerName) ||
    (orderType === "warehouse" ? warehouseLabel : "Khách lẻ");

  const itemMap = new Map();
  const orderReferences = [];
  const noteEntries = [];
  const rawAddresses = [];

  let totalQuantity = 0;
  let totalAmount = 0;
  let shippingFeeTotal = 0;

  for (const order of orders) {
    const orderReference = getOrderReference(order);
    orderReferences.push(orderReference);

    const orderComment = normalizeText(order.comment);
    if (orderComment) {
      noteEntries.push({
        orderId: order.id,
        orderReference,
        comment: orderComment,
      });
    }

    rawAddresses.push(normalizeText(order.customerAddress));
    shippingFeeTotal += Number(order.shippingFee || 0) || 0;

    const items = order.items || order.products || [];
    for (const item of items) {
      const unitPrice =
        Number(
          item.price !== undefined ? item.price : item.sellingPrice || 0,
        ) || 0;
      const quantity = Number(item.quantity || 0) || 0;
      const product =
        productMap.get(item.productId) ||
        productMap.get(item.id) ||
        productMap.get(item.product?.id);
      const displayName = normalizeText(product?.name || item.name || "Sản phẩm");
      const baseKey =
        item.productId ||
        item.id ||
        normalizeString(item.name || product?.name || displayName) ||
        displayName;
      const mergeKey = `${baseKey}__${unitPrice}`;

      if (!itemMap.has(mergeKey)) {
        itemMap.set(mergeKey, {
          key: mergeKey,
          productId: item.productId || item.id || null,
          barcode: normalizeText(product?.barcode) || "-",
          name: displayName,
          image: product?.image || null,
          price: unitPrice,
          quantity: 0,
        });
      }

      const entry = itemMap.get(mergeKey);
      entry.quantity += quantity;
      totalQuantity += quantity;
      totalAmount += unitPrice * quantity;
    }
  }

  const normalizedAddresses = rawAddresses.map((address) => normalizeString(address));
  const distinctAddressKeys = new Set(normalizedAddresses);
  let customerAddress = normalizeText(firstOrder.customerAddress);

  if (orderType === "delivery" && distinctAddressKeys.size > 1) {
    customerAddress = "Nhiều địa chỉ";
  }

  const uniqueNotes = new Set(noteEntries.map((entry) => normalizeString(entry.comment)));
  const sharedComment =
    uniqueNotes.size === 1 && noteEntries.length > 0 ? noteEntries[0].comment : "";

  const items = Array.from(itemMap.values()).map((item) => ({
    ...item,
    total: item.price * item.quantity,
  }));

  const exportedAt = new Date();
  const primaryOrderDate = new Date(firstOrder.date || exportedAt);
  const referenceSlug = orderReferences
    .slice(0, 3)
    .map((reference) => sanitizeFilePart(reference))
    .filter(Boolean)
    .join("_");

  return {
    orders,
    items,
    orderType,
    warehouseKey,
    warehouseLabel,
    customerName,
    customerAddress,
    totalQuantity,
    totalAmount,
    shippingFeeTotal,
    orderCount: orders.length,
    isMerged: orders.length > 1,
    orderReferences,
    orderReferencesText: orderReferences.join(", "),
    referenceSlug:
      referenceSlug || sanitizeFilePart(customerName) || sanitizeFilePart(warehouseLabel),
    primaryOrderReference: orderReferences[0],
    primaryOrderDateDisplay: primaryOrderDate.toLocaleString("vi-VN"),
    exportedAtDisplay: exportedAt.toLocaleString("vi-VN"),
    partyLabel: orderType === "warehouse" ? "Kho xuất" : "Khách hàng",
    partyValue: orderType === "warehouse" ? warehouseLabel : customerName,
    sharedComment,
    noteEntries: uniqueNotes.size > 1 ? noteEntries : [],
  };
};

export const buildOrdersExportBaseName = (
  exportData,
  singlePrefix,
  mergedPrefix,
) => {
  if (!exportData) return singlePrefix;

  const prefix = exportData.isMerged ? mergedPrefix : singlePrefix;

  if (!exportData.isMerged) {
    return `${prefix}_${sanitizeFilePart(exportData.primaryOrderReference)}`;
  }

  const refPart =
    exportData.referenceSlug ||
    sanitizeFilePart(exportData.customerName) ||
    sanitizeFilePart(exportData.warehouseLabel) ||
    "don_gop";

  return `${prefix}_${refPart}`;
};
