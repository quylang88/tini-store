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

const createCardLayout = (context, item) => {
  const textWidth =
    PAGE_WIDTH -
    PAGE_MARGIN * 2 -
    CARD_PADDING * 2 -
    PRODUCT_IMAGE_SIZE -
    TEXT_GAP;

  context.font = `700 32px ${FONT_FAMILY}`;
  const nameLines = wrapCanvasText(context, item.name, textWidth);

  context.font = `400 27px ${FONT_FAMILY}`;
  const rawInstructionLines = convertHtmlToPdfLines(item.usageInstructions);
  const instructionLines = rawInstructionLines.flatMap((line) =>
    wrapCanvasText(context, line, textWidth),
  );

  const textHeight =
    nameLines.length * NAME_LINE_HEIGHT +
    18 +
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
    18 +
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
          (safeMaxHeight - CARD_PADDING * 2 - 18) /
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
        nameLines.length * NAME_LINE_HEIGHT + 18;
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

const drawProductCard = (
  context,
  layout,
  productImage,
  top,
) => {
  const cardWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  const imageX = PAGE_MARGIN + CARD_PADDING;
  const imageY = top + CARD_PADDING;
  const textX = imageX + PRODUCT_IMAGE_SIZE + TEXT_GAP;
  let textY = top + CARD_PADDING + 34;

  context.fillStyle = "#ffffff";
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 2;
  context.fillRect(PAGE_MARGIN, top, cardWidth, layout.height);
  context.strokeRect(PAGE_MARGIN, top, cardWidth, layout.height);

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

  context.textAlign = "left";
  context.fillStyle = COLOR_TEXT;
  context.font = `700 32px ${FONT_FAMILY}`;
  layout.nameLines.forEach((line) => {
    context.fillText(line, textX, textY);
    textY += NAME_LINE_HEIGHT;
  });
  textY += 18;

  context.font = `400 27px ${FONT_FAMILY}`;
  layout.instructionLines.forEach((line) => {
    context.fillText(line, textX, textY);
    textY += INSTRUCTION_LINE_HEIGHT;
  });
};

const renderPageImage = ({
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
  pageLayouts.forEach((layout) => {
    drawProductCard(
      context,
      layout,
      productImages.get(layout.imageKey || layout.key),
      currentTop,
    );
    currentTop += layout.height + CARD_GAP;
  });

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
  const pageImages = pages.map((pageLayouts, pageIndex) =>
    renderPageImage({
      exportData,
      pageLayouts,
      pageIndex,
      pageCount: pages.length,
      logoImage,
      productImages,
    }),
  );

  return createPdfFromPageImages(pageImages);
};
