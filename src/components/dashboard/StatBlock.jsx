import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import RankBadge from "../stats/RankBadge";
import { ChevronRight } from "lucide-react";

// Định nghĩa các theme màu sắc
const THEMES = {
  rose: {
    container: "bg-rose-100/60 border-rose-200 active:bg-rose-100",
    title: "text-rose-700",
    content: "text-rose-800",
    empty: "text-rose-500",
  },
  amber: {
    container: "bg-amber-100/80 border-amber-200 active:bg-amber-50",
    title: "text-amber-700",
    content: "text-amber-800",
    empty: "text-amber-500",
  },
  teal: {
    container: "bg-teal-100/60 border-teal-200 active:bg-teal-100",
    title: "text-teal-700",
    content: "text-teal-800",
    empty: "text-teal-500",
  },
  violet: {
    container: "bg-violet-100/60 border-violet-200 active:bg-violet-100",
    title: "text-violet-700",
    content: "text-violet-800",
    empty: "text-violet-500",
  },
  red: {
    container: "bg-red-100/60 border-red-200 active:bg-red-100",
    title: "text-red-700",
    content: "text-red-800",
    empty: "text-red-500",
  },
};

const StatBlock = ({
  title,
  items = [],
  onClick,
  color = "rose",
  emptyText = "Chưa có dữ liệu",
  icon: Icon,
  className = "",
  showRank = true,
}) => {
  const theme = THEMES[color] || THEMES.rose;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-xl border p-3 text-left transition focus:outline-none ${theme.container} ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className={theme.title} />}
          <h4 className={`text-xs font-semibold uppercase ${theme.title}`}>
            {title}
          </h4>
        </div>
        {/* Chỉ báo mũi tên nhỏ để gợi ý có thể bấm vào */}
        <ChevronRight size={14} className={`opacity-50 ${theme.title}`} />
      </div>

      <div className={`space-y-2 text-sm ${theme.content}`}>
        <AnimatePresence mode="wait" initial={false}>
          {items && items.length > 0 ? (
            items.map((p, idx) => (
              <motion.div
                key={p.id || p.name || idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                {showRank && <RankBadge rank={idx + 1} />}
                {!showRank && (
                   <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/50 text-[10px] font-bold opacity-70">
                     {idx + 1}
                   </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate">{p.name}</div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-center text-sm italic ${theme.empty}`}
            >
              {emptyText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
};

export default StatBlock;
