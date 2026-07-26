import fs from 'fs';

function modifyCreateFormDataForProduct() {
  let content = fs.readFileSync('src/utils/inventory/inventoryForm.js', 'utf8');
  content = content.replace('expiryDate: product.expiryDate || "",', 'expiryDate: product.expiryDate || "",\n    usageInstructions: product.usageInstructions || "",');
  fs.writeFileSync('src/utils/inventory/inventoryForm.js', content, 'utf8');
}

modifyCreateFormDataForProduct();
