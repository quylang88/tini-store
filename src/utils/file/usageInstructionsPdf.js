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
const NAME_LINE_HEIGHT = 48;
const INSTRUCTION_LINE_HEIGHT = 42;
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


const createCardLayout = (context, item) => {
  const cardWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  context.font = `800 32px ${FONT_FAMILY}`;
  const nameLines = wrapCanvasText(context, item.name, cardWidth - CARD_PADDING * 4);

  const rawInstructionLines = convertHtmlToPdfLines(item.usageInstructions);
  const instructionLines = rawInstructionLines.flatMap((line) =>
    wrapCanvasText(context, line, cardWidth - CARD_PADDING * 2),
  );

  const availableHeight = PAGE_HEIGHT - CONTENT_TOP - CONTENT_BOTTOM;

  return {
    ...item,
    imageKey: item.key,
    nameLines,
    instructionLines,
    height: availableHeight,
  };
};

export const fitLayoutsToPageHeight = (
  layouts,
  maxCardHeight,
) => {
  return (layouts || []).map((layout) => ({
    ...layout,
    height: maxCardHeight || layout.height,
  }));
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

export const parseHtmlToRichLines = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== "string") return [];
  const trimmed = htmlContent.trim();
  if (!trimmed) return [];

  if (typeof document === "undefined" || typeof DOMParser === "undefined") {
    return convertHtmlToPdfLines(trimmed).map((line) => {
      const isBullet = /^(?:[•⁃–—\-*+>:▪▫■□▲►✦✧★☆❖◆◇⚪⚫➔✓]|🔴|🔵|➡️|✔️|✅|o)\s+/iu.test(line);
      return {
        html: line,
        type: isBullet ? "li" : "p",
        bullet: isBullet ? "• " : null,
        indent: isBullet ? 24 : 0,
      };
    });
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${trimmed}</div>`, "text/html");
    const container = doc.body.firstElementChild;
    if (!container) return [];

    const lines = [];

    const getBulletPrefix = (listType, index, depth) => {
      if (listType === "ol") {
        if (depth === 1) return `${String.fromCharCode(96 + index)}. `;
        return `${index}. `;
      }
      if (depth === 1) return "◦ ";
      if (depth >= 2) return "▪ ";
      return "• ";
    };

    const processNode = (node, depth = 0) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const textLines = text.split(/\r?\n/);
        for (const lineText of textLines) {
          const clean = lineText.trim();
          if (clean) {
            const isBullet = /^(?:[•⁃–—\-*+>:▪▫■□▲►✦✧★☆❖◆◇⚪⚫➔✓]|🔴|🔵|➡️|✔️|✅)\s+/iu.test(clean);
            lines.push({
              html: escapeHtml(clean),
              type: isBullet ? "li" : "p",
              bullet: isBullet ? (depth > 0 ? "◦ " : "• ") : null,
              indent: isBullet ? 24 + depth * 28 : depth * 28,
            });
          }
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tagName = node.tagName ? node.tagName.toLowerCase() : "";

      if (tagName === "ul" || tagName === "ol") {
        let index = 1;
        for (const child of Array.from(node.children)) {
          if (child.tagName?.toLowerCase() === "li") {
            const prefix = getBulletPrefix(tagName, index, depth);
            const indent = 24 + depth * 28;

            const childClone = child.cloneNode(true);
            const nestedLists = Array.from(
              childClone.querySelectorAll("ul, ol"),
            );
            nestedLists.forEach((l) => l.remove());

            const inlineHtml = childClone.innerHTML.trim();
            if (inlineHtml) {
              lines.push({
                html: inlineHtml,
                type: "li",
                bullet: prefix,
                indent,
              });
            }

            for (const nestedList of Array.from(child.children)) {
              const nestedTag = nestedList.tagName?.toLowerCase();
              if (nestedTag === "ul" || nestedTag === "ol") {
                processNode(nestedList, depth + 1);
              }
            }
            index += 1;
          } else {
            processNode(child, depth);
          }
        }
        return;
      }

      if (tagName === "h1" || tagName === "h2") {
        lines.push({ html: node.innerHTML, type: "h2", indent: 0 });
        return;
      }
      if (["h3", "h4", "h5", "h6"].includes(tagName)) {
        lines.push({ html: node.innerHTML, type: "h3", indent: 0 });
        return;
      }
      if (tagName === "blockquote") {
        lines.push({ html: node.innerHTML, type: "blockquote", indent: 0 });
        return;
      }
      if (tagName === "hr") {
        lines.push({ html: "", type: "hr", indent: 0 });
        return;
      }

      const hasBlockChildren = Array.from(node.children).some((c) =>
        ["p", "div", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "hr", "section", "article"].includes(
          c.tagName?.toLowerCase(),
        ),
      );

      if (hasBlockChildren) {
        for (const child of Array.from(node.childNodes)) {
          processNode(child, depth);
        }
        return;
      }

      const brSplitHtmls = node.innerHTML.split(/<br\s*\/?>/i);
      for (const snippetHtml of brSplitHtmls) {
        const textCheck = snippetHtml.replace(/<[^>]+>/g, "").trim();
        if (textCheck) {
          const isBullet = /^(?:[•⁃–—\-*+>:▪▫■□▲►✦✧★☆❖◆◇⚪⚫➔✓]|🔴|🔵|➡️|✔️|✅)\s+/iu.test(textCheck);
          lines.push({
            html: snippetHtml,
            type: isBullet ? "li" : "p",
            bullet: isBullet ? (depth > 0 ? "◦ " : "• ") : null,
            indent: isBullet ? 24 + depth * 28 : depth * 28,
          });
        }
      }
    };

    for (const child of Array.from(container.childNodes)) {
      processNode(child, 0);
    }

    return lines;
  } catch {
    return convertHtmlToPdfLines(trimmed).map((line) => ({
      html: escapeHtml(line),
      type: "p",
      bullet: null,
      indent: 0,
    }));
  }
};

const parseInlineSpansFromHtml = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== "string") return [];
  const textContent = htmlContent.trim();
  if (!textContent) return [];

  if (typeof document === "undefined" || typeof DOMParser === "undefined") {
    const text = textContent.replace(/<[^>]+>/g, "").trim();
    return text ? [{ text, isBold: false, isItalic: false, isUnderline: false, isStrike: false, color: null, bgColor: null }] : [];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${textContent}</div>`, "text/html");
    const container = doc.body.firstElementChild;
    if (!container) return [];

    const spans = [];
    const walk = (node, currentStyle = {}) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text) {
          spans.push({
            text,
            ...currentStyle,
          });
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tagName = node.tagName.toLowerCase();
      const styleAttr = node.getAttribute("style") || "";
      const colorMatch = styleAttr.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i);
      const bgMatch = styleAttr.match(/(?:^|;\s*)background-color\s*:\s*([^;]+)/i);
      const fontAttrColor = node.getAttribute("color");

      const newStyle = {
        isBold:
          currentStyle.isBold ||
          ["strong", "b", "h1", "h2", "h3", "h4"].includes(tagName) ||
          /font-weight\s*:\s*(bold|[7-9]00)/i.test(styleAttr),
        isItalic:
          currentStyle.isItalic ||
          ["em", "i"].includes(tagName) ||
          /font-style\s*:\s*italic/i.test(styleAttr),
        isUnderline:
          currentStyle.isUnderline ||
          tagName === "u" ||
          /text-decoration\s*:\s*[^;]*underline/i.test(styleAttr),
        isStrike:
          currentStyle.isStrike ||
          ["s", "strike", "del"].includes(tagName) ||
          /text-decoration\s*:\s*[^;]*line-through/i.test(styleAttr),
        color: colorMatch ? colorMatch[1].trim() : fontAttrColor ? fontAttrColor : currentStyle.color || null,
        bgColor: bgMatch ? bgMatch[1].trim() : tagName === "mark" ? "#fef08a" : currentStyle.bgColor || null,
      };

      for (const child of Array.from(node.childNodes)) {
        walk(child, newStyle);
      }
    };

    walk(container, {});
    return spans;
  } catch {
    const text = htmlContent.replace(/<[^>]+>/g, "").trim();
    return text ? [{ text, isBold: false, isItalic: false, isUnderline: false, isStrike: false, color: null, bgColor: null }] : [];
  }
};

const drawRichTextSpans = (
  context,
  spans,
  startX,
  startY,
  maxWidth,
  baseFontSize = 27,
  defaultColor = COLOR_TEXT,
) => {
  if (!spans || spans.length === 0) return startY;

  let currentX = startX;
  let currentY = startY;

  for (const span of spans) {
    const text = span.text || "";
    if (!text) continue;

    const fontStyleStr = span.isItalic ? "italic" : "normal";
    const fontWeightStr = span.isBold ? "700" : "400";
    context.font = `${fontStyleStr} ${fontWeightStr} ${baseFontSize}px ${FONT_FAMILY}`;

    const words = text.split(/(\s+)/);
    for (const word of words) {
      if (!word) continue;
      const metrics = context.measureText(word);
      const wordWidth = metrics.width;

      if (currentX > startX && currentX + wordWidth > startX + maxWidth && word.trim()) {
        currentX = startX;
        currentY += INSTRUCTION_LINE_HEIGHT;
      }

      if (span.bgColor && span.bgColor !== "transparent" && word.trim()) {
        context.fillStyle = span.bgColor;
        context.fillRect(currentX - 1, currentY - 22, wordWidth + 2, 28);
      }

      context.fillStyle = span.color || defaultColor;
      context.fillText(word, currentX, currentY);

      if (span.isUnderline && word.trim()) {
        context.strokeStyle = span.color || defaultColor;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(currentX, currentY + 3);
        context.lineTo(currentX + wordWidth, currentY + 3);
        context.stroke();
      }

      if (span.isStrike && word.trim()) {
        context.strokeStyle = span.color || defaultColor;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(currentX, currentY - 8);
        context.lineTo(currentX + wordWidth, currentY - 8);
        context.stroke();
      }

      currentX += wordWidth;
    }
  }

  return currentY + INSTRUCTION_LINE_HEIGHT;
};

const drawProductCardContent = (
  context,
  layout,
  productImage,
  top,
) => {
  const cardWidth = PAGE_WIDTH - PAGE_MARGIN * 2; // 1100px
  const cardLeft = PAGE_MARGIN; // 70px

  // Card container box
  context.fillStyle = "#ffffff";
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 2;
  context.fillRect(cardLeft, top, cardWidth, layout.height);
  context.strokeRect(cardLeft, top, cardWidth, layout.height);

  let currentY = top + CARD_PADDING + 10;

  // 1. Centered Product Image (360x360)
  const imageSize = 360;
  const imageX = cardLeft + (cardWidth - imageSize) / 2;

  context.fillStyle = COLOR_PLACEHOLDER;
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(imageX, currentY, imageSize, imageSize, 16);
  } else {
    context.rect(imageX, currentY, imageSize, imageSize);
  }
  context.fill();
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 1.5;
  context.stroke();

  if (productImage) {
    drawContainedImage(
      context,
      productImage,
      imageX,
      currentY,
      imageSize,
      imageSize,
    );
  } else {
    context.fillStyle = COLOR_META;
    context.font = `600 24px ${FONT_FAMILY}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "Không có ảnh sản phẩm",
      imageX + imageSize / 2,
      currentY + imageSize / 2,
    );
    context.textBaseline = "alphabetic";
  }

  currentY += imageSize + 22;

  // 2. Badge Tag ("SẢN PHẨM") Centered
  const badgeText = "SẢN PHẨM";
  context.font = `700 16px ${FONT_FAMILY}`;
  const textMetrics = context.measureText(badgeText);
  const badgeWidth = Math.ceil(textMetrics.width) + 24;
  const badgeHeight = 30;
  const badgeX = cardLeft + (cardWidth - badgeWidth) / 2;

  context.fillStyle = "#fff1f2";
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 1.5;
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(badgeX, currentY, badgeWidth, badgeHeight, 15);
  } else {
    context.rect(badgeX, currentY, badgeWidth, badgeHeight);
  }
  context.fill();
  context.stroke();

  context.fillStyle = "#be123c";
  context.font = `700 16px ${FONT_FAMILY}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(badgeText, cardLeft + cardWidth / 2, currentY + badgeHeight / 2);
  context.textBaseline = "alphabetic";

  currentY += badgeHeight + 14;

  // 3. Product Name Title Centered
  context.fillStyle = "#0f172a";
  context.font = `800 32px ${FONT_FAMILY}`;
  context.textAlign = "center";
  context.textBaseline = "top";

  const nameLines = wrapCanvasText(context, layout.name, cardWidth - CARD_PADDING * 4);
  nameLines.forEach((line) => {
    context.fillText(line, cardLeft + cardWidth / 2, currentY);
    currentY += NAME_LINE_HEIGHT;
  });
  currentY += 12;

  // 4. Accent Divider Line
  const lineMargin = 50;
  context.strokeStyle = COLOR_BORDER;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(cardLeft + lineMargin, currentY);
  context.lineTo(cardLeft + cardWidth - lineMargin, currentY);
  context.stroke();
  currentY += 40;
  context.textBaseline = "alphabetic";
  context.textAlign = "left";

  // 5. HDSD Content Section (Full Width)
  const contentX = cardLeft + CARD_PADDING + 10;
  const contentWidth = cardWidth - (CARD_PADDING + 10) * 2;

  const rawInstructionHtml = layout.usageInstructions || "";
  const richLines = parseHtmlToRichLines(rawInstructionHtml);

  if (richLines.length > 0) {
    for (const lineObj of richLines) {
      if (lineObj.type === "hr") {
        context.strokeStyle = COLOR_BORDER;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(contentX, currentY - 10);
        context.lineTo(contentX + contentWidth, currentY - 10);
        context.stroke();
        currentY += 16;
        continue;
      }

      if (lineObj.type === "h2") {
        const spans = parseInlineSpansFromHtml(lineObj.html);
        currentY = drawRichTextSpans(
          context,
          spans,
          contentX,
          currentY,
          contentWidth,
          28,
          "#be123c",
        );
        currentY += 4;
        continue;
      }

      if (lineObj.type === "h3") {
        const spans = parseInlineSpansFromHtml(lineObj.html);
        currentY = drawRichTextSpans(
          context,
          spans,
          contentX,
          currentY,
          contentWidth,
          26,
          COLOR_ROSE,
        );
        currentY += 4;
        continue;
      }

      if (lineObj.type === "blockquote") {
        context.fillStyle = "#fff1f2";
        context.fillRect(contentX, currentY - 22, contentWidth, 34);
        context.fillStyle = COLOR_ROSE;
        context.fillRect(contentX, currentY - 22, 4, 34);
        const spans = parseInlineSpansFromHtml(lineObj.html);
        currentY = drawRichTextSpans(
          context,
          spans,
          contentX + 12,
          currentY,
          contentWidth - 12,
          25,
          "#374151",
        );
        currentY += 4;
        continue;
      }

      const lineIndent = lineObj.indent || (lineObj.bullet ? 24 : 0);
      const lineX = contentX + lineIndent;
      const lineWidth = contentWidth - lineIndent;

      if (lineObj.bullet) {
        context.fillStyle = COLOR_ROSE;
        context.font = `700 27px ${FONT_FAMILY}`;
        context.fillText(lineObj.bullet, contentX + lineIndent - 20, currentY);
      }

      const spans = parseInlineSpansFromHtml(lineObj.html);
      currentY = drawRichTextSpans(
        context,
        spans,
        lineX,
        currentY,
        lineWidth,
        27,
        COLOR_TEXT,
      );
      currentY += 2;
    }
  } else {
    context.font = `400 27px ${FONT_FAMILY}`;
    layout.instructionLines.forEach((line) => {
      let currentLine = line.replace(/<[^>]+>/g, "");
      context.fillStyle = COLOR_TEXT;
      context.fillText(currentLine, contentX, currentY);
      currentY += INSTRUCTION_LINE_HEIGHT;
    });
  }
};

const renderPageImage = ({
  exportData,
  pageLayouts,
  pageIndex,
  pageCount,
  logoImage,
  productImages,
  skipRemoteImages = false,
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
    const prodImg = skipRemoteImages ? null : productImages?.get(layout.imageKey || layout.key);
    drawProductCardContent(
      context,
      layout,
      prodImg,
      currentTop,
    );
    currentTop += layout.height + CARD_GAP;
  }

  try {
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.warn("Canvas export warning (e.g. cross-origin product image), falling back to safe rendering:", err);
    if (!skipRemoteImages) {
      return renderPageImage({
        exportData,
        pageLayouts,
        pageIndex,
        pageCount,
        logoImage: null,
        productImages: null,
        skipRemoteImages: true,
      });
    }
    throw err;
  }
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


