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
}) => {
  // Convert topOptions to format required by AnimatedFilterTabs (key, label)
  // Assuming topOptions has { id, label }
  const tabs = topOptions.map((opt) => ({
    key: opt.id,
    label: opt.label,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-700">
          <Trophy size={18} />
          <h3 className="font-bold text-amber-800 text-sm uppercase">
            Top bán chạy
          </h3>
        </div>

        {/* Reusing AnimatedFilterTabs for consistent "sliding pill" effect */}
        <AnimatedFilterTabs
          tabs={tabs}
          activeTab={activeTopOption}
          onChange={onOptionChange}
          layoutIdPrefix="top-selling-tabs"
          className="flex-nowrap overflow-x-auto no-scrollbar"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Top Profit Column */}
        <button
          type="button"
          onClick={() => onOpenModal("profit")}
          className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-left transition active:bg-rose-50 focus:outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase text-rose-600">
              Top lợi nhuận
            </h4>
          </div>
          <div className="space-y-2 text-sm text-rose-800">
            <AnimatePresence mode="wait">
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

        {/* Top Quantity Column */}
        <button
          type="button"
          onClick={() => onOpenModal("quantity")}
          className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-left transition active:bg-emerald-50 focus:outline-none"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase text-emerald-600">
              Top số lượng
            </h4>
          </div>
          <div className="space-y-2 text-sm text-emerald-800">
            <AnimatePresence mode="wait">
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
              <div className="text-center text-emerald-500 text-sm">
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
