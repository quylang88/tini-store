import React from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';
import { getAveragePurchaseCost, normalizePurchaseLots } from '../../utils/purchaseUtils';
import { normalizeWarehouseStock } from '../../utils/warehouseUtils';

const ProductList = ({ products, onEdit, onDelete }) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
      {products.map(product => {
        // Lợi nhuận để user tham khảo nhanh ngay trong danh sách kho
        const purchaseLots = normalizePurchaseLots(product);
        const averageCost = getAveragePurchaseCost(purchaseLots);
        const expectedProfit = (Number(product.price) || 0) - averageCost;
        const hasProfitData = Number(product.price) > 0 && averageCost > 0;
        const stockByWarehouse = normalizeWarehouseStock(product);

        return (
        <div
          key={product.id}
          onClick={() => onEdit(product)}
          className="bg-white p-3 rounded-xl shadow-sm border border-amber-100 flex gap-3 items-center cursor-pointer hover:shadow-md transition"
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
                {hasProfitData && (
                  <div className="text-[10px] text-emerald-600">
                    Lợi nhuận: {formatNumber(expectedProfit)}đ
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500">Tồn kho: {stockByWarehouse.daLat} LD • {stockByWarehouse.vinhPhuc} VP</div>
                <div className="text-[10px] text-amber-500">Giá nhập: {purchaseLots.length} mức</div>
              </div>
            </div>
          </div>
          <div className="pl-2 border-l border-amber-100">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete(product.id);
              }}
              className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center shadow-sm"
              aria-label={`Xoá ${product.name}`}
            >
              <Trash2 size={20} />
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

export default ProductList;
