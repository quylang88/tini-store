import { formatNumber } from "./helpers.js";

/**
 * Handles file export by prioritizing Web Share API (for Mobile/PWA)
 * and falling back to direct download (for Desktop).
 *
 * @param {string|Blob|ArrayBuffer} content - The content of the file.
 * @param {string} fileName - The name of the file to save.
 * @param {string} mimeType - The MIME type for the Web Share API (e.g., "application/json", "text/csv").
 *                            Note: Fallback download uses "application/octet-stream" to force download.
 * @param {string} [shareTitle] - Optional title for the share dialog.
 * @param {string} [shareText] - Optional text description for the share dialog.
 * @returns {Promise<boolean>} - Returns true if shared/downloaded successfully.
 */
export const shareOrDownloadFile = async (
  content,
  fileName,
  mimeType,
  shareTitle = "",
  shareText = "",
) => {
  // 1. Ưu tiên sử dụng Web Share API (dành cho Mobile/Tablet/PWA)
  // Cách này giúp mở trực tiếp Share Sheet của OS (Save to Files, AirDrop, etc.)
  // Tránh việc mở file preview text trên iOS Safari
  try {
    const file = new File([content], fileName, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: shareTitle || fileName,
        text: shareText || fileName,
      });
      return true; // Đã chia sẻ thành công
    }
  } catch (error) {
    // Nếu user huỷ share hoặc lỗi, log và fall back (nếu cần thiết, nhưng thường Cancel là do user)
    if (error.name !== "AbortError") {
      console.error("Lỗi chia sẻ file:", error);
    } else {
      // User huỷ chia sẻ -> coi như xong, không cần fallback download làm phiền
      return false;
    }
  }

  // 2. Fallback: Download truyền thống qua thẻ <a> (Desktop)
  // Sử dụng application/octet-stream để ép buộc trình duyệt download thay vì preview
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
  return true;
};

// --- Backup Functions ---

export const exportDataToJSON = async (products, orders, settings) => {
  const data = JSON.stringify({
    products,
    orders,
    settings,
  });

  const fileName = `tiny_shop_${new Date().toISOString().slice(0, 10)}.json`;

  return await shareOrDownloadFile(
    data,
    fileName,
    "application/json",
    "Backup Tiny Shop",
    "File sao lưu dữ liệu Tiny Shop",
  );
};

export const parseBackupFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        // Basic validation
        if (Array.isArray(data.products) && Array.isArray(data.orders)) {
          resolve(data);
        } else {
          reject(new Error("File backup thiếu dữ liệu products hoặc orders."));
        }
      } catch (error) {
        reject(
          new Error(
            "Không thể đọc file backup. File có thể bị lỗi: " + error.message,
          ),
        );
      }
    };
    reader.onerror = () =>
      reject(
        new Error("Lỗi đọc file: " + (reader.error?.message || "Unknown")),
      );
    reader.readAsText(file);
  });
};

// --- CSV Export Functions ---

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

export const exportOrderToCSV = async (order) => {
  if (!order) return;

  const BOM = "\uFEFF";
  const csvContent = generateOrderCSVContent(order);
  const fullContent = BOM + csvContent;

  // Create filename: Order_ID.csv or similar
  const orderId = order.orderNumber ? order.orderNumber : order.id.slice(-4);
  const fileName = `Don_hang_${orderId}.csv`;

  await shareOrDownloadFile(
    fullContent,
    fileName,
    "text/csv",
    "Xuất đơn hàng",
    `File CSV đơn hàng ${orderId}`,
  );
};
