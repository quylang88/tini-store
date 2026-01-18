import React from "react";
import { Trophy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedFilterTabs from "../common/AnimatedFilterTabs";
import RankBadge from "./RankBadge";

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
  // Giả sử topOptions có { id, label }
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
        <button
          type="button"
          onClick={() => onOpenModal("profit")}
          className="rounded-xl border border-rose-200 bg-rose-100/60 p-3 text-left transition active:bg-rose-100 focus:outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase text-rose-700">
              Top lợi nhuận
            </h4>
          </div>
          <div className="space-y-2 text-sm text-rose-800">
            <AnimatePresence mode="wait" initial={false}>
              {topByProfit.map((p, idx) => (
                <motion.div
                  key={p.id || p.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <RankBadge rank={idx + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{p.name}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {topByProfit.length === 0 && (
              <div className="text-center text-rose-500 text-sm">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </button>

        {/* Cột Top Số Lượng - Amber Tone */}
        <button
          type="button"
          onClick={() => onOpenModal("quantity")}
          className="rounded-xl border border-amber-200 bg-amber-100 p-3 text-left transition active:bg-amber-200 focus:outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase text-amber-700">
              Top số lượng
            </h4>
          </div>
          <div className="space-y-2 text-sm text-amber-800">
            <AnimatePresence mode="wait" initial={false}>
              {topByQuantity.map((p, idx) => (
                <motion.div
                  key={p.id || p.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <RankBadge rank={idx + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{p.name}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {topByQuantity.length === 0 && (
              <div className="text-center text-amber-500 text-sm">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default TopSellingSection;
