export const paginateByHeight = (
  items,
  getItemHeight,
  maxPageHeight,
) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const safeMaxHeight = Math.max(1, Number(maxPageHeight) || 1);
  const pages = [];
  let currentPage = [];
  let currentHeight = 0;

  for (const item of items) {
    const itemHeight = Math.max(0, Number(getItemHeight(item)) || 0);
    if (
      currentPage.length > 0 &&
      currentHeight + itemHeight > safeMaxHeight
    ) {
      pages.push(currentPage);
      currentPage = [];
      currentHeight = 0;
    }

    currentPage.push(item);
    currentHeight += itemHeight;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

export const createPdfFromPageImages = async (pageImages) => {
  if (!Array.isArray(pageImages) || pageImages.length === 0) {
    throw new Error("Không có trang để tạo PDF.");
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  pageImages.forEach((pageImage, index) => {
    if (index > 0) {
      pdf.addPage("a4", "portrait");
    }
    pdf.addImage(pageImage, "PNG", 0, 0, 210, 297, undefined, "FAST");
  });

  return pdf.output("blob");
};

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PAGE_MARGIN = 70;
const HEADER_HEIGHT = 220;
const CONTENT_TOP = PAGE_MARGIN + HEADER_HEIGHT;
const CONTENT_BOTTOM = 70;
const CARD_PADDING = 28;
const CARD_GAP = 28;
const PRODUCT_IMAGE_SIZE = 220;
const TEXT_GAP = 34;
const NAME_LINE_HEIGHT = 42;
const INSTRUCTION_LINE_HEIGHT = 38;
const COLOR_ROSE = "#e11d48";
const COLOR_TEXT = "#1f2937";
const COLOR_META = "#6b7280";
const COLOR_BORDER = "#fecdd3";
const COLOR_PLACEHOLDER = "#f3f4f6";
const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DEFAULT_IMAGE_LOAD_TIMEOUT_MS = 8000;

export const loadImage = (source, options = {}) =>
  new Promise((resolve) => {
    const ImageConstructor =
      options.ImageConstructor || globalThis.Image;
    const baseUrl =
      options.baseUrl || globalThis.window?.location?.href;
    if (!source || !ImageConstructor || !baseUrl) {
      resolve(null);
      return;
    }

    let image = null;
    let timeoutId = null;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (image) {
        image.onload = null;
        image.onerror = null;
      }
      resolve(result);
    };

    try {
      const url = new URL(source, baseUrl);
      const pageUrl = new URL(baseUrl);
      if (!["http:", "https:", "data:", "blob:"].includes(url.protocol)) {
        finish(null);
        return;
      }

      image = new ImageConstructor();
      if (
        ["http:", "https:"].includes(url.protocol) &&
        url.origin !== pageUrl.origin
      ) {
        image.crossOrigin = "anonymous";
      }
      image.onload = () => finish(image);
      image.onerror = () => finish(null);
      timeoutId = setTimeout(
        () => finish(null),
        Math.max(
          1,
          Number(options.timeoutMs) || DEFAULT_IMAGE_LOAD_TIMEOUT_MS,
        ),
      );
      image.src = source;
    } catch {
      finish(null);
    }
  });

const wrapCanvasText = (context, text, maxWidth) => {
  const normalized = String(text || "").trim();
  if (!normalized) return [];

  const words = normalized.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (
      currentLine &&
      context.measureText(candidate).width > maxWidth
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

export const convertHtmlToPdfLines = (htmlString) => {
  if (!htmlString || typeof htmlString !== "string") return [];

  let text = htmlString;
  text = text.replace(/<li[^>]*>/gi, "• ");
  text = text.replace(/<\/(li|p|div|tr|h[1-6])>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");

  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const escapeHtml = (text) =>
  String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const parseHtmlToBlocks = (htmlString) => {
  if (!htmlString || typeof htmlString !== "string") return [];
  const trimmed = htmlString.trim();
  if (!trimmed) return [];

  if (typeof document === "undefined" || typeof DOMParser === "undefined") {
    return convertHtmlToPdfLines(trimmed).map((line) => `<p>${escapeHtml(line)}</p>`);
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${trimmed}</div>`, "text/html");
    const container = doc.body.firstElementChild;
    if (!container) return [];

    const blocks = [];
    for (const child of Array.from(container.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.trim();
        if (text) {
          blocks.push(`<p>${escapeHtml(text)}</p>`);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        blocks.push(child.outerHTML);
      }
    }
    return blocks.length > 0 ? blocks : [`<p>${escapeHtml(trimmed)}</p>`];
  } catch {
    return convertHtmlToPdfLines(trimmed).map((line) => `<p>${escapeHtml(line)}</p>`);
  }
};

const CARD_HTML_STYLES = `
.card-wrapper {
  font-family: ${FONT_FAMILY};
  background-color: #ffffff;
  color: #1f2937;
  box-sizing: border-box;
  padding: 0;
  width: 100%;
}
.card-header {
  border-bottom: 2px solid #fecdd3;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.medicine-badge {
  display: inline-block;
  background-color: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
  font-size: 14px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.medicine-title {
  color: #0f172a;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
  letter-spacing: -0.3px;
  word-break: break-word;
}
.hdsd-body {
  font-size: 26px;
  line-height: 1.55;
  color: #1f2937;
  word-break: break-word;
}
.hdsd-body h1, .hdsd-body h2 {
  color: #be123c !important;
  font-size: 28px !important;
  font-weight: 700 !important;
  margin-top: 14px !important;
  margin-bottom: 8px !important;
  padding-left: 10px !important;
  border-left: 4px solid #e11d48 !important;
  line-height: 1.35 !important;
}
.hdsd-body h3, .hdsd-body h4 {
  color: #e11d48 !important;
  font-size: 26px !important;
  font-weight: 700 !important;
  margin-top: 10px !important;
  margin-bottom: 6px !important;
}
.hdsd-body p {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}
.hdsd-body strong, .hdsd-body b {
  font-weight: 700 !important;
  color: #0f172a !important;
}
.hdsd-body em, .hdsd-body i {
  font-style: italic !important;
}
.hdsd-body u {
  text-decoration: underline !important;
  text-underline-offset: 3px !important;
}
.hdsd-body s, .hdsd-body strike, .hdsd-body del {
  text-decoration: line-through !important;
  opacity: 0.75 !important;
}
.hdsd-body ul {
  list-style-type: disc !important;
  padding-left: 28px !important;
  margin-top: 4px !important;
  margin-bottom: 8px !important;
}
.hdsd-body ul ul {
  list-style-type: circle !important;
  padding-left: 24px !important;
}
.hdsd-body ol {
  list-style-type: decimal !important;
  padding-left: 28px !important;
  margin-top: 4px !important;
  margin-bottom: 8px !important;
}
.hdsd-body ol ol {
  list-style-type: lower-alpha !important;
  padding-left: 24px !important;
}
.hdsd-body li {
  margin-bottom: 4px !important;
}
.hdsd-body blockquote {
  border-left: 4px solid #fb7185 !important;
  background-color: #fff1f2 !important;
  padding: 8px 12px !important;
  margin: 8px 0 !important;
  border-radius: 6px !important;
  font-style: italic !important;
  color: #374151 !important;
}
.hdsd-body hr {
  border: none !important;
  border-top: 2px dashed #fecdd3 !important;
  margin: 12px 0 !important;
}
.hdsd-body span[style*="background-color"],
.hdsd-body mark {
  padding: 2px 6px !important;
  border-radius: 4px !important;
  box-decoration-break: clone !important;
  -webkit-box-decoration-break: clone !important;
}
`;

const buildCardTextHtml = (name, usageInstructionsHtml) => {
  const nameHtml = escapeHtml(name);
  const bodyHtml = usageInstructionsHtml || "";
  return `
    <div class="card-wrapper">
      <div class="card-header">
        <div class="badge-row">
          <span class="medicine-badge">TÊN THUỐC / SẢN PHẨM</span>
        </div>
        <h2 class="medicine-title">${nameHtml}</h2>
      </div>
      <div class="hdsd-body">
        ${bodyHtml}
      </div>
    </div>
  `;
};

const createCardLayout = (context, item) => {
  const textWidth =
    PAGE_WIDTH -
    PAGE_MARGIN * 2 -
    CARD_PADDING * 2 -
    PRODUCT_IMAGE_SIZE -
    TEXT_GAP;

  context.font = `700 32px ${FONT_FAMILY}`;
  const nameLines = wrapCanvasText(context, item.name, textWidth);

  const rawInstructionLines = convertHtmlToPdfLines(item.usageInstructions);
  const instructionLines = rawInstructionLines.flatMap((line) =>
    wrapCanvasText(context, line, textWidth),
  );

  const textHeight =
    nameLines.length * NAME_LINE_HEIGHT +
    45 +
    instructionLines.length * INSTRUCTION_LINE_HEIGHT;
  const contentHeight = Math.max(PRODUCT_IMAGE_SIZE, textHeight);

  return {
    ...item,
    imageKey: item.key,
    nameLines,
    instructionLines,
    height: contentHeight + CARD_PADDING * 2,
  };
};

const calculateCardHeight = (nameLines, instructionLines) => {
  const textHeight =
    nameLines.length * NAME_LINE_HEIGHT +
    45 +
    instructionLines.length * INSTRUCTION_LINE_HEIGHT;
  return Math.max(PRODUCT_IMAGE_SIZE, textHeight) + CARD_PADDING * 2;
};

export const fitLayoutsToPageHeight = (
  layouts,
  maxCardHeight,
) => {
  const safeMaxHeight = Math.max(1, Number(maxCardHeight) || 1);
  const fittedLayouts = [];

  for (const layout of layouts || []) {
    if (layout.height <= safeMaxHeight) {
      fittedLayouts.push(layout);
      continue;
    }

    const originalNameLines = [...(layout.nameLines || [])];
    const remainingLines = [...(layout.instructionLines || [])];
    const fullNameFits =
      calculateCardHeight(originalNameLines, []) <= safeMaxHeight;
    let continuationNameLines = originalNameLines;
    let partIndex = 0;

    if (!fullNameFits) {
      const nameLineCapacity = Math.max(
        1,
        Math.floor(
          (safeMaxHeight - CARD_PADDING * 2 - 45) /
            NAME_LINE_HEIGHT,
        ),
      );
      const remainingNameLines = [...originalNameLines];
      while (remainingNameLines.length > 0) {
        const nameLines = remainingNameLines.splice(
          0,
          nameLineCapacity,
        );
        fittedLayouts.push({
          ...layout,
          key: `${layout.key}-part-${partIndex + 1}`,
          imageKey: layout.imageKey || layout.key,
          nameLines,
          instructionLines: [],
          height: calculateCardHeight(nameLines, []),
        });
        partIndex += 1;
      }
      continuationNameLines = originalNameLines.slice(0, 1);
    }

    while (remainingLines.length > 0) {
      const nameLines = continuationNameLines;
      const fixedTextHeight =
        nameLines.length * NAME_LINE_HEIGHT + 45;
      const availableInstructionHeight =
        safeMaxHeight - CARD_PADDING * 2 - fixedTextHeight;
      const lineCapacity = Math.max(
        1,
        Math.floor(availableInstructionHeight / INSTRUCTION_LINE_HEIGHT),
      );
      const instructionLines = remainingLines.splice(0, lineCapacity);

      fittedLayouts.push({
        ...layout,
        key: `${layout.key}-part-${partIndex + 1}`,
        imageKey: layout.imageKey || layout.key,
        nameLines,
        instructionLines,
        height: calculateCardHeight(nameLines, instructionLines),
      });
      partIndex += 1;
    }
  }

  return fittedLayouts;
};

const drawContainedImage = (
  context,
  image,
  x,
  y,
  width,
  height,
) => {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
};

const drawHeader = (context, exportData, logoImage, pageIndex, pageCount) => {
  const top = PAGE_MARGIN;

  if (logoImage) {
    const targetHeight = 105;
    const targetWidth = Math.min(
      390,
      (logoImage.width / logoImage.height) * targetHeight,
    );
    drawContainedImage(
      context,
      logoImage,
      PAGE_MARGIN,
      top,
      targetWidth,
      targetHeight,
    );
  } else {
    context.fillStyle = COLOR_ROSE;
    context.font = `700 38px ${FONT_FAMILY}`;
    context.textAlign = "left";
    context.fillText("TINY SHOP", PAGE_MARGIN, top + 66);
  }

  context.textAlign = "right";
  context.fillStyle = COLOR_ROSE;
  context.font = `700 38px ${FONT_FAMILY}`;
  context.fillText(
    "PHIẾU HƯỚNG DẪN SỬ DỤNG",
    PAGE_WIDTH - PAGE_MARGIN,
    top + 48,
  );

  context.fillStyle = COLOR_META;
  context.font = `400 24px ${FONT_FAMILY}`;
  context.fillText(
    `Ngày xuất: ${exportData.dateDisplay}`,
    PAGE_WIDTH - PAGE_MARGIN,
    top + 88,
  );
  if (pageCount > 1) {
    context.fillText(
      `Trang ${pageIndex + 1}/${pageCount}`,
      PAGE_WIDTH - PAGE_MARGIN,
      top + 124,
    );
  }

  context.strokeStyle = COLOR_ROSE;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(PAGE_MARGIN, CONTENT_TOP - 38);
  context.lineTo(PAGE_WIDTH - PAGE_MARGIN, CONTENT_TOP - 38);
  context.stroke();
};

const drawFallbackProductCardText = (
  context,
  layout,
  textX,
  top,
  textWidth,
) => {
  let textY = top + CARD_PADDING;

  // 1. Draw Badge Tag
  context.fillStyle = "#fff1f2";
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 1;
  const badgeWidth = 220;
  const badgeHeight = 32;
  context.beginPath();
  context.roundRect(textX, textY, badgeWidth, badgeHeight, 16);
  context.fill();
  context.stroke();

  context.fillStyle = "#be123c";
  context.font = `700 18px ${FONT_FAMILY}`;
  context.textAlign = "left";
  context.fillText("TÊN THUỐC / SẢN PHẨM", textX + 14, textY + 22);
  textY += 46;

  // 2. Draw Medicine Title Name
  context.fillStyle = "#0f172a";
  context.font = `800 32px ${FONT_FAMILY}`;
  layout.nameLines.forEach((line) => {
    context.fillText(line, textX, textY);
    textY += NAME_LINE_HEIGHT;
  });
  textY += 10;

  // 3. Draw Divider Line
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(textX, textY);
  context.lineTo(textX + textWidth, textY);
  context.stroke();
  textY += 28;

  // 4. Draw HDSD Instruction Lines
  context.font = `400 27px ${FONT_FAMILY}`;
  layout.instructionLines.forEach((line) => {
    let currentLine = line;
    let isHeading = false;
    let isBold = false;
    let textColor = COLOR_TEXT;

    if (/^<h[1-2]/i.test(currentLine) || /^(\d+\.|I+\.|[A-Z]\.)\s+/i.test(currentLine)) {
      isHeading = true;
      textColor = "#be123c";
    } else if (/^<h[3-6]/i.test(currentLine)) {
      isHeading = true;
      textColor = COLOR_ROSE;
    }

    if (/<strong>|<b>/i.test(currentLine)) {
      isBold = true;
    }

    currentLine = currentLine.replace(/<[^>]+>/g, "");

    context.fillStyle = textColor;
    if (isHeading) {
      context.font = `700 28px ${FONT_FAMILY}`;
      // Left accent bar for heading
      context.fillStyle = COLOR_ROSE;
      context.fillRect(textX, textY - 22, 5, 26);
      context.fillStyle = textColor;
      context.fillText(currentLine, textX + 14, textY);
    } else if (isBold) {
      context.font = `700 27px ${FONT_FAMILY}`;
      context.fillText(currentLine, textX, textY);
    } else {
      context.font = `400 27px ${FONT_FAMILY}`;
      context.fillText(currentLine, textX, textY);
    }

    textY += INSTRUCTION_LINE_HEIGHT;
  });
};

const drawProductCardContent = async (
  context,
  layout,
  productImage,
  top,
) => {
  const cardWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  const imageX = PAGE_MARGIN + CARD_PADDING;
  const imageY = top + CARD_PADDING;
  const textX = imageX + PRODUCT_IMAGE_SIZE + TEXT_GAP;
  const textWidth = cardWidth - CARD_PADDING * 2 - PRODUCT_IMAGE_SIZE - TEXT_GAP;
  const textHeight = layout.height - CARD_PADDING * 2;

  // Card container
  context.fillStyle = "#ffffff";
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 2;
  context.fillRect(PAGE_MARGIN, top, cardWidth, layout.height);
  context.strokeRect(PAGE_MARGIN, top, cardWidth, layout.height);

  // Product Image
  context.fillStyle = COLOR_PLACEHOLDER;
  context.fillRect(
    imageX,
    imageY,
    PRODUCT_IMAGE_SIZE,
    PRODUCT_IMAGE_SIZE,
  );
  if (productImage) {
    drawContainedImage(
      context,
      productImage,
      imageX,
      imageY,
      PRODUCT_IMAGE_SIZE,
      PRODUCT_IMAGE_SIZE,
    );
  } else {
    context.fillStyle = COLOR_META;
    context.font = `600 22px ${FONT_FAMILY}`;
    context.textAlign = "center";
    context.fillText(
      "Không có ảnh",
      imageX + PRODUCT_IMAGE_SIZE / 2,
      imageY + PRODUCT_IMAGE_SIZE / 2,
    );
  }

  // Render Card Text using SVG foreignObject when Image Constructor is available
  let renderedSvg = false;
  if (typeof globalThis.Image !== "undefined" && typeof globalThis.Blob !== "undefined" && typeof globalThis.URL !== "undefined") {
    try {
      const fullHtml = buildCardTextHtml(layout.name, layout.usageInstructions);
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${textWidth}" height="${textHeight}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <style>${CARD_HTML_STYLES}</style>
            ${fullHtml}
          </div>
        </foreignObject>
      </svg>`;

      const blob = new globalThis.Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = globalThis.URL.createObjectURL(blob);
      const img = new globalThis.Image();

      renderedSvg = await new Promise((resolve) => {
        let timer = setTimeout(() => {
          globalThis.URL.revokeObjectURL(url);
          resolve(false);
        }, 1500);

        img.onload = () => {
          clearTimeout(timer);
          try {
            context.drawImage(img, textX, top + CARD_PADDING, textWidth, textHeight);
            renderedSvg = true;
          } catch {
            renderedSvg = false;
          }
          globalThis.URL.revokeObjectURL(url);
          resolve(renderedSvg);
        };
        img.onerror = () => {
          clearTimeout(timer);
          globalThis.URL.revokeObjectURL(url);
          resolve(false);
        };
        img.src = url;
      });
    } catch {
      renderedSvg = false;
    }
  }

  if (!renderedSvg) {
    drawFallbackProductCardText(context, layout, textX, top, textWidth);
  }
};

const renderPageImage = async ({
  exportData,
  pageLayouts,
  pageIndex,
  pageCount,
  logoImage,
  productImages,
}) => {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  drawHeader(context, exportData, logoImage, pageIndex, pageCount);

  let currentTop = CONTENT_TOP;
  for (const layout of pageLayouts) {
    await drawProductCardContent(
      context,
      layout,
      productImages.get(layout.imageKey || layout.key),
      currentTop,
    );
    currentTop += layout.height + CARD_GAP;
  }

  return canvas.toDataURL("image/png");
};

export const generateUsageInstructionsPdf = async (exportData) => {
  if (
    !exportData?.items?.length ||
    typeof document === "undefined"
  ) {
    throw new Error("Không có dữ liệu hướng dẫn sử dụng để tạo PDF.");
  }

  const measurementCanvas = document.createElement("canvas");
  const measurementContext = measurementCanvas.getContext("2d");
  const layouts = exportData.items.map((item) =>
    createCardLayout(measurementContext, item),
  );
  const availableHeight =
    PAGE_HEIGHT - CONTENT_TOP - CONTENT_BOTTOM;
  const fittedLayouts = fitLayoutsToPageHeight(
    layouts,
    availableHeight - CARD_GAP,
  );
  const pages = paginateByHeight(
    fittedLayouts,
    (layout) => layout.height + CARD_GAP,
    availableHeight,
  );

  const [logoImage, productImagePairs] = await Promise.all([
    loadImage("/tiny-shop-transparent.png"),
    Promise.all(
      exportData.items.map(async (item) => [
        item.key,
        await loadImage(item.image),
      ]),
    ),
  ]);
  const productImages = new Map(productImagePairs);
  const pageImages = await Promise.all(
    pages.map((pageLayouts, pageIndex) =>
      renderPageImage({
        exportData,
        pageLayouts,
        pageIndex,
        pageCount: pages.length,
        logoImage,
        productImages,
      }),
    ),
  );

  return createPdfFromPageImages(pageImages);
};

