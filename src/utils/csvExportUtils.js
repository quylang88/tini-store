import { formatNumber } from "./helpers.js";

const escapeCSVValue = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const generateOrderCSVContent = (order) => {
  const header = ["STT", "Tên SP", "Số lượng", "Giá bán"];

  // Ensure items exists (fallback to empty array to prevent crash)
  // Also support 'products' alias if 'items' is missing, based on code review feedback.
  const items = order.items || order.products || [];

  const rows = items.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    // Use price or sellingPrice (fallback to 0)
    `${formatNumber(item.price !== undefined ? item.price : item.sellingPrice || 0)}đ`,
  ]);

  const csvContent = [
    header.join(","),
    ...rows.map((row) => row.map(escapeCSVValue).join(",")),
    `,,,${escapeCSVValue(`Tổng đơn: ${formatNumber(order.total || 0)}đ`)}`,
  ].join("\n");

  return csvContent;
};

export const exportOrderToCSV = (order) => {
  if (!order) return;

  const BOM = "\uFEFF";
  const csvContent = generateOrderCSVContent(order);

  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  // Create filename: Order_ID.csv or similar
  const orderId = order.orderNumber ? order.orderNumber : order.id.slice(-4);
  link.setAttribute("download", `Don_hang_${orderId}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
