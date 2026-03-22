import {
  formatNumber,
  readMoneyToVietnamese,
} from "../formatters/formatUtils.js";
import {
  estimateWrappedLineCount,
  paginateByBudget,
} from "./orderExportUtils.js";
import { getExportContacts } from "./exportContactInfo.js";

const matchHtmlRegExp = /["'&<>]/g;
const escapeHtml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) return "";
  const str = String(unsafe);
  if (str.search(matchHtmlRegExp) === -1) {
    return str;
  }

  return str.replace(matchHtmlRegExp, (match) => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return match;
    }
  });
};

let cachedLogoBase64 = null;
let logoFetchPromise = null;

const fetchLogoBase64 = async () => {
  if (cachedLogoBase64) return cachedLogoBase64;
  if (logoFetchPromise) return logoFetchPromise;

  logoFetchPromise = (async () => {
    try {
      const response = await fetch("/tiny-shop-transparent.png");
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      cachedLogoBase64 = base64;
      return base64;
    } catch (error) {
      console.error("Failed to load logo", error);
      return null;
    } finally {
      logoFetchPromise = null;
    }
  })();

  return logoFetchPromise;
};

const renderOrderNotesHTML = (exportData, tone = "receipt") => {
  if (!exportData) return "";

  const wrapperClass =
    tone === "a4"
      ? "notes-block"
      : "margin-top:8px; padding-top:8px; border-top:1px dashed #fda4af;";

  if (exportData.sharedComment) {
    return tone === "a4"
      ? `<div class="notes-block"><div class="notes-title">Ghi chú</div><div class="notes-item">${escapeHtml(exportData.sharedComment)}</div></div>`
      : `<div style="${wrapperClass}"><div style="font-weight:600; color:#9f1239;">Ghi chú</div><div style="margin-top:4px; font-style:italic; color:#e11d48;">${escapeHtml(exportData.sharedComment)}</div></div>`;
  }

  if (!exportData.noteEntries?.length) {
    return "";
  }

  let notesHtml = "";
  for (const entry of exportData.noteEntries) {
    notesHtml +=
      tone === "a4"
        ? `<div class="notes-item"><strong>${escapeHtml(entry.orderReference)}:</strong> ${escapeHtml(entry.comment)}</div>`
        : `<div style="margin-top:4px;"><strong>${escapeHtml(entry.orderReference)}:</strong> ${escapeHtml(entry.comment)}</div>`;
  }

  return tone === "a4"
    ? `<div class="notes-block"><div class="notes-title">Ghi chú đơn</div>${notesHtml}</div>`
    : `<div style="${wrapperClass}"><div style="font-weight:600; color:#9f1239;">Ghi chú đơn</div>${notesHtml}</div>`;
};

const getContactIconMarkup = (contact) => {
  if (contact.key === "facebook") {
    return `<span class="contact-icon-letter" style="background:${contact.accent};">f</span>`;
  }

  return `<span class="contact-icon-letter" style="background:${contact.accent};">Z</span>`;
};

const renderContactStripHTML = () => {
  const contacts = getExportContacts();
  if (!contacts.length) return "";

  let contactsHtml = "";
  for (const contact of contacts) {
    contactsHtml += `
        <a
          class="contact-pill"
          href="${escapeHtml(contact.href)}"
          target="_blank"
          rel="noreferrer"
        >
          ${getContactIconMarkup(contact)}
          <span class="contact-copy">
            <span class="contact-title">${escapeHtml(contact.title)}</span>
            <span class="contact-value">${escapeHtml(contact.value)}</span>
          </span>
        </a>
      `;
  }

  return `<div class="contact-strip">${contactsHtml}</div>`;
};

const renderReceiptCustomerInfo = (exportData) => {
  const addressHtml =
    exportData.orderType === "delivery" && exportData.customerAddress
      ? `<div><strong>Địa chỉ:</strong> ${escapeHtml(exportData.customerAddress)}</div>`
      : "";

  const mergedMetaHtml = exportData.isMerged
    ? `
      <div><strong>Mã đơn:</strong> ${escapeHtml(exportData.orderReferencesText)}</div>
      <div><strong>Ngày xuất:</strong> ${escapeHtml(exportData.exportedAtDisplay)}</div>
    `
    : "";

  return `
    <div class="customer-info">
      <div><strong>${escapeHtml(exportData.partyLabel)}:</strong> ${escapeHtml(exportData.partyValue)}</div>
      ${addressHtml}
      ${mergedMetaHtml}
      ${renderOrderNotesHTML(exportData, "receipt")}
    </div>
  `;
};

const getA4PageBudget = (exportData) => {
  const sharedCommentBudget = exportData.sharedComment
    ? estimateWrappedLineCount(exportData.sharedComment, 90)
    : 0;
  const orderNoteBudget = (exportData.noteEntries || []).reduce(
    (total, entry) =>
      total +
      estimateWrappedLineCount(`${entry.orderReference}: ${entry.comment}`, 90),
    0,
  );
  const penalty = Math.min(
    8,
    Math.ceil((sharedCommentBudget + orderNoteBudget) / 3),
  );

  return Math.max(12, 22 - penalty);
};

const paginateA4Items = (exportData) => {
  const maxBudget = getA4PageBudget(exportData);
  const pages = paginateByBudget(
    exportData.items,
    (item) => Math.max(1, estimateWrappedLineCount(item.name, 30)),
    maxBudget,
  );

  return pages.length > 0 ? pages : [[]];
};

const renderA4CustomerTable = (exportData) => {
  const addressRow =
    exportData.orderType === "delivery"
      ? `
      <tr>
        <td style="width: 110px; border: none; padding: 2px;"><strong>Địa chỉ:</strong></td>
        <td style="border: none; padding: 2px;">${escapeHtml(exportData.customerAddress || "-")}</td>
      </tr>
    `
      : "";

  return `
    <table style="width: 100%; border: none;">
      <tr>
        <td style="width: 110px; border: none; padding: 2px;"><strong>${escapeHtml(exportData.partyLabel)}:</strong></td>
        <td style="border: none; padding: 2px;">${escapeHtml(exportData.partyValue)}</td>
      </tr>
      ${addressRow}
      <tr>
        <td style="border: none; padding: 2px;"><strong>Mã đơn:</strong></td>
        <td style="border: none; padding: 2px;">${escapeHtml(exportData.orderReferencesText)}</td>
      </tr>
      <tr>
        <td style="border: none; padding: 2px;"><strong>Ngày xuất:</strong></td>
        <td style="border: none; padding: 2px;">${escapeHtml(exportData.exportedAtDisplay)}</td>
      </tr>
    </table>
  `;
};

export const generateReceiptHTMLContent = async (exportData) => {
  if (!exportData) return "";

  const logoBase64 = await fetchLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Tiny Shop Logo" style="height: 100px; margin-bottom: 5px;">`
    : `<h1 class="shop-name">Tiny Shop</h1>`;

  const titleText = exportData.isMerged ? "HÓA ĐƠN GỘP" : "Hóa đơn";
  const metaText = exportData.isMerged
    ? `Ngày xuất: ${escapeHtml(exportData.exportedAtDisplay)}`
    : `${escapeHtml(exportData.primaryOrderReference)} - ${escapeHtml(exportData.primaryOrderDateDisplay)}`;

  let itemsRows = "";
  for (let index = 0; index < exportData.items.length; index++) {
    const item = exportData.items[index];
    itemsRows += `
      <tr>
        <td style="width: 5%; color: #999;">${index + 1}</td>
        <td>
          <div style="font-weight: 500;">${escapeHtml(item.name)}</div>
        </td>
        <td class="right" style="width: 20%;">${formatNumber(item.price)}đ</td>
        <td class="center" style="width: 10%;">${item.quantity}</td>
        <td class="right" style="width: 25%; font-weight: 500;">${formatNumber(item.total)}đ</td>
      </tr>
    `;
  }

  const style = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #e11d48; padding-bottom: 15px; }
      .shop-name { font-size: 24px; font-weight: bold; color: #e11d48; margin: 0; }
      .meta { font-size: 14px; color: #666; margin-top: 5px; }
      .customer-info { margin-bottom: 20px; font-size: 14px; background: #fff1f2; padding: 10px; border-radius: 8px; }
      .contact-strip { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 16px 0 18px; }
      .contact-pill { display: inline-flex; align-items: center; gap: 10px; min-width: 220px; text-decoration: none; color: #1f2937; background: linear-gradient(135deg, #fff, #fff1f2); border: 1px solid #fecdd3; border-radius: 999px; padding: 8px 14px; box-shadow: 0 10px 25px -18px rgba(225, 29, 72, 0.9); }
      .contact-icon-letter { width: 32px; height: 32px; border-radius: 999px; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; text-transform: uppercase; flex-shrink: 0; }
      .contact-copy { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2; }
      .contact-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #be123c; }
      .contact-value { font-size: 13px; font-weight: 700; color: #0f172a; }
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

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(titleText)}</title>
  ${style}
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="meta">${titleText}</div>
    <div class="meta">${metaText}</div>
  </div>

  ${renderContactStripHTML()}

  ${renderReceiptCustomerInfo(exportData)}

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
    <div class="row">
      <span>Tổng số lượng:</span>
      <span>${exportData.totalQuantity} sp</span>
    </div>
    <div class="row final-total">
      <span>Tổng cộng:</span>
      <span>${formatNumber(exportData.totalAmount)}đ</span>
    </div>
  </div>

  <div class="footer">
    Cảm ơn quý khách đã mua hàng!
  </div>
</body>
</html>
  `;
};

export const generateA4InvoiceHTMLContent = async (exportData) => {
  if (!exportData) return "";

  const totalAmountText = readMoneyToVietnamese(exportData.totalAmount || 0);
  const logoBase64 = await fetchLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Logo" style="height: 80px;">`
    : `<h2 style="margin:0; color: #e11d48;">TINY SHOP</h2>`;

  const pages = paginateA4Items(exportData);
  let runningIndex = 0;

  let pageHtml = "";
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageItems = pages[pageIndex];
    const isLastPage = pageIndex === pages.length - 1;
    let rowsHtml = "";
    for (const item of pageItems) {
      runningIndex += 1;
      rowsHtml += `
            <tr>
              <td class="text-center" style="width: 5%;">${runningIndex}</td>
              <td class="text-center" style="width: 15%;">${escapeHtml(item.barcode || "-")}</td>
              <td>${escapeHtml(item.name)}</td>
              <td class="text-right" style="width: 15%;">${formatNumber(item.price)}</td>
              <td class="text-center" style="width: 10%;">${item.quantity}</td>
              <td class="text-right" style="width: 20%;">${formatNumber(item.total)}</td>
            </tr>
          `;
    }

    pageHtml += `
        <section class="a4-page ${isLastPage ? "" : "page-break"}">
          <div class="header-section">
            <div class="shop-info">
              ${logoHtml}
              <div style="font-size: 14px; margin-top: 5px;">
                <div>Uy tín - Chất lượng - Tận tâm</div>
              </div>
            </div>
            <div class="order-meta">
              <div>${exportData.isMerged ? `Số đơn gộp: <strong>${exportData.orderCount}</strong>` : `Mã phiếu: <strong>${escapeHtml(exportData.primaryOrderReference)}</strong>`}</div>
              <div>Ngày xuất: ${escapeHtml(exportData.exportedAtDisplay)}</div>
              <div>Trang: ${pageIndex + 1} / ${pages.length}</div>
            </div>
          </div>

          <div class="doc-title">${exportData.isMerged ? "ĐƠN HÀNG GỘP" : "ĐƠN HÀNG"}</div>

          ${renderContactStripHTML()}

          <div class="customer-section">
            ${renderA4CustomerTable(exportData)}
            ${renderOrderNotesHTML(exportData, "a4")}
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
              ${rowsHtml}
            </tbody>
          </table>

          ${
            isLastPage
              ? `
                <div class="total-section">
                  <table style="width: 100%; border-collapse: collapse; border: none;">
                    <tr>
                      <td style="text-align: right; padding: 4px; border: none;">Tổng số lượng:</td>
                      <td style="width: 150px; text-align: right; padding: 4px; border: none; font-weight: bold; font-size: 16px;">${exportData.totalQuantity}</td>
                    </tr>
                    <tr>
                      <td style="text-align: right; padding: 4px; border: none;">Tổng tiền:</td>
                      <td style="width: 150px; text-align: right; padding: 4px; border: none; font-weight: bold; font-size: 20px;">${formatNumber(exportData.totalAmount)}đ</td>
                    </tr>
                  </table>
                  <div style="text-align: right; font-size: 14px; font-style: italic; font-weight: normal; margin-top: 5px;">
                    (Bằng chữ: ${totalAmountText})
                  </div>
                </div>
              `
              : `<div class="continuation-text">Tiếp trang sau</div>`
          }

          <div class="footer-msg">
            Cảm ơn Quý khách và hẹn gặp lại!
          </div>
        </section>
      `;
  }

  const style = `
    <style>
      @page { size: A4; margin: 0; }
      body {
        font-family: "Times New Roman", Times, serif;
        margin: 0;
        color: #000;
        background: white;
      }
      .a4-page {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        margin: 0 auto;
        box-sizing: border-box;
        background: white;
      }
      .page-break {
        page-break-after: always;
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
        line-height: 1.6;
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
      .contact-strip {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
        margin: -5px 0 18px;
      }
      .contact-pill {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-width: 250px;
        text-decoration: none;
        color: #111827;
        background: linear-gradient(135deg, #fff, #fff1f2);
        border: 1px solid #fda4af;
        border-radius: 999px;
        padding: 10px 16px;
        box-shadow: 0 14px 30px -24px rgba(225, 29, 72, 0.9);
      }
      .contact-icon-letter {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        color: white;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 800;
        text-transform: uppercase;
        flex-shrink: 0;
      }
      .contact-copy {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.15;
      }
      .contact-title {
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #be123c;
      }
      .contact-value {
        font-size: 14px;
        font-weight: bold;
        color: #0f172a;
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
        vertical-align: top;
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
      .notes-block {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed #555;
        font-size: 14px;
      }
      .notes-title {
        font-weight: bold;
        margin-bottom: 4px;
      }
      .notes-item {
        margin-top: 3px;
      }
      .continuation-text {
        text-align: right;
        font-style: italic;
        font-size: 13px;
        color: #555;
      }
    </style>
  `;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(exportData.isMerged ? "Đơn hàng gộp" : `Đơn hàng ${exportData.primaryOrderReference}`)}</title>
  ${style}
</head>
<body>
  ${pageHtml}
</body>
</html>
  `;
};
