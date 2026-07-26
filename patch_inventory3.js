import fs from 'fs';

function modifyInventorySaveUtils() {
  let content = fs.readFileSync('src/utils/inventory/inventorySaveUtils.js', 'utf8');
  content = content.replace('image: formData.image,', 'image: formData.image,\n    usageInstructions: formData.usageInstructions || "",');
  fs.writeFileSync('src/utils/inventory/inventorySaveUtils.js', content, 'utf8');
}

modifyInventorySaveUtils();
