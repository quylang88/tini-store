import fs from 'fs';

function modifyOrderExportUtils() {
  let content = fs.readFileSync('src/utils/file/orderExportUtils.js', 'utf8');

  // Add usageInstructions to item map
  const oldCode = `        itemMap.set(mergeKey, {
          key: mergeKey,
          productId: item.productId || item.id || null,
          barcode: normalizeText(product?.barcode) || "-",
          name: displayName,
          image: product?.image || null,
          price: unitPrice,
          quantity: 0,
        });`;

  const newCode = `        itemMap.set(mergeKey, {
          key: mergeKey,
          productId: item.productId || item.id || null,
          barcode: normalizeText(product?.barcode) || "-",
          name: displayName,
          image: product?.image || null,
          usageInstructions: product?.usageInstructions || null,
          price: unitPrice,
          quantity: 0,
        });`;

  content = content.replace(oldCode, newCode);
  fs.writeFileSync('src/utils/file/orderExportUtils.js', content, 'utf8');
}

modifyOrderExportUtils();
