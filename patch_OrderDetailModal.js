import fs from 'fs';

function addExportButton() {
  let content = fs.readFileSync('src/components/orders/OrderDetailModal.jsx', 'utf8');

  // Import exportUsageInstructionsToHTML
  content = content.replace('exportOrderToHTML, exportOrdersToImages } from "../../utils/file/fileUtils";', 'exportOrderToHTML, exportOrdersToImages, exportUsageInstructionsToHTML } from "../../utils/file/fileUtils";');
  content = content.replace('import { FileDown, Image as ImageIcon, Printer } from "lucide-react";', 'import { FileDown, Image as ImageIcon, Printer, FileText } from "lucide-react";');

  // add handleExport option
  const oldHandleExport = `      if (format === "image") {
        await exportOrdersToImages([cachedOrder], products);
      } else {
        await exportOrderToHTML(cachedOrder, products, format);
      }`;

  const newHandleExport = `      if (format === "image") {
        await exportOrdersToImages([cachedOrder], products);
      } else if (format === "hdsd") {
        await exportUsageInstructionsToHTML(cachedOrder, products);
      } else {
        await exportOrderToHTML(cachedOrder, products, format);
      }`;

  content = content.replace(oldHandleExport, newHandleExport);

  // add button to footer
  const oldButtons = `        <Button
          variant="softDanger"
          size="sm"
          onClick={() => handleExport("image")}
          className="h-auto py-2 hover:bg-rose-100 text-rose-800 border-rose-300"
        >
          <div className="flex flex-col items-center gap-1">
            <ImageIcon size={18} /> <span className="text-[10px]">Ảnh</span>
          </div>
        </Button>`;

  const newButtons = `        <Button
          variant="softDanger"
          size="sm"
          onClick={() => handleExport("image")}
          className="h-auto py-2 hover:bg-rose-100 text-rose-800 border-rose-300"
        >
          <div className="flex flex-col items-center gap-1">
            <ImageIcon size={18} /> <span className="text-[10px]">Ảnh</span>
          </div>
        </Button>
        <Button
          variant="softDanger"
          size="sm"
          onClick={() => handleExport("hdsd")}
          className="h-auto py-2 hover:bg-rose-100 text-rose-800 border-rose-300"
        >
          <div className="flex flex-col items-center gap-1">
            <FileText size={18} /> <span className="text-[10px]">HDSD</span>
          </div>
        </Button>`;

  content = content.replace(oldButtons, newButtons);
  content = content.replace('<div className="grid grid-cols-3 gap-2">', '<div className="grid grid-cols-4 gap-2">');

  fs.writeFileSync('src/components/orders/OrderDetailModal.jsx', content, 'utf8');
}

addExportButton();
