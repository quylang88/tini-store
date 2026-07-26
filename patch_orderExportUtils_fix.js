import fs from 'fs';

function modifyOrderExportUtils() {
  let content = fs.readFileSync('src/utils/file/orderExportUtils.js', 'utf8');

  // Need to add usageInstructions and image to item processing
  // Let's use regex to replace it
  const regex = /price:\s*item\.price,/;

  if (!regex.test(content)) {
    console.log("Could not find price: item.price,");
  } else {
    content = content.replace(regex, 'price: item.price,\n        usageInstructions: p ? p.usageInstructions : "",\n        image: p ? p.image : "",');
    fs.writeFileSync('src/utils/file/orderExportUtils.js', content, 'utf8');
    console.log("Replaced");
  }
}

modifyOrderExportUtils();
