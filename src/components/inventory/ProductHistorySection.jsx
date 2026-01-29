import React from "react";
import { formatNumber } from "../../utils/formatters/formatUtils";
import { getWarehouseLabel } from "../../utils/inventory/warehouseUtils";

const ProductHistorySection = ({ purchaseLots = [], isEditingLot }) => {
  if (!purchaseLots.length || isEditingLot) {
    return null;
  }

  return (
    <div className="bg-white border border-rose-100 rounded-xl p-3 space-y-2">
      <div className="text-[10px] font-bold text-rose-800 uppercase">
        Giá nhập còn tồn
      </div>
      {purchaseLots.map((lot) => (
        <div
          key={lot.id}
          className="flex items-center justify-between text-xs text-gray-900"
        >
          <div className="font-semibold">{formatNumber(lot.cost)}đ</div>
          <div className="text-[10px] text-rose-600">
            {lot.quantity} sp • {getWarehouseLabel(lot.warehouse)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductHistorySection;
