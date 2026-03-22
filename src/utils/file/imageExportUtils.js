import { formatNumber } from "../formatters/formatUtils";
import {
  estimateWrappedLineCount,
  paginateByBudget,
} from "./orderExportUtils";
import { getExportContacts } from "./exportContactInfo";

/**
 * Loads an image from a source (URL, Base64, Blob) and returns an HTMLImageElement.
 * @param {string} src - The image source.
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Attempt to handle CORS if applicable
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.warn("Failed to load image:", src, err);
      // Thay vì reject, resolve null để quy trình tiếp tục với các ảnh khác
      resolve(null);
    };
    img.src = src;
  });
};

/**
 * Fetches the application logo as a Base64 string or Blob URL.
 * Assumes the logo is at /tiny-shop-transparent.png.
 * @returns {Promise<HTMLImageElement>}
 */
const loadLogo = async () => {
  try {
    return await loadImage("/tiny-shop-transparent.png");
  } catch (error) {
    console.error("Error loading logo:", error);
    return null;
  }
};

/**
 * Generates a PNG image of the product list.
 * @param {Array} items - List of products/items. Each item should have:
 *                        { name, price, image (optional), quantity (optional) }
 * @param {Object} options - Configuration options:
 *                           { showTotal: boolean, title: string }
 * @returns {Promise<Blob>} - The generated image as a Blob.
 */
export const generateProductListImage = async (items, options = {}) => {
  const { showTotal = true, title = "DANH SÁCH SẢN PHẨM" } = options;

  // --- Configuration ---
  const CANVAS_WIDTH = 1125; // 375 * 3
  const PADDING = 40;
  const HEADER_HEIGHT = 400; // Increased Space for Larger Logo + Title (was 250)
  const ITEM_HEIGHT = 300;
  const ITEM_IMAGE_SIZE = 250;
  const ITEM_PADDING = 25;
  const FOOTER_HEIGHT = showTotal ? 150 : 50;
  const FOOTER_PADDING_TOP = 20; // Extra padding before footer starts to avoid overlap

  // Font Sizes
  const FONT_TITLE =
    "bold 50px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_NAME =
    "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_PRICE =
    "bold 45px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"; // Red
  const FONT_META =
    "30px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"; // Gray
  const FONT_TOTAL_LABEL =
    "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_TOTAL_VALUE =
    "bold 60px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  // Colors
  const COLOR_BG = "#ffffff";
  const COLOR_TEXT_PRIMARY = "#1f2937"; // gray-900
  const COLOR_TEXT_PRICE = "#e11d48"; // rose-600
  const COLOR_TEXT_META = "#6b7280"; // gray-500
  const COLOR_DIVIDER = "#e5e7eb"; // gray-200

  // --- Calculate Height ---
  // Ensure totalHeight includes extra buffer before footer
  const totalHeight =
    HEADER_HEIGHT +
    items.length * ITEM_HEIGHT +
    FOOTER_HEIGHT +
    FOOTER_PADDING_TOP;

  // --- Create Canvas ---
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");

  // --- Draw Background ---
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);

  // --- Load Resources ---
  const logoImg = await loadLogo();
  // Preload all product images
  const itemImages = await Promise.all(
    items.map((item) =>
      item.image ? loadImage(item.image) : Promise.resolve(null),
    ),
  );

  // --- Draw Header ---
  let currentY = PADDING;

  // Logo (Larger)
  if (logoImg) {
    const logoHeight = 250; // Increased from 120
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    // Ensure logo doesn't exceed canvas width
    const maxLogoWidth = CANVAS_WIDTH - PADDING * 2;
    const finalLogoWidth = Math.min(logoWidth, maxLogoWidth);
    const finalLogoHeight = (finalLogoWidth / logoWidth) * logoHeight;

    const logoX = (CANVAS_WIDTH - finalLogoWidth) / 2;
    ctx.drawImage(logoImg, logoX, currentY, finalLogoWidth, finalLogoHeight);
    currentY += finalLogoHeight + 30; // Increased spacing
  } else {
    currentY += 200; // Placeholder if no logo
  }

  // Title
  ctx.font = FONT_TITLE;
  ctx.fillStyle = COLOR_TEXT_PRICE;
  ctx.textAlign = "center";
  ctx.fillText(title.toUpperCase(), CANVAS_WIDTH / 2, currentY + 40);

  // Draw separator below header
  currentY = HEADER_HEIGHT - 20; // Align separator at bottom of header area
  ctx.strokeStyle = COLOR_TEXT_PRICE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(PADDING, currentY);
  ctx.lineTo(CANVAS_WIDTH - PADDING, currentY);
  ctx.stroke();

  // --- Draw Items ---
  const itemsStartY = HEADER_HEIGHT;

  items.forEach((item, index) => {
    const itemY = itemsStartY + index * ITEM_HEIGHT;
    const img = itemImages[index];

    // 1. Draw Image (Left)
    const imgX = PADDING;
    const imgY = itemY + ITEM_PADDING;

    // Draw image border/placeholder background
    ctx.fillStyle = "#f3f4f6"; // gray-100
    ctx.fillRect(imgX, imgY, ITEM_IMAGE_SIZE, ITEM_IMAGE_SIZE);

    if (img) {
      // Center crop or fit? Let's fit for now to ensure visibility
      // Calculate aspect ratio
      const scale = Math.min(
        ITEM_IMAGE_SIZE / img.width,
        ITEM_IMAGE_SIZE / img.height,
      );
      const w = img.width * scale;
      const h = img.height * scale;
      const x = imgX + (ITEM_IMAGE_SIZE - w) / 2;
      const y = imgY + (ITEM_IMAGE_SIZE - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    } else {
      // Draw placeholder icon (simple square or text)
      ctx.fillStyle = "#d1d5db"; // gray-300
      ctx.textAlign = "center";
      ctx.font = "bold 80px sans-serif";
      ctx.fillText(
        "?",
        imgX + ITEM_IMAGE_SIZE / 2,
        imgY + ITEM_IMAGE_SIZE / 2 + 30,
      );
    }

    // 2. Draw Text (Right)
    const textX = PADDING + ITEM_IMAGE_SIZE + 40; // 40px gap
    let textY = itemY + ITEM_PADDING + 50; // Start text a bit down from top of row

    // Name
    ctx.textAlign = "left";
    ctx.font = FONT_NAME;
    ctx.fillStyle = COLOR_TEXT_PRIMARY;

    // Simple text wrapping for Name
    const maxTextWidth = CANVAS_WIDTH - textX - PADDING;
    const words = (item.name || "").split(" ");
    let line = "";
    // let lineCount = 0; // Removed unused variable

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxTextWidth && n > 0) {
        ctx.fillText(line, textX, textY);
        line = words[n] + " ";
        textY += 50; // Line height
        // lineCount++;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, textX, textY);
    textY += 60; // Spacing after name

    // Price
    const price = Number(item.price || item.sellingPrice || 0);
    ctx.font = FONT_PRICE;
    ctx.fillStyle = COLOR_TEXT_PRICE;
    ctx.fillText(`${formatNumber(price)}đ`, textX, textY);

    // Quantity (optional - mainly for Order context)
    // If it's an order item (has quantity), show it.
    if (item.quantity) {
      textY += 50;
      ctx.font = FONT_META;
      ctx.fillStyle = COLOR_TEXT_META;
      ctx.fillText(`Số lượng: ${item.quantity}`, textX, textY);
    }

    // Separator line (except for last item)
    if (index < items.length - 1) {
      const lineY = itemY + ITEM_HEIGHT;
      ctx.strokeStyle = COLOR_DIVIDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PADDING, lineY);
      ctx.lineTo(CANVAS_WIDTH - PADDING, lineY);
      ctx.stroke();
    }
  });

  // --- Draw Footer ---
  if (showTotal) {
    // Ensure footer starts AFTER the last item fully ends + padding
    // itemsStartY + (items.length * ITEM_HEIGHT) is the Y coordinate where the next item *would* start.
    // The previous item ends at that coordinate.
    const lastItemEndY = itemsStartY + items.length * ITEM_HEIGHT;
    const footerStartY = lastItemEndY + FOOTER_PADDING_TOP;

    // Draw dashed separator
    // Ensure it doesn't overlap with the image of the last item.
    // ITEM_HEIGHT (300) should cover the image (250) + padding (25 top + 25 bottom).
    // So lastItemEndY is safe.

    const lineY = footerStartY;
    ctx.setLineDash([15, 10]);
    ctx.strokeStyle = COLOR_TEXT_PRICE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(PADDING, lineY);
    ctx.lineTo(CANVAS_WIDTH - PADDING, lineY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Total Label
    const textY = footerStartY + 60 + 20; // 20px padding from line

    ctx.textAlign = "left";
    ctx.font = FONT_TOTAL_LABEL;
    ctx.fillStyle = COLOR_TEXT_PRIMARY;
    ctx.fillText("TỔNG CỘNG:", PADDING, textY);

    // Total Value
    const total = items.reduce((sum, item) => {
      const p = Number(item.price || item.sellingPrice || 0);
      const q = Number(item.quantity || 1); // Default to 1 if not present (Custom List mode)
      return sum + p * q;
    }, 0);

    ctx.textAlign = "right";
    ctx.font = FONT_TOTAL_VALUE;
    ctx.fillStyle = COLOR_TEXT_PRICE;
    ctx.fillText(`${formatNumber(total)}đ`, CANVAS_WIDTH - PADDING, textY);
  }

  // --- Return Blob ---
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
};

const wrapCanvasText = (ctx, text, maxWidth) => {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) return [""];

  const words = normalizedText.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [normalizedText];
};

const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const lines = wrapCanvasText(ctx, text, maxWidth);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
};

const estimateContactStripHeight = (isSmall = false) => {
  if (getExportContacts().length === 0) return 0;
  return isSmall ? 60 : 80;
};

const drawContactStrip = async (ctx, startY, canvasWidth, isSmall = false) => {
  const contacts = getExportContacts();
  if (!contacts.length) return startY;

  const gap = isSmall ? 32 : 48; // Space between contact items
  const iconSize = isSmall ? 32 : 48; // Size of the SVG icon
  const itemHeight = isSmall ? 40 : 56; // Total height of the contact row
  const titleFontSize = isSmall ? 14 : 18;
  const valueFontSize = isSmall ? 20 : 24;
  const iconTextGap = isSmall ? 8 : 12;

  // Map to load icons and measure text widths
  const items = await Promise.all(
    contacts.map(async (contact) => {
      const title = contact.title.toUpperCase();
      const value = contact.value;

      // Prepare SVG strings based on contact key
      let svgStr = "";
      if (contact.key === "facebook") {
        svgStr = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 26.9859 6.58661 34.4257 15.1875 35.7812V23.1875H10.6172V18H15.1875V14.0456C15.1875 9.53039 17.8776 6.91406 22.0223 6.91406C23.9912 6.91406 26.0508 7.26563 26.0508 7.26563V11.693H23.7824C21.5492 11.693 20.8125 13.0788 20.8125 14.5002V18H25.8398L25.0361 23.1875H20.8125V35.7812C29.4134 34.4257 36 26.9859 36 18Z" fill="#1877F2"/></svg>`;
      } else {
        svgStr = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M22.782 0.166016H27.199C33.2653 0.166016 36.8103 1.05701 39.9572 2.74421C43.1041 4.4314 45.5875 6.89585 47.2557 10.0428C48.9429 13.1897 49.8339 16.7347 49.8339 22.801V27.1991C49.8339 33.2654 48.9429 36.8104 47.2557 39.9573C45.5685 43.1042 43.1041 45.5877 39.9572 47.2559C36.8103 48.9431 33.2653 49.8341 27.199 49.8341H22.8009C16.7346 49.8341 13.1896 48.9431 10.0427 47.2559C6.89583 45.5687 4.41243 43.1042 2.7442 39.9573C1.057 36.8104 0.166016 33.2654 0.166016 27.1991V22.801C0.166016 16.7347 1.057 13.1897 2.7442 10.0428C4.43139 6.89585 6.89583 4.41245 10.0427 2.74421C13.1707 1.05701 16.7346 0.166016 22.782 0.166016Z" fill="#0068FF"/>
<path opacity="0.12" fill-rule="evenodd" clip-rule="evenodd" d="M49.8336 26.4736V27.1994C49.8336 33.2657 48.9427 36.8107 47.2555 39.9576C45.5683 43.1045 43.1038 45.5879 39.9569 47.2562C36.81 48.9434 33.265 49.8344 27.1987 49.8344H22.8007C17.8369 49.8344 14.5612 49.2378 11.8104 48.0966L7.27539 43.4267L49.8336 26.4736Z" fill="#001A33"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.779 43.5892C10.1019 43.846 13.0061 43.1836 15.0682 42.1825C24.0225 47.1318 38.0197 46.8954 46.4923 41.4732C46.8209 40.9803 47.1279 40.4677 47.4128 39.9363C49.1062 36.7779 50.0004 33.22 50.0004 27.1316V22.7175C50.0004 16.629 49.1062 13.0711 47.4128 9.91273C45.7385 6.75436 43.2461 4.28093 40.0877 2.58758C36.9293 0.894239 33.3714 0 27.283 0H22.8499C17.6644 0 14.2982 0.652754 11.4699 1.89893C11.3153 2.03737 11.1636 2.17818 11.0151 2.32135C2.71734 10.3203 2.08658 27.6593 9.12279 37.0782C9.13064 37.0921 9.13933 37.1061 9.14889 37.1203C10.2334 38.7185 9.18694 41.5154 7.55068 43.1516C7.28431 43.399 7.37944 43.5512 7.779 43.5892Z" fill="white"/>
<path d="M20.5632 17H10.8382V19.0853H17.5869L10.9329 27.3317C10.7244 27.635 10.5728 27.9194 10.5728 28.5639V29.0947H19.748C20.203 29.0947 20.5822 28.7156 20.5822 28.2606V27.1421H13.4922L19.748 19.2938C19.8428 19.1801 20.0134 18.9716 20.0893 18.8768L20.1272 18.8199C20.4874 18.2891 20.5632 17.8341 20.5632 17.2844V17Z" fill="#0068FF"/>
<path d="M32.9416 29.0947H34.3255V17H32.2402V28.3933C32.2402 28.7725 32.5435 29.0947 32.9416 29.0947Z" fill="#0068FF"/>
<path d="M25.814 19.6924C23.1979 19.6924 21.0747 21.8156 21.0747 24.4317C21.0747 27.0478 23.1979 29.171 25.814 29.171C28.4301 29.171 30.5533 27.0478 30.5533 24.4317C30.5723 21.8156 28.4491 19.6924 25.814 19.6924ZM25.814 27.2184C24.2785 27.2184 23.0273 25.9672 23.0273 24.4317C23.0273 22.8962 24.2785 21.645 25.814 21.645C27.3495 21.645 28.6007 22.8962 28.6007 24.4317C28.6007 25.9672 27.3685 27.2184 25.814 27.2184Z" fill="#0068FF"/>
<path d="M40.4867 19.6162C37.8516 19.6162 35.7095 21.7584 35.7095 24.3934C35.7095 27.0285 37.8516 29.1707 40.4867 29.1707C43.1217 29.1707 45.2639 27.0285 45.2639 24.3934C45.2639 21.7584 43.1217 19.6162 40.4867 19.6162ZM40.4867 27.2181C38.9322 27.2181 37.681 25.9669 37.681 24.4124C37.681 22.8579 38.9322 21.6067 40.4867 21.6067C42.0412 21.6067 43.2924 22.8579 43.2924 24.4124C43.2924 25.9669 42.0412 27.2181 40.4867 27.2181Z" fill="#0068FF"/>
<path d="M29.4562 29.0944H30.5747V19.957H28.6221V28.2793C28.6221 28.7153 29.0012 29.0944 29.4562 29.0944Z" fill="#0068FF"/>
</svg>`;
      }

      // Convert SVG string to base64
      const svgBase64 = `data:image/svg+xml;base64,${btoa(svgStr)}`;
      const iconImg = await loadImage(svgBase64);

      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
      const titleWidth = ctx.measureText(title).width;
      ctx.font = `bold ${valueFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
      const valueWidth = ctx.measureText(value).width;

      // Total width for this item
      const width = iconSize + iconTextGap + Math.max(titleWidth, valueWidth);

      return { ...contact, width, iconImg };
    })
  );

  const totalWidth =
    items.reduce((sum, item) => sum + item.width, 0) + gap * (items.length - 1);
  let currentX = Math.max(40, (canvasWidth - totalWidth) / 2);

  items.forEach((item) => {
    // Draw icon
    if (item.iconImg) {
      ctx.drawImage(item.iconImg, currentX, startY + (itemHeight - iconSize) / 2, iconSize, iconSize);
    }

    const textX = currentX + iconSize + iconTextGap;

    // Draw Title
    ctx.textAlign = "left";
    ctx.fillStyle = "#be123c"; // rose-700
    ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
    ctx.fillText(item.title.toUpperCase(), textX, startY + (isSmall ? 16 : 22));

    // Draw Value
    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.font = `bold ${valueFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
    ctx.fillText(item.value, textX, startY + (isSmall ? 38 : 50));

    currentX += item.width + gap;
  });

  return startY + itemHeight + (isSmall ? 10 : 20);
};

const getOrderImageMetaColumns = (exportData, pageIndex, totalPages) => {
  const leftCol = [
    `${exportData.partyLabel}: ${exportData.partyValue}`,
  ];
  if (exportData.orderType === "delivery" && exportData.customerAddress) {
    leftCol.push(`Địa chỉ: ${exportData.customerAddress}`);
  }

  const rightCol = [
    `Mã đơn: ${exportData.orderReferencesText}`,
    `Ngày xuất: ${exportData.exportedAtDisplay}`,
    `Trang: ${pageIndex + 1}/${totalPages}`
  ];

  const notes = [];
  if (exportData.sharedComment) {
    notes.push(`Ghi chú: ${exportData.sharedComment}`);
  } else if (exportData.noteEntries?.length) {
    notes.push("Ghi chú đơn:");
    exportData.noteEntries.forEach((entry) => {
      notes.push(`${entry.orderReference}: ${entry.comment}`);
    });
  }

  return { leftCol, rightCol, notes };
};

const estimateOrderImageHeaderHeight = (exportData) => {
  const { leftCol, rightCol, notes } = getOrderImageMetaColumns(exportData, 0, 1);

  // Calculate max lines for the two columns
  let colLines = 0;
  const maxRows = Math.max(leftCol.length, rightCol.length);
  for (let i = 0; i < maxRows; i++) {
    const leftLines = leftCol[i] ? estimateWrappedLineCount(leftCol[i], 18) : 0;
    const rightLines = rightCol[i] ? estimateWrappedLineCount(rightCol[i], 18) : 0;
    colLines += Math.max(leftLines, rightLines);
  }

  const notesLines = notes.reduce((total, row) => total + estimateWrappedLineCount(row, 38), 0);

  // Base height + Columns height + Notes height + Contact Strip height + Buffer
  return 220 + colLines * 30 + notesLines * 30 + estimateContactStripHeight(true) + 30;
};

const getOrderImageItemHeight = (item) => {
  const extraNameLines = Math.max(
    0,
    estimateWrappedLineCount(item.name, 16) - 1,
  );
  return 220 + extraNameLines * 36;
};

const preloadOrderImages = async (items) => {
  const imagePairs = await Promise.all(
    items.map(async (item) => [
      item.key,
      item.image ? await loadImage(item.image) : null,
    ]),
  );

  return new Map(imagePairs);
};

const renderOrderImagePage = async ({
  exportData,
  pageItems,
  pageIndex,
  totalPages,
  logoImg,
  itemImageMap,
}) => {
  const CANVAS_WIDTH = 1125;
  const PADDING = 40;
  const HEADER_HEIGHT = estimateOrderImageHeaderHeight(exportData);
  const ITEM_IMAGE_SIZE = 180;
  const ITEM_PADDING = 20;
  const CONTINUATION_FOOTER_HEIGHT = 80;
  const FINAL_FOOTER_HEIGHT = 140;
  const footerHeight =
    pageIndex === totalPages - 1
      ? FINAL_FOOTER_HEIGHT
      : CONTINUATION_FOOTER_HEIGHT;

  const totalItemsHeight = pageItems.reduce(
    (sum, item) => sum + getOrderImageItemHeight(item),
    0,
  );

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = HEADER_HEIGHT + totalItemsHeight + footerHeight;
  const ctx = canvas.getContext("2d");

  const COLOR_BG = "#ffffff";
  const COLOR_TEXT_PRIMARY = "#1f2937";
  const COLOR_TEXT_PRICE = "#e11d48";
  const COLOR_TEXT_META = "#6b7280";
  const COLOR_DIVIDER = "#e5e7eb";

  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let currentY = PADDING;

  if (logoImg) {
    const logoHeight = 120;
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    const maxLogoWidth = CANVAS_WIDTH - PADDING * 2;
    const finalLogoWidth = Math.min(logoWidth, maxLogoWidth);
    const finalLogoHeight = (finalLogoWidth / logoWidth) * logoHeight;
    const logoX = (CANVAS_WIDTH - finalLogoWidth) / 2;
    ctx.drawImage(logoImg, logoX, currentY, finalLogoWidth, finalLogoHeight);
    currentY += finalLogoHeight + 16;
  } else {
    currentY += 60;
  }

  ctx.textAlign = "center";
  ctx.font =
    "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  ctx.fillStyle = COLOR_TEXT_PRICE;
  ctx.fillText(
    exportData.isMerged ? "ĐƠN HÀNG GỘP" : "ĐƠN HÀNG",
    CANVAS_WIDTH / 2,
    currentY + 34,
  );
  currentY += 56;

  ctx.textAlign = "left";
  ctx.fillStyle = COLOR_TEXT_PRIMARY;
  ctx.font =
    "24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const { leftCol, rightCol, notes } = getOrderImageMetaColumns(exportData, pageIndex, totalPages);

  const midPointX = CANVAS_WIDTH / 2;
  const colMaxWidth = (CANVAS_WIDTH - PADDING * 2) / 2 - 20;

  const maxRows = Math.max(leftCol.length, rightCol.length);
  for (let i = 0; i < maxRows; i++) {
    let nextLeftY = currentY;
    let nextRightY = currentY;

    if (leftCol[i]) {
      nextLeftY = drawWrappedText(ctx, leftCol[i], PADDING, currentY, colMaxWidth, 30);
    }

    if (rightCol[i]) {
      nextRightY = drawWrappedText(ctx, rightCol[i], midPointX + 10, currentY, colMaxWidth, 30);
    }

    currentY = Math.max(nextLeftY, nextRightY) + 8; // Row gap
  }

  notes.forEach((note) => {
    currentY = drawWrappedText(ctx, note, PADDING, currentY, CANVAS_WIDTH - PADDING * 2, 30);
    currentY += 8;
  });

  currentY += 12; // Gap before contact strip

  currentY = await drawContactStrip(ctx, currentY, CANVAS_WIDTH, true); // Use small variant

  ctx.strokeStyle = COLOR_TEXT_PRICE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(PADDING, currentY);
  ctx.lineTo(CANVAS_WIDTH - PADDING, currentY);
  ctx.stroke();
  currentY += 24;

  pageItems.forEach((item, index) => {
    const itemHeight = getOrderImageItemHeight(item);
    const itemY = currentY;
    const image = itemImageMap.get(item.key);
    const imageX = PADDING;
    const imageY = itemY + ITEM_PADDING;

    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(imageX, imageY, ITEM_IMAGE_SIZE, ITEM_IMAGE_SIZE);

    if (image) {
      const scale = Math.min(
        ITEM_IMAGE_SIZE / image.width,
        ITEM_IMAGE_SIZE / image.height,
      );
      const width = image.width * scale;
      const height = image.height * scale;
      const x = imageX + (ITEM_IMAGE_SIZE - width) / 2;
      const y = imageY + (ITEM_IMAGE_SIZE - height) / 2;
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.fillStyle = "#d1d5db";
      ctx.textAlign = "center";
      ctx.font = "bold 80px sans-serif";
      ctx.fillText(
        "?",
        imageX + ITEM_IMAGE_SIZE / 2,
        imageY + ITEM_IMAGE_SIZE / 2 + 30,
      );
    }

    const textX = PADDING + ITEM_IMAGE_SIZE + 40;
    const maxTextWidth = CANVAS_WIDTH - textX - PADDING;
    let textY = itemY + ITEM_PADDING + 34;

    ctx.textAlign = "left";
    ctx.font =
      "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ctx.fillStyle = COLOR_TEXT_PRIMARY;
    textY = drawWrappedText(ctx, item.name, textX, textY, maxTextWidth, 38) + 8;

    ctx.font =
      "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ctx.fillStyle = COLOR_TEXT_PRICE;
    ctx.fillText(`${formatNumber(item.price)}đ`, textX, textY);
    textY += 42;

    ctx.font =
      "26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ctx.fillStyle = COLOR_TEXT_META;
    ctx.fillText(`Số lượng: ${item.quantity}`, textX, textY);
    textY += 34;
    ctx.fillText(`Thành tiền: ${formatNumber(item.total)}đ`, textX, textY);

    if (index < pageItems.length - 1) {
      const dividerY = itemY + itemHeight;
      ctx.strokeStyle = COLOR_DIVIDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PADDING, dividerY);
      ctx.lineTo(CANVAS_WIDTH - PADDING, dividerY);
      ctx.stroke();
    }

    currentY += itemHeight;
  });

  const footerStartY = canvas.height - footerHeight;
  ctx.setLineDash([15, 10]);
  ctx.strokeStyle = COLOR_TEXT_PRICE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PADDING, footerStartY);
  ctx.lineTo(CANVAS_WIDTH - PADDING, footerStartY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (pageIndex === totalPages - 1) {
    const textY = footerStartY + 56;
    ctx.textAlign = "left";
    ctx.font =
      "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ctx.fillStyle = COLOR_TEXT_PRIMARY;
    ctx.fillText(`TỔNG SL: ${exportData.totalQuantity} sp`, PADDING, textY);

    ctx.textAlign = "right";
    ctx.font =
      "bold 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ctx.fillStyle = COLOR_TEXT_PRICE;
    ctx.fillText(
      `${formatNumber(exportData.totalAmount)}đ`,
      CANVAS_WIDTH - PADDING,
      textY + 10,
    );
  } else {
    ctx.textAlign = "center";
    ctx.font =
      "28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ctx.fillStyle = COLOR_TEXT_META;
    ctx.fillText("Tiếp trang sau", CANVAS_WIDTH / 2, footerStartY + 50);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
};

export const generateOrderImages = async (exportData) => {
  if (!exportData) return [];

  const MAX_CANVAS_HEIGHT = 1950;
  const headerHeight = estimateOrderImageHeaderHeight(exportData);
  const availableItemsBudget = Math.max(320, MAX_CANVAS_HEIGHT - headerHeight - 200);
  const pages = paginateByBudget(
    exportData.items,
    getOrderImageItemHeight,
    availableItemsBudget,
  );
  const pageItemsList = pages.length > 0 ? pages : [[]];
  const logoImg = await loadLogo();
  const itemImageMap = await preloadOrderImages(exportData.items);

  return Promise.all(
    pageItemsList.map((pageItems, pageIndex) =>
      renderOrderImagePage({
        exportData,
        pageItems,
        pageIndex,
        totalPages: pageItemsList.length,
        logoImg,
        itemImageMap,
      }),
    ),
  );
};
