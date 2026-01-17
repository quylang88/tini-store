import React from "react";
import StatListModal from "../../components/dashboard/StatListModal";

const InventoryWarningModal = ({ open, onClose, products = [] }) => {
  return (
    <StatListModal
      open={open}
      onClose={onClose}
      title="Hàng tồn"
      items={products}
      color="violet"
      emptyText="Không có sản phẩm cảnh báo"
      renderItemContent={(product) => (
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-violet-500 font-medium bg-violet-50 px-1.5 py-0.5 rounded">
              {product.daysNoSale} ngày không bán
            </span>
          </div>
          <span className="text-[11px] font-medium text-gray-500">
            Tồn: <b className="text-violet-600">{product.stock}</b>
          </span>
        </div>
      )}
    />
  );
};

export default InventoryWarningModal;
