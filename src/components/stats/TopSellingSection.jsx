import React from "react";
import { Trophy } from "lucide-react";
import AnimatedFilterTabs from "../common/AnimatedFilterTabs";
import StatBlock from "../dashboard/StatBlock";

const TopSellingSection = ({
  topOptions,
  activeTopOption,
  onOptionChange,
  topByProfit,
  topByQuantity,
  onOpenModal,
  layoutIdPrefix = "top-selling-tabs",
}) => {
  // Chuyển đổi topOptions sang định dạng yêu cầu của AnimatedFilterTabs (key, label)
  const tabs = topOptions.map((opt) => ({
    key: opt.id,
    label: opt.label,
  }));

  return (
    <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-100 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-rose-700">
          <Trophy size={18} />
          <h3 className="font-bold text-rose-700 text-sm uppercase">
            Top bán chạy
          </h3>
        </div>

        {/* Tái sử dụng AnimatedFilterTabs để có hiệu ứng "viên thuốc trượt" đồng nhất */}
        <AnimatedFilterTabs
          tabs={tabs}
          activeTab={activeTopOption}
          onChange={onOptionChange}
          layoutIdPrefix={layoutIdPrefix}
          className="flex-nowrap overflow-x-auto no-scrollbar"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cột Top Lợi Nhuận - Rose Tone */}
        <StatBlock
          title="Top lợi nhuận"
          color="rose"
          items={topByProfit}
          onClick={() => onOpenModal("profit")}
          emptyText="Chưa có dữ liệu"
        />

        {/* Cột Top Số Lượng - Amber Tone */}
        <StatBlock
          title="Top số lượng"
          color="amber"
          items={topByQuantity}
          onClick={() => onOpenModal("quantity")}
          emptyText="Chưa có dữ liệu"
        />
      </div>
    </div>
  );
};

export default TopSellingSection;
