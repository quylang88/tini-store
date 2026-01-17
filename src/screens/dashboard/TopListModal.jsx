import React from "react";
import StatListModal from "../../components/dashboard/StatListModal";
import { formatNumber } from "../../utils/helpers";

const TopListModal = ({ open, onClose, title, items, mode }) => {
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

export default TopListModal;
