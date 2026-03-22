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

  const notesHtml = exportData.noteEntries
    .map(
      (entry) =>
        tone === "a4"
          ? `<div class="notes-item"><strong>${escapeHtml(entry.orderReference)}:</strong> ${escapeHtml(entry.comment)}</div>`
          : `<div style="margin-top:4px;"><strong>${escapeHtml(entry.orderReference)}:</strong> ${escapeHtml(entry.comment)}</div>`,
    )
    .join("");

  return tone === "a4"
    ? `<div class="notes-block"><div class="notes-title">Ghi chú đơn</div>${notesHtml}</div>`
    : `<div style="${wrapperClass}"><div style="font-weight:600; color:#9f1239;">Ghi chú đơn</div>${notesHtml}</div>`;
};

const getContactIconMarkup = (contact) => {
  if (contact.key === "facebook") {
    return `<svg class="contact-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 26.9859 6.58661 34.4257 15.1875 35.7812V23.1875H10.6172V18H15.1875V14.0456C15.1875 9.53039 17.8776 6.91406 22.0223 6.91406C23.9912 6.91406 26.0508 7.26563 26.0508 7.26563V11.693H23.7824C21.5492 11.693 20.8125 13.0788 20.8125 14.5002V18H25.8398L25.0361 23.1875H20.8125V35.7812C29.4134 34.4257 36 26.9859 36 18Z" fill="#1877F2"/></svg>`;
  }

  return `<svg class="contact-icon" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M22.782 0.166016H27.199C33.2653 0.166016 36.8103 1.05701 39.9572 2.74421C43.1041 4.4314 45.5875 6.89585 47.2557 10.0428C48.9429 13.1897 49.8339 16.7347 49.8339 22.801V27.1991C49.8339 33.2654 48.9429 36.8104 47.2557 39.9573C45.5685 43.1042 43.1041 45.5877 39.9572 47.2559C36.8103 48.9431 33.2653 49.8341 27.199 49.8341H22.8009C16.7346 49.8341 13.1896 48.9431 10.0427 47.2559C6.89583 45.5687 4.41243 43.1042 2.7442 39.9573C1.057 36.8104 0.166016 33.2654 0.166016 27.1991V22.801C0.166016 16.7347 1.057 13.1897 2.7442 10.0428C4.43139 6.89585 6.89583 4.41245 10.0427 2.74421C13.1707 1.05701 16.7346 0.166016 22.782 0.166016Z" fill="#0068FF"/>
<path opacity="0.12" fill-rule="evenodd" clip-rule="evenodd" d="M49.8336 26.4736V27.1994C49.8336 33.2657 48.9427 36.8107 47.2555 39.9576C45.5683 43.1045 43.1038 45.5879 39.9569 47.2562C36.81 48.9434 33.265 49.8344 27.1987 49.8344H22.8007C17.8369 49.8344 14.5612 49.2378 11.8104 48.0966L7.27539 43.4267L49.8336 26.4736Z" fill="#001A33"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.779 43.5892C10.1019 43.846 13.0061 43.1836 15.0682 42.1825C24.0225 47.1318 38.0197 46.8954 46.4923 41.4732C46.8209 40.9803 47.1279 40.4677 47.4128 39.9363C49.1062 36.7779 50.0004 33.22 50.0004 27.1316V22.7175C50.0004 16.629 49.1062 13.0711 47.4128 9.91273C45.7385 6.75436 43.2461 4.28093 40.0877 2.58758C36.9293 0.894239 33.3714 0 27.283 0H22.8499C17.6644 0 14.2982 0.652754 11.4699 1.89893C11.3153 2.03737 11.1636 2.17818 11.0151 2.32135C2.71734 10.3203 2.08658 27.6593 9.12279 37.0782C9.13064 37.0921 9.13933 37.1061 9.14889 37.1203C10.2334 38.7185 9.18694 41.5154 7.55068 43.1516C7.28431 43.399 7.37944 43.5512 7.779 43.5892Z" fill="white"/>
<path d="M20.5632 17H10.8382V19.0853H17.5869L10.9329 27.3317C10.7244 27.635 10.5728 27.9194 10.5728 28.5639V29.0947H19.748C20.203 29.0947 20.5822 28.7156 20.5822 28.2606V27.1421H13.4922L19.748 19.2938C19.8428 19.1801 20.0134 18.9716 20.0893 18.8768L20.1272 18.8199C20.4874 18.2891 20.5632 17.8341 20.5632 17.2844V17Z" fill="#0068FF"/>
<path d="M32.9416 29.0947H34.3255V17H32.2402V28.3933C32.2402 28.7725 32.5435 29.0947 32.9416 29.0947Z" fill="#0068FF"/>
<path d="M25.814 19.6924C23.1979 19.6924 21.0747 21.8156 21.0747 24.4317C21.0747 27.0478 23.1979 29.171 25.814 29.171C28.4301 29.171 30.5533 27.0478 30.5533 24.4317C30.5723 21.8156 28.4491 19.6924 25.814 19.6924ZM25.814 27.2184C24.2785 27.2184 23.0273 25.9672 23.0273 24.4317C23.0273 22.8962 24.2785 21.645 25.814 21.645C27.3495 21.645 28.6007 22.8962 28.6007 24.4317C28.6007 25.9672 27.3685 27.2184 25.814 27.2184Z" fill="#0068FF"/>
<path d="M40.4867 19.6162C37.8516 19.6162 35.7095 21.7584 35.7095 24.3934C35.7095 27.0285 37.8516 29.1707 40.4867 29.1707C43.1217 29.1707 45.2639 27.0285 45.2639 24.3934C45.2639 21.7584 43.1217 19.6162 40.4867 19.6162ZM40.4867 27.2181C38.9322 27.2181 37.681 25.9669 37.681 24.4124C37.681 22.8579 38.9322 21.6067 40.4867 21.6067C42.0412 21.6067 43.2924 22.8579 43.2924 24.4124C43.2924 25.9669 42.0412 27.2181 40.4867 27.2181Z" fill="#0068FF"/>
<path d="M29.4562 29.0944H30.5747V19.957H28.6221V28.2793C28.6221 28.7153 29.0012 29.0944 29.4562 29.0944Z" fill="#0068FF"/>
</svg>`;
};

const renderContactStripHTML = (isA4 = false) => {
  const contacts = getExportContacts();
  if (!contacts.length) return "";

  const stripClass = isA4 ? "contact-strip a4-contact" : "contact-strip";
  const itemClass = isA4 ? "contact-item a4-contact-item" : "contact-item";

  const contactsHtml = contacts
    .map(
      (contact) => `
        <a
          class="${itemClass}"
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
      `,
    )
    .join("");

  return `<div class="${stripClass}">${contactsHtml}</div>`;
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
  const leftCol = [];
  const rightCol = [];

  leftCol.push(`<strong>${escapeHtml(exportData.partyLabel)}:</strong> ${escapeHtml(exportData.partyValue)}`);

  if (exportData.orderType === "delivery" && exportData.customerAddress) {
    leftCol.push(`<strong>Địa chỉ:</strong> ${escapeHtml(exportData.customerAddress)}`);
  }

  rightCol.push(`<strong>Mã đơn:</strong> ${escapeHtml(exportData.orderReferencesText)}`);
  rightCol.push(`<strong>Ngày xuất:</strong> ${escapeHtml(exportData.exportedAtDisplay)}`);

  // Ghép leftCol và rightCol thành hàng
  const maxRows = Math.max(leftCol.length, rightCol.length);
  const rowsHtml = Array.from({ length: maxRows }).map((_, i) => `
    <tr>
      <td style="border: none; padding: 2px; width: 50%;">${leftCol[i] || ""}</td>
      <td style="border: none; padding: 2px; width: 50%;">${rightCol[i] || ""}</td>
    </tr>
  `).join("");

  return `
    <table style="width: 100%; border: none; font-size: 14px; margin-bottom: 8px;">
      ${rowsHtml}
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

  const itemsRows = exportData.items
    .map(
      (item, index) => `
      <tr>
        <td style="width: 5%; color: #999;">${index + 1}</td>
        <td>
          <div style="font-weight: 500;">${escapeHtml(item.name)}</div>
        </td>
        <td class="right" style="width: 20%;">${formatNumber(item.price)}đ</td>
        <td class="center" style="width: 10%;">${item.quantity}</td>
        <td class="right" style="width: 25%; font-weight: 500;">${formatNumber(item.total)}đ</td>
      </tr>
    `,
    )
    .join("");

  const style = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #e11d48; padding-bottom: 15px; }
      .shop-name { font-size: 24px; font-weight: bold; color: #e11d48; margin: 0; }
      .meta { font-size: 14px; color: #666; margin-top: 5px; }
      .customer-info { margin-bottom: 20px; font-size: 14px; background: #fff1f2; padding: 10px; border-radius: 8px; }
      .contact-strip { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin: 16px 0 18px; }
      .contact-item { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #1f2937; padding: 4px 8px; }
      .contact-icon { width: 32px; height: 32px; flex-shrink: 0; }
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

  const pageHtml = pages
    .map((pageItems, pageIndex) => {
      const isLastPage = pageIndex === pages.length - 1;
      const rowsHtml = pageItems
        .map((item) => {
          runningIndex += 1;
          return `
            <tr>
              <td class="text-center" style="width: 5%;">${runningIndex}</td>
              <td class="text-center" style="width: 15%;">${escapeHtml(item.barcode || "-")}</td>
              <td>${escapeHtml(item.name)}</td>
              <td class="text-right" style="width: 15%;">${formatNumber(item.price)}</td>
              <td class="text-center" style="width: 10%;">${item.quantity}</td>
              <td class="text-right" style="width: 20%;">${formatNumber(item.total)}</td>
            </tr>
          `;
        })
        .join("");

      return `
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

          <div class="customer-section">
            ${renderA4CustomerTable(exportData)}
            ${renderOrderNotesHTML(exportData, "a4")}
          </div>

          ${renderContactStripHTML(true)}

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
    })
    .join("");

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
        gap: 32px;
        margin: -5px 0 18px;
      }
      .contact-item {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: #111827;
        padding: 6px 12px;
      }
      .a4-contact {
        justify-content: flex-start;
        margin: -5px 0 12px 0;
        gap: 20px;
      }
      .a4-contact-item {
        gap: 6px;
        padding: 2px 6px;
      }
      .contact-icon {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }
      .a4-contact-item .contact-icon {
        width: 24px;
        height: 24px;
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
      .a4-contact-item .contact-title {
        font-size: 9px;
      }
      .contact-value {
        font-size: 14px;
        font-weight: bold;
        color: #0f172a;
      }
      .a4-contact-item .contact-value {
        font-size: 12px;
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
