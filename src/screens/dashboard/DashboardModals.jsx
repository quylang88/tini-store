import React from "react";
import StatListModal from "../../components/dashboard/StatListModal";
import { formatNumber } from "../../utils/helpers";

// Modal hiển thị danh sách sản phẩm hết hàng
export const OutOfStockModal = ({ open, onClose, products = [] }) => {
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

// Modal hiển thị danh sách hàng tồn kho (Slow moving, etc.)
export const InventoryWarningModal = ({ open, onClose, products = [] }) => {
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

// Modal hiển thị Top lợi nhuận / Top số lượng
export const TopListModal = ({ open, onClose, title, items, mode }) => {
  const color = mode === "quantity" ? "amber" : "rose";
  const valueLabel = mode === "quantity" ? "Số lượng" : "Lợi nhuận";

  return (
    <StatListModal
      open={open}
      onClose={onClose}
      title={title}
      items={items}
      color={color}
      showRank={true}
      renderItemContent={(item, index, theme) => (
        <div
          className={`text-xs ${
            mode === "quantity" ? "text-amber-700" : "text-rose-600"
          }`}
        >
          {valueLabel}:{" "}
          {mode === "quantity"
            ? item.quantity
            : `${formatNumber(item.profit)}đ`}
        </div>
      )}
    />
  );
};
