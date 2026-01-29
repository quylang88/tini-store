import {
  generateReceiptHTMLContent,
  generateA4InvoiceHTMLContent,
} from "./invoiceTemplates";

/**
 * Handles file export by prioritizing Web Share API (for Mobile/PWA)
 * and falling back to direct download (for Desktop).
 *
 * @param {string|Blob|ArrayBuffer} content - The content of the file.
 * @param {string} fileName - The name of the file to save.
 * @param {string} mimeType - The MIME type for the Web Share API (e.g., "application/json", "text/csv", "text/html").
 *                            Note: Fallback download uses "application/octet-stream" to force download.
 * @returns {Promise<boolean>} - Returns true if shared/downloaded successfully.
 */
export const shareOrDownloadFile = async (content, fileName, mimeType) => {
  // 1. Ưu tiên sử dụng Web Share API (dành cho Mobile/Tablet/PWA)
  // Cách này giúp mở trực tiếp Share Sheet của OS (Save to Files, AirDrop, etc.)
  // Tránh việc mở file preview text trên iOS Safari
  try {
    const file = new File([content], fileName, { type: mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      const shareData = {
        files: [file],
      };

      await navigator.share(shareData);
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

export const exportDataToJSON = async (
  products,
  orders,
  settings,
  customers = [],
  aiChatSummary = "",
) => {
  // Không còn đọc từ localStorage nữa, nhận trực tiếp từ props

  const data = JSON.stringify({
    products,
    orders,
    settings,
    aiChatSummary,
    customers,
  });

  const fileName = `tiny_shop_${new Date().toISOString().slice(0, 10)}.json`;

  return await shareOrDownloadFile(data, fileName, "application/json");
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

// --- HTML Export Functions ---

/**
 * Exports order to HTML file with selectable format.
 * @param {Object} order - The order object.
 * @param {Array} products - List of products (for looking up details).
 * @param {string} format - 'receipt' (default) or 'a4'.
 */
export const exportOrderToHTML = async (
  order,
  products = [],
  format = "receipt",
) => {
  if (!order) return;

  const orderId = order.orderNumber ? order.orderNumber : order.id.slice(-4);
  let htmlContent = "";
  let fileName = "";

  if (format === "a4") {
    htmlContent = await generateA4InvoiceHTMLContent(order, products);
    fileName = `Don_hang_${orderId}.html`;
  } else {
    // Default to receipt
    htmlContent = await generateReceiptHTMLContent(order, products);
    fileName = `Bill_${orderId}.html`;
  }

  await shareOrDownloadFile(htmlContent, fileName, "text/html");
};
