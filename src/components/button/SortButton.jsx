import React from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CalendarArrowDown,
  CalendarArrowUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SortButton = ({ active, onClick, icon: Icon, direction, label, sortType }) => {
  // Determine the icon to show inside the motion div based on sort type and direction
  const getDirectionIcon = () => {
    if (sortType === 'price') {
      // Price Asc: Cheap -> Expensive (Bars growing)
      if (direction === 'asc') return ArrowUpNarrowWide;
      // Price Desc: Expensive -> Cheap (Bars shrinking)
      return ArrowDownWideNarrow;
    }
    if (sortType === 'date') {
      // Date Asc: Oldest (Ascending time) -> CalendarArrowUp
      if (direction === 'asc') return CalendarArrowUp;
      // Newest (Descending time) -> CalendarArrowDown
      return CalendarArrowDown;
    }

    // Default fallback
    if (direction === 'asc') return ArrowUp;
    return ArrowDown;
  };

  const DirectionIcon = getDirectionIcon();

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center p-2 rounded-lg border transition-all active:scale-95 w-10 h-10 ${
        active
          ? "bg-rose-100 border-rose-300 text-rose-700 shadow-sm"
          : "bg-rose-50 border-rose-200 text-rose-400 hover:bg-rose-100 hover:text-rose-500 hover:border-rose-300"
      }`}
      aria-label={label}
    >
      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={`active-${direction}`}
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
            transition={{ duration: 0.2 }}
          >
            <DirectionIcon size={20} strokeWidth={2} />
          </motion.div>
        ) : (
          <motion.div
            key="inactive"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Icon size={20} strokeWidth={2} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default SortButton;
