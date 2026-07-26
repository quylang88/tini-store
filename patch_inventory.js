import fs from 'fs';

function addUsageInstructions(file) {
  let content = fs.readFileSync(file, 'utf8');

  // buildBaseFormData
  if (content.includes('expiryDate: "",') && !content.includes('usageInstructions: "",')) {
    content = content.replace('expiryDate: "",', 'expiryDate: "",\n  usageInstructions: "",');
    fs.writeFileSync(file, content, 'utf8');
  }
}

addUsageInstructions('src/utils/inventory/inventoryForm.js');
