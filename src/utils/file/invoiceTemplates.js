import {
  formatNumber,
  readMoneyToVietnamese,
} from "../formatters/formatUtils.js";

// Simple HTML escaping to prevent XSS
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

/**
 * Generates HTML for a standard small receipt (Bill K80).
 */
export const generateReceiptHTMLContent = async (order, products = []) => {
  const items = order.items || order.products || [];
  const orderId = order.orderNumber
    ? `#${order.orderNumber}`
    : `#${order.id.slice(-4)}`;
  const orderDate = new Date(order.date).toLocaleString("vi-VN");
  const total = formatNumber(order.total || 0);

  const customerName = escapeHtml(order.customerName || "Khách lẻ");
  const customerAddress = escapeHtml(order.customerAddress || "");
  const orderComment = escapeHtml(order.comment || "");

  const logoBase64 = await fetchLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Tiny Shop Logo" style="height: 100px; margin-bottom: 5px;">`
    : `<h1 class="shop-name">Tiny Shop</h1>`;

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

/**
 * Generates HTML for an A4 Warehouse Receipt (Phiếu Xuất Kho).
 */
export const generateA4InvoiceHTMLContent = async (order, products = []) => {
  const items = order.items || order.products || [];
  const orderId = order.orderNumber
    ? `#${order.orderNumber}`
    : `#${order.id.slice(-4)}`;
  const orderDate = new Date(order.date).toLocaleString("vi-VN");
  const total = formatNumber(order.total || 0);

  // Tính tổng số lượng
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountText = readMoneyToVietnamese(order.total || 0);

  const customerName = escapeHtml(order.customerName || "Khách lẻ");
  const customerAddress = escapeHtml(order.customerAddress || "");
  const orderComment = escapeHtml(order.comment || "");

  const logoBase64 = await fetchLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Logo" style="height: 80px;">`
    : `<h2 style="margin:0; color: #e11d48;">TINY SHOP</h2>`;

  const style = `
    <style>
      @page { size: A4; margin: 0; }
      body {
        font-family: "Times New Roman", Times, serif;
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        margin: 0 auto;
        box-sizing: border-box;
        color: #000;
        background: white;
      }
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 2px solid #000;
      }
      .shop-info { flex: 1; }
      .order-meta {
        text-align: right;
        font-size: 14px;
        line-height: 1.5;
      }
      .doc-title {
        text-align: center;
        font-size: 28px;
        font-weight: bold;
        margin: 25px 0;
        text-transform: uppercase;
      }
      .customer-section {
        margin-bottom: 20px;
        font-size: 15px;
        line-height: 1.6;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        margin-bottom: 20px;
      }
      .data-table th, .data-table td {
        border: 1px solid #000;
        padding: 8px;
      }
      .data-table th {
        background-color: #f0f0f0;
        font-weight: bold;
        text-align: center;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .total-section {
        margin-top: 10px;
      }
      .footer-msg {
        text-align: center;
        margin-top: 50px;
        font-size: 13px;
        color: #555;
      }
    </style>
  `;

  const itemsRows = items
    .map((item, index) => {
      const product = products.find(
        (p) => p.id === item.productId || p.id === item.id,
      );
      const displayName = product ? product.name : item.name;
      const barcode = product && product.barcode ? product.barcode : "-";
      const unitPrice =
        item.price !== undefined ? item.price : item.sellingPrice || 0;
      return `
    <tr>
      <td class="text-center" style="width: 5%;">${index + 1}</td>
      <td class="text-center" style="width: 15%;">${escapeHtml(barcode)}</td>
      <td>${escapeHtml(displayName)}</td>
      <td class="text-right" style="width: 15%;">${formatNumber(unitPrice)}</td>
      <td class="text-center" style="width: 10%;">${item.quantity}</td>
      <td class="text-right" style="width: 20%;">${formatNumber(unitPrice * item.quantity)}</td>
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
  <div class="header-section">
    <div class="shop-info">
      ${logoHtml}
      <div style="font-size: 14px; margin-top: 5px;">
        <div>Uy tín - Chất lượng - Tận tâm</div>
        <div>Điện thoại: 090.xxx.xxxx</div>
      </div>
    </div>
    <div class="order-meta">
      <div>Mã phiếu: <strong>${orderId}</strong></div>
      <div>Ngày: ${orderDate}</div>
    </div>
  </div>

  <div class="doc-title">ĐƠN HÀNG</div>

  <div class="customer-section">
    <table style="width: 100%; border: none;">
      <tr>
        <td style="width: 100px; border: none; padding: 2px;"><strong>Khách hàng:</strong></td>
        <td style="border: none; padding: 2px;">${customerName}</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px;"><strong>Địa chỉ:</strong></td>
        <td style="border: none; padding: 2px;">${customerAddress || "-"}</td>
      </tr>
      ${
        orderComment
          ? `
      <tr>
        <td style="border: none; padding: 2px;"><strong>Ghi chú:</strong></td>
        <td style="border: none; padding: 2px;">${orderComment}</td>
      </tr>
      `
          : ""
      }
    </table>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th>STT</th>
        <th>Mã SP</th>
        <th>Tên hàng hóa, dịch vụ</th>
        <th>Đơn giá</th>
        <th>SL</th>
        <th>Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="total-section">
    <table style="width: 100%; border-collapse: collapse; border: none;">
        <tr>
            <td style="text-align: right; padding: 4px; border: none;">Tổng số lượng:</td>
            <td style="width: 150px; text-align: right; padding: 4px; border: none; font-weight: bold; font-size: 16px;">${totalQuantity}</td>
        </tr>
        <tr>
            <td style="text-align: right; padding: 4px; border: none;">Tổng tiền:</td>
            <td style="width: 150px; text-align: right; padding: 4px; border: none; font-weight: bold; font-size: 20px;">${total}đ</td>
        </tr>
    </table>
    <div style="text-align: right; font-size: 14px; font-style: italic; font-weight: normal; margin-top: 5px;">
      (Bằng chữ: ${totalAmountText})
    </div>
  </div>

  <div class="footer-msg">
    Cảm ơn Quý khách và hẹn gặp lại!
  </div>
</body>
</html>
  `;
};
