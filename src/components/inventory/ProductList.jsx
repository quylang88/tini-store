import React from 'react';
import { Image as ImageIcon, Edit, Trash2 } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';

const ProductList = ({ products, onEdit, onDelete }) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
      {products.map(product => (
        <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
            {product.image ? (
              <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="font-bold text-gray-800 truncate">{product.name}</div>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{product.category}</span>
            </div>

            <div className="text-xs text-gray-400 font-mono mb-0.5">{product.barcode || '---'}</div>

            <div className="flex justify-between items-end mt-1">
              <div>
                <div className="text-rose-600 font-bold text-sm">{formatNumber(product.price)}đ</div>
                {product.cost > 0 && (
                  <div className="text-[10px] text-gray-400">
                    {product.costJPY > 0
                      ? `Vốn: ¥${formatNumber(product.costJPY)} (${formatNumber(product.cost)}đ)`
                      : `Vốn: ${formatNumber(product.cost)}đ`}
                  </div>
                )}
              </div>
              <div className={`text-xs font-medium ${product.stock < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                Kho: {product.stock}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pl-2 border-l border-amber-100">
            <button onClick={() => onEdit(product)} className="text-gray-400 hover:text-rose-600"><Edit size={18} /></button>
            <button onClick={() => onDelete(product.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
          </div>
        </div>
      ))}
      {products.length === 0 && (
        <div className="text-center text-gray-400 mt-10 text-sm">Không có sản phẩm nào</div>
      )}
    </div>
  );
};

export default ProductList;