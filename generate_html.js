import fs from 'fs';
import { generateUsageInstructionsHTMLContent } from './src/utils/file/invoiceTemplates.js';

async function testExport() {
  const exportData = {
    isMerged: false,
    primaryOrderReference: "1234",
    items: [
      {
        name: "Vitamin C 1000mg",
        usageInstructions: "- Trẻ em: 1 viên/ngày\n- Người lớn: 2 viên/ngày\n- Uống sau khi ăn",
        image: ""
      },
      {
        name: "Paracetamol",
        usageInstructions: "- Trẻ em: 0.5 viên/ngày\n- Người lớn: 1 viên/ngày\n- Uống khi sốt",
        image: ""
      }
    ]
  };

  const html = await generateUsageInstructionsHTMLContent(exportData);
  fs.writeFileSync('/home/jules/verification/screenshots/test_hdsd.html', html, 'utf8');
  console.log("Written HTML");
}
testExport();
