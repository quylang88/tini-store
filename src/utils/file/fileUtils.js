import { formatNumber } from "../formatters/formatUtils";

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

// Simple HTML escaping to prevent XSS in generated reports
const escapeHtml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const fetchLogoBase64 = async () => {
  try {
    const response = await fetch("/tiny-shop-transparent.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load logo", error);
    return null;
  }
};

export const generateOrderHTMLContent = async (order, products = []) => {
  const items = order.items || order.products || [];
  const orderId = order.orderNumber
    ? `#${order.orderNumber}`
    : `#${order.id.slice(-4)}`;
  const orderDate = new Date(order.date).toLocaleString("vi-VN");
  const total = formatNumber(order.total || 0);

  // Tên khách hàng đã được xử lý default logic khi tạo đơn (saveOrder)
  // nên ở đây chỉ cần lấy từ order.customerName hoặc fallback "Khách lẻ"
  const customerName = escapeHtml(order.customerName || "Khách lẻ");

  const customerAddress = escapeHtml(order.customerAddress || "");
  const orderComment = escapeHtml(order.comment || "");

  const logoBase64 = await fetchLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Tiny Shop Logo" style="height: 100px; margin-bottom: 5px;">`
    : `<h1 class="shop-name">Tiny Shop</h1>`;

  // Inline CSS for receipt styling
  const style = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #e11d48; padding-bottom: 15px; }
      .shop-name { font-size: 24px; font-weight: bold; color: #e11d48; margin: 0; }
      .meta { font-size: 14px; color: #666; margin-top: 5px; }
      .customer-info { margin-bottom: 20px; font-size: 14px; background: #fff1f2; padding: 10px; border-radius: 8px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
      th { text-align: left; border-bottom: 2px solid #e11d48; padding: 8px 4px; color: #9f1239; font-weight: 600; }
      td { padding: 8px 4px; border-bottom: 1px solid #eee; vertical-align: top; }
      .right { text-align: right; }
      .center { text-align: center; }
      .total-section { border-top: 2px dashed #e11d48; padding-top: 15px; }
      .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
      .final-total { font-size: 20px; font-weight: bold; color: #e11d48; margin-top: 10px; }
      .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
    </style>
  `;

  const itemsRows = items
    .map((item, index) => {
      const product = products.find(
        (p) => p.id === item.productId || p.id === item.id,
      );
      const displayName = product ? product.name : item.name;
      const unitPrice =
        item.price !== undefined ? item.price : item.sellingPrice || 0;
      return `
    <tr>
      <td style="width: 5%; color: #999;">${index + 1}</td>
      <td>
        <div style="font-weight: 500;">${escapeHtml(displayName)}</div>
      </td>
      <td class="right" style="width: 20%;">${formatNumber(unitPrice)}đ</td>
      <td class="center" style="width: 10%;">${item.quantity}</td>
      <td class="right" style="width: 25%; font-weight: 500;">${formatNumber(unitPrice * item.quantity)}đ</td>
    </tr>
  `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đơn hàng ${orderId}</title>
  ${style}
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="meta">Phiếu xuất kho / Hóa đơn bán hàng</div>
    <div class="meta">${orderId} - ${orderDate}</div>
  </div>

  <div class="customer-info">
    <div><strong>Khách hàng:</strong> ${customerName}</div>
    ${customerAddress ? `<div><strong>Địa chỉ:</strong> ${customerAddress}</div>` : ""}
    ${orderComment ? `<div style="margin-top:5px; font-style:italic; color: #e11d48;">Ghi chú: ${orderComment}</div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Sản phẩm</th>
        <th class="right">Đơn giá</th>
        <th class="center">SL</th>
        <th class="right">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="total-section">
    <div class="row final-total">
      <span>Tổng cộng:</span>
      <span>${total}đ</span>
    </div>
  </div>

  <div class="footer">
    Cảm ơn quý khách đã mua hàng!
  </div>
</body>
</html>
  `;
};

export const exportOrderToHTML = async (order, products = []) => {
  if (!order) return;

  const htmlContent = await generateOrderHTMLContent(order, products);

  // Create filename: Don_hang_ID.html
  const orderId = order.orderNumber ? order.orderNumber : order.id.slice(-4);
  const fileName = `Don_hang_${orderId}.html`;

  await shareOrDownloadFile(htmlContent, fileName, "text/html");
};
