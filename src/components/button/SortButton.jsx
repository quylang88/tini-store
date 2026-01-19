import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SortButton = ({ active, onClick, icon: Icon, direction, label }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center gap-1 p-2 rounded-lg border transition-all active:scale-95 ${
        active
          ? "bg-rose-100 border-rose-300 text-rose-700 shadow-sm"
          : "bg-rose-50 border-rose-200 text-rose-400 hover:bg-rose-100 hover:text-rose-500 hover:border-rose-300"
      }`}
      aria-label={label}
    >
      <Icon size={20} strokeWidth={2} />
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={direction} // Key changes trigger animation
            initial={{ opacity: 0, height: 0, width: 0, scale: 0 }}
            animate={{ opacity: 1, height: "auto", width: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, width: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {direction === "asc" ? (
              <ArrowUp size={14} strokeWidth={3} />
            ) : (
              <ArrowDown size={14} strokeWidth={3} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default SortButton;
