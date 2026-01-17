import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const ScrollableTabs = ({
  tabs,
  activeTab,
  onTabChange,
  layoutIdPrefix = "tabs",
  className = "",
  activeTextColor = "text-rose-600",
  inactiveTextColor = "text-rose-400",
  underlineColor = "bg-rose-500",
}) => {
  const containerRef = useRef(null);
  const activeTabRef = useRef(null);

  // Auto-scroll to active tab
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const tab = activeTabRef.current;

      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      // Check if tab is out of view
      const isOffScreenLeft = tabRect.left < containerRect.left;
      const isOffScreenRight = tabRect.right > containerRect.right;

      if (isOffScreenLeft || isOffScreenRight) {
        // Scroll so the tab is centered-ish
        const scrollLeft =
          tab.offsetLeft - container.clientWidth / 2 + tab.clientWidth / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto no-scrollbar ${className}`}
    >
      <div className="flex gap-2 min-w-max px-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={isActive ? activeTabRef : null}
              onClick={() => onTabChange(tab.key)}
              className={`relative px-3 py-2 text-sm font-medium transition-colors z-0 outline-none select-none ${
                isActive ? activeTextColor : inactiveTextColor
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={`${layoutIdPrefix}-underline`}
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${underlineColor}`}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ScrollableTabs;
