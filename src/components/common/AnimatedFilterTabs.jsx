import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const AnimatedFilterTabs = ({
  tabs,
  activeTab,
  onChange,
  layoutIdPrefix = "tabs",
  className = "",
  tabClassName = "",
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
                : "text-amber-700 border-amber-200 hover:bg-amber-100/50"
            }`}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {isActive && (
              // Chỉ sử dụng motion.div nếu canAnimate là true hoặc nếu ta không dùng layoutId khi chưa mount
              // Để fix triệt để: Render static div khi chưa mount/animate, motion.div khi đã sẵn sàng
              // Tuy nhiên, nếu render static div thì không có animation layoutId sau này?
              // Giải pháp: Luôn render motion.div nhưng layoutId chỉ gán khi canAnimate?
              // Không, thay đổi layoutId sẽ gây remount/flicker.
              // Giải pháp tốt nhất: transition={{ duration: canAnimate ? undefined : 0 }}

              <motion.div
                layoutId={`${layoutIdPrefix}-active-pill`}
                className="absolute inset-0 bg-amber-500 rounded-full -z-10"
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
