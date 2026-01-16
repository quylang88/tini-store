import React from "react";
import { motion } from "framer-motion";

const AnimatedFilterTabs = ({
  tabs,
  activeTab,
  onChange,
  layoutIdPrefix = "tabs",
  className = "",
  tabClassName = "",
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors z-0 ${tabClassName} ${
              isActive
                ? "text-white border-transparent"
                : "text-amber-700 border-amber-200 hover:bg-amber-100/50"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-active-pill`}
                className="absolute inset-0 bg-amber-500 rounded-full -z-10"
                initial={false} // Ngăn chặn animation khi mount
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AnimatedFilterTabs;
