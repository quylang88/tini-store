import fs from 'fs';

function modifyProductDetailModal() {
  let content = fs.readFileSync('src/components/inventory/ProductDetailModal.jsx', 'utf8');
  const usageBlock = `
        {cachedProduct.usageInstructions && (
          <div className="border-b border-rose-100 pb-4">
            <h3 className="text-xs font-bold text-rose-700 uppercase mb-2">Hướng dẫn sử dụng</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{cachedProduct.usageInstructions}</p>
          </div>
        )}
`;
  content = content.replace('        <div className="flex flex-col border-b border-rose-100 pb-4">', usageBlock + '        <div className="flex flex-col border-b border-rose-100 pb-4">');
  fs.writeFileSync('src/components/inventory/ProductDetailModal.jsx', content, 'utf8');
}

modifyProductDetailModal();
