import { normalizeUsageInstructions } from "../inventory/usageInstructions";

const padDatePart = (value) => String(value).padStart(2, "0");

const formatLocalDateForFile = (date) => [
  date.getFullYear(),
  padDatePart(date.getMonth() + 1),
  padDatePart(date.getDate()),
].join("-");

const formatLocalDateForDisplay = (date) => [
  padDatePart(date.getDate()),
  padDatePart(date.getMonth() + 1),
  date.getFullYear(),
].join("/");

export const getOrderUsageInstructionItems = (
  order = {},
  products = [],
) => {
  const productMap = new Map();
  for (const product of products) {
    if (product?.id) {
      productMap.set(product.id, product);
    }
  }

  const seenProductIds = new Set();
  const eligibleItems = [];
  const orderItems = order.items || order.products || [];

  for (const orderItem of orderItems) {
    const productId =
      orderItem.productId || orderItem.id || orderItem.product?.id;
    if (!productId || seenProductIds.has(productId)) continue;

    const product = productMap.get(productId);
    const usageInstructions = normalizeUsageInstructions(
      product?.usageInstructions,
    );
    if (!product || !usageInstructions) continue;

    seenProductIds.add(productId);
    eligibleItems.push({
      key: productId,
      productId,
      name: product.name || orderItem.name || "Sản phẩm",
      image: product.image || null,
      usageInstructions,
    });
  }

  return eligibleItems;
};

export const buildUsageInstructionsExportData = (
  order,
  products = [],
  exportedAt = new Date(),
) => {
  const items = getOrderUsageInstructionItems(order, products);
  if (items.length === 0) return null;

  return {
    items,
    dateDisplay: formatLocalDateForDisplay(exportedAt),
    fileName:
      `Phieu_HDSD_${formatLocalDateForFile(exportedAt)}.pdf`,
  };
};
