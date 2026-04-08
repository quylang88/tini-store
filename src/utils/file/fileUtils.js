import {
  generateReceiptHTMLContent,
  generateA4InvoiceHTMLContent,
} from "./invoiceTemplates";
import { generateOrderImages } from "./imageExportUtils";
import {
  buildOrdersExportBaseName,
  buildOrdersExportData,
} from "./orderExportUtils";

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
  return shareOrDownloadFiles([{ content, fileName, mimeType }]);
};

export const shareOrDownloadFiles = async (entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return false;
  }

  const files = entries.map(({ content, fileName, mimeType }) => {
    if (content instanceof File) {
      return content;
    }

    return new File([content], fileName, { type: mimeType });
  });

  try {
    if (navigator.canShare && navigator.canShare({ files })) {
      const shareData = {
        files,
      };

      await navigator.share(shareData);
      return true;
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Lỗi chia sẻ file:", error);
    } else {
      return false;
    }
  }

  for (const entry of entries) {
    const blob =
      entry.content instanceof Blob
        ? entry.content
        : new Blob([entry.content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", entry.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 200);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return true;
};

// --- Backup Functions ---

export const exportDataToJSON = async (
  products,
  orders,
  settings,
  customers = [],
  aiChatSummary = "",
  purchaseLists = [],
) => {
  // Không còn đọc từ localStorage nữa, nhận trực tiếp từ props

  const data = JSON.stringify({
    products,
    orders,
    settings,
    aiChatSummary,
    customers,
    purchaseLists,
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
  return exportOrdersToHTML([order], products, format);
};

export const exportOrdersToHTML = async (
  orders,
  products = [],
  format = "receipt",
) => {
  const exportData = buildOrdersExportData(orders, products);
  if (!exportData) return;

  let htmlContent = "";
  let fileName = "";

  if (format === "a4") {
    htmlContent = await generateA4InvoiceHTMLContent(exportData);
    fileName = `${buildOrdersExportBaseName(exportData, "Don_hang", "Don_gop")}.html`;
  } else {
    htmlContent = await generateReceiptHTMLContent(exportData);
    fileName = `${buildOrdersExportBaseName(exportData, "Bill", "Bill_gop")}.html`;
  }

  await shareOrDownloadFile(htmlContent, fileName, "text/html");
};

export const exportOrdersToImages = async (orders, products = []) => {
  const exportData = buildOrdersExportData(orders, products);
  if (!exportData) return;

  const imageBlobs = await generateOrderImages(exportData);
  const baseName = buildOrdersExportBaseName(
    exportData,
    "Don_hang",
    "Don_gop",
  );

  const files = imageBlobs.map((blob, index) => ({
    content: blob,
    fileName:
      imageBlobs.length === 1
        ? `${baseName}.png`
        : `${baseName}_trang_${index + 1}.png`,
    mimeType: "image/png",
  }));

  await shareOrDownloadFiles(files);
};
