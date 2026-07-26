import fs from 'fs';

function modifyOrderExportUtils() {
  let content = fs.readFileSync('src/utils/file/orderExportUtils.js', 'utf8');

  // Need to add usageInstructions and image to item processing
  // let's check if they are already there

  if (content.includes('usageInstructions: p ? p.usageInstructions : "",')) {
    console.log("Already added");
    return;
  }

  content = content.replace('price: item.price,', 'price: item.price,\n        usageInstructions: p ? p.usageInstructions : "",\n        image: p ? p.image : "",');
  fs.writeFileSync('src/utils/file/orderExportUtils.js', content, 'utf8');
}

modifyOrderExportUtils();
