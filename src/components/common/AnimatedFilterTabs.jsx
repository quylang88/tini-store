import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const AnimatedFilterTabs = ({
  tabs,
  activeTab,
  onChange,
  layoutIdPrefix = "tabs",
  className = "",
  tabClassName = "",
  activeColor = "bg-amber-500", // Default active background
  inactiveTextColor = "text-amber-700", // Default inactive text
  inactiveBorderColor = "border-amber-200", // Default inactive border
}) => {
  // Trạng thái để kiểm soát việc render animation
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    // Chỉ cho phép animation sau khi component đã mount xong
    // Điều này ngăn animation chạy khi quay lại màn hình
    const timer = setTimeout(() => {
      setCanAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
                : `${inactiveTextColor} ${inactiveBorderColor} hover:bg-opacity-50 hover:bg-gray-100`
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-active-pill`}
                className={`absolute inset-0 rounded-full -z-10 ${activeColor}`}
                initial={false}
                transition={
                  canAnimate
                    ? { type: "spring", stiffness: 300, damping: 30 }
                    : { duration: 0 }
                }
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
