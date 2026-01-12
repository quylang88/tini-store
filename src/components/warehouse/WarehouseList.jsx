import React from 'react';
import { Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';
import { getWarehouseLabel, normalizeWarehouseStock } from '../../utils/warehouseUtils';

const WarehouseList = ({ products, activeWarehouse, onEdit, onDelete }) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
      {products.map(product => {
        const { daLat, vinhPhuc } = normalizeWarehouseStock(product);
        const totalStock = daLat + vinhPhuc;
        const selectedStock = activeWarehouse === 'vinhPhuc' ? vinhPhuc : daLat;
        return (
          <div
            key={product.id}
            className="bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
              {product.image ? (
                <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="font-bold text-amber-900 truncate">{product.name}</div>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{product.category}</span>
              </div>
              <div className="text-xs text-gray-400 font-mono mb-0.5">{product.barcode || '---'}</div>
              <div className="flex justify-between items-end mt-1">
                <div>
                  <div className="text-amber-700 font-bold text-sm">{formatNumber(product.price)}đ</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">
                    {getWarehouseLabel(activeWarehouse)}: {selectedStock}
                  </div>
                  <div className={`text-xs font-medium ${totalStock < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                    Tổng kho: {totalStock}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="w-9 h-9 rounded-lg border border-amber-200 text-amber-700 bg-white hover:bg-amber-50 flex items-center justify-center"
                aria-label={`Chỉnh sửa tồn kho ${product.name}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="w-9 h-9 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center"
                aria-label={`Xoá ${product.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
      {products.length === 0 && (
        <div className="text-center text-gray-400 mt-10 text-sm">Không có sản phẩm nào</div>
      )}
    </div>
  );
};

export default WarehouseList;
