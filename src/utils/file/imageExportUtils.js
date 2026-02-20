import { formatNumber } from "../formatters/formatUtils";

/**
 * Loads an image from a source (URL, Base64, Blob) and returns an HTMLImageElement.
 * @param {string} src - The image source.
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Attempt to handle CORS if applicable
    img.onload = () => resolve(img);
    img.onerror = (err) => {
        console.warn("Failed to load image:", src, err);
        resolve(null); // Resolve with null to continue processing other images
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
  const FONT_TITLE = "bold 50px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_NAME = "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_PRICE = "bold 45px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"; // Red
  const FONT_META = "30px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"; // Gray
  const FONT_TOTAL_LABEL = "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const FONT_TOTAL_VALUE = "bold 60px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  // Colors
  const COLOR_BG = "#ffffff";
  const COLOR_TEXT_PRIMARY = "#1f2937"; // gray-900
  const COLOR_TEXT_PRICE = "#e11d48"; // rose-600
  const COLOR_TEXT_META = "#6b7280"; // gray-500
  const COLOR_DIVIDER = "#e5e7eb"; // gray-200

  // --- Calculate Height ---
  // Ensure totalHeight includes extra buffer before footer
  const totalHeight = HEADER_HEIGHT + (items.length * ITEM_HEIGHT) + FOOTER_HEIGHT + FOOTER_PADDING_TOP;

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
    items.map(item => item.image ? loadImage(item.image) : Promise.resolve(null))
  );

  // --- Draw Header ---
  let currentY = PADDING;

  // Logo (Larger)
  if (logoImg) {
    const logoHeight = 250; // Increased from 120
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
    // Ensure logo doesn't exceed canvas width
    const maxLogoWidth = CANVAS_WIDTH - (PADDING * 2);
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
    const itemY = itemsStartY + (index * ITEM_HEIGHT);
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
        const scale = Math.min(ITEM_IMAGE_SIZE / img.width, ITEM_IMAGE_SIZE / img.height);
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
        ctx.fillText("?", imgX + ITEM_IMAGE_SIZE/2, imgY + ITEM_IMAGE_SIZE/2 + 30);
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
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxTextWidth && n > 0) {
        ctx.fillText(line, textX, textY);
        line = words[n] + " ";
        textY += 50; // Line height
        lineCount++;
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
    const lastItemEndY = itemsStartY + (items.length * ITEM_HEIGHT);
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
        return sum + (p * q);
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
