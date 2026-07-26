import fs from 'fs';

function addExportUsageInstructions() {
  let content = fs.readFileSync('src/utils/file/fileUtils.js', 'utf8');

  // imports
  content = content.replace('generateReceiptHTMLContent,\n  generateA4InvoiceHTMLContent,\n} from "./invoiceTemplates";', 'generateReceiptHTMLContent,\n  generateA4InvoiceHTMLContent,\n  generateUsageInstructionsHTMLContent,\n} from "./invoiceTemplates";');

  const usageInstructionsExport = `
export const exportUsageInstructionsToHTML = async (
  order,
  products = [],
) => {
  const exportData = buildOrdersExportData([order], products);
  if (!exportData) return;

  const htmlContent = await generateUsageInstructionsHTMLContent(exportData);
  if (!htmlContent) return; // Không có sản phẩm nào có HDSD

  const fileName = sanitizeFileName(\`HDSD_\${order.orderNumber || order.id.slice(-4)}.html\`);
  await shareOrDownloadFile(htmlContent, fileName, "text/html");
};
`;

  content = content + '\n' + usageInstructionsExport;
  fs.writeFileSync('src/utils/file/fileUtils.js', content, 'utf8');
}

addExportUsageInstructions();
