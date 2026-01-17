import React from "react";
import StatListModal from "../../components/dashboard/StatListModal";

const OutOfStockModal = ({ open, onClose, products = [] }) => {
  return (
    <StatListModal
      open={open}
      onClose={onClose}
      title="Sản phẩm hết hàng"
      items={products}
      color="teal"
      emptyText="Không có sản phẩm nào hết hàng"
      renderItemContent={(product) => (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-rose-600 font-medium bg-rose-50 px-1.5 py-0.5 rounded">
            Hết hàng
          </span>
          {product.category && (
            <span className="text-[10px] text-gray-500">
              {product.category}
            </span>
          )}
        </div>
      )}
    />
  );
};

export default OutOfStockModal;
