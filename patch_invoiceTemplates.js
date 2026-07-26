import fs from 'fs';

function addGenerateUsageInstructionsHTMLContent() {
  let content = fs.readFileSync('src/utils/file/invoiceTemplates.js', 'utf8');

  const newFunction = `
export const generateUsageInstructionsHTMLContent = async (exportData) => {
  if (!exportData || !exportData.items || exportData.items.length === 0) return "";

  // Lọc ra các sản phẩm có hướng dẫn sử dụng
  const itemsWithInstructions = exportData.items.filter(item => item.usageInstructions);

  if (itemsWithInstructions.length === 0) {
    alert("Không có sản phẩm nào trong đơn hàng có Hướng dẫn sử dụng.");
    return null;
  }

  const logoBase64 = await fetchLogoBase64();
  const logoHtml = logoBase64
    ? \`<img src="\${logoBase64}" alt="Logo" style="height: 60px;">\`
    : \`<h2 style="margin:0; color: #e11d48;">TINY SHOP</h2>\`;

  const dateStr = new Date().toLocaleDateString('vi-VN');

  const style = \`
    <style>
      @page { size: A4; margin: 15mm; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #333;
        margin: 0;
        padding: 0;
        line-height: 1.5;
        font-size: 14px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #e11d48;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .title {
        font-size: 24px;
        font-weight: bold;
        color: #e11d48;
        text-transform: uppercase;
        margin: 0;
      }
      .date {
        color: #666;
        font-size: 14px;
      }
      .product-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .product-item {
        display: flex;
        gap: 15px;
        border: 1px solid #eaeaea;
        border-radius: 8px;
        padding: 15px;
        page-break-inside: avoid;
      }
      .product-image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid #f0f0f0;
      }
      .product-info {
        flex: 1;
      }
      .product-name {
        font-size: 18px;
        font-weight: bold;
        margin: 0 0 10px 0;
        color: #1a1a1a;
      }
      .product-instructions {
        white-space: pre-wrap;
        color: #444;
        margin: 0;
      }
      .footer {
        text-align: center;
        margin-top: 40px;
        font-style: italic;
        color: #888;
        border-top: 1px solid #eaeaea;
        padding-top: 15px;
      }
    </style>
  \`;

  const itemsHtml = itemsWithInstructions.map(item => \`
    <div class="product-item">
      \${item.image ? \`<img class="product-image" src="\${item.image}" alt="Product Image" />\` : \`<div class="product-image" style="display:flex; align-items:center; justify-content:center; background:#f9f9f9; color:#999; font-size:12px; text-align:center;">Không có ảnh</div>\`}
      <div class="product-info">
        <h3 class="product-name">\${escapeHtml(item.name)}</h3>
        <p class="product-instructions">\${escapeHtml(item.usageInstructions)}</p>
      </div>
    </div>
  \`).join('');

  return \`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hướng Dẫn Sử Dụng</title>
  \${style}
</head>
<body>
  <div class="header">
    <div class="logo-container">
      \${logoHtml}
    </div>
    <div style="text-align: right;">
      <h1 class="title">Hướng Dẫn Sử Dụng</h1>
      <div class="date">Ngày in: \${dateStr}</div>
    </div>
  </div>

  <div class="product-list">
    \${itemsHtml}
  </div>

  <div class="footer">
    Cảm ơn quý khách đã tin tưởng và sử dụng sản phẩm của chúng tôi!
  </div>
</body>
</html>
  \`;
};
`;

  content = content + '\n' + newFunction;
  fs.writeFileSync('src/utils/file/invoiceTemplates.js', content, 'utf8');
}

addGenerateUsageInstructionsHTMLContent();
