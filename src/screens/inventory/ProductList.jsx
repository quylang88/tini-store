import React from 'react';
import { Image as ImageIcon, Edit, Trash2 } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';

// Danh sách sản phẩm tách riêng để dễ quản lý
const ProductList = ({ products, onEdit, onDelete }) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
      {products.map(p => (
        <div
          key={p.id}
          className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
            {p.image ? (
              <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageIcon size={20} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="font-bold text-gray-800 truncate">{p.name}</div>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                {p.category}
              </span>
            </div>

            <div className="text-xs text-gray-400 font-mono mb-0.5">{p.barcode || '---'}</div>

            <div className="flex justify-between items-end mt-1">
              <div>
                <div className="text-indigo-600 font-bold text-sm">{formatNumber(p.price)}đ</div>
                {p.cost > 0 && (
                  <div className="text-[10px] text-gray-400">
                    {p.costJPY > 0
                      ? `Vốn: ¥${formatNumber(p.costJPY)} (${formatNumber(p.cost)}đ)`
                      : `Vốn: ${formatNumber(p.cost)}đ`}
                  </div>
                )}
              </div>
              <div className={`text-xs font-medium ${p.stock < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                Kho: {p.stock}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pl-2 border-l border-gray-50">
            <button onClick={() => onEdit(p)} className="text-gray-400 hover:text-indigo-600">
              <Edit size={18} />
            </button>
            <button onClick={() => onDelete(p.id)} className="text-gray-400 hover:text-red-500">
              <Trash2 size={18} />
            </button>
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
