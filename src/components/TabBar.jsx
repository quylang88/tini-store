import React, { useState, useEffect } from "react";
import { LayoutDashboard, ShoppingCart, Package, Settings } from "lucide-react";

const TabBar = ({ activeTab, setActiveTab, isVisible = true }) => {
  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { id: "products", icon: Package, label: "Nhập kho" },
    { id: "orders", icon: ShoppingCart, label: "Xuất kho" },
    { id: "settings", icon: Settings, label: "Cài đặt" },
  ];

  // activeState: Kiểm soát class animation (translate)
  const [activeState, setActiveState] = useState(isVisible);
  // isClosing: Kiểm soát việc giữ component trong DOM khi đang đóng
  const [isClosing, setIsClosing] = useState(false);

  // State theo dõi props prev
  const [prevVisible, setPrevVisible] = useState(isVisible);

  // Logic Derived State:
  if (isVisible !== prevVisible) {
    setPrevVisible(isVisible);
    // Nếu đang hiện -> ẩn: set isClosing = true ngay trong render
    if (prevVisible === true && isVisible === false) {
      setIsClosing(true);
    }
    // Nếu đang ẩn -> hiện lại: reset isClosing
    if (isVisible === true && isClosing === true) {
      setIsClosing(false);
    }
  }

  useEffect(() => {
    if (isVisible) {
      // 2. Kích hoạt animation trượt lên sau 1 frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActiveState(true);
        });
      });
    } else {
      // 1. Kích hoạt animation trượt xuống
      requestAnimationFrame(() => setActiveState(false));
      // 2. Đợi animation xong mới unmount
      const timer = setTimeout(() => {
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const shouldRender = isVisible || isClosing;

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 pb-safe-area z-50 backdrop-blur transition-transform duration-300 ease-in-out ${
        activeState ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex justify-around items-center h-20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-rose-600" : "text-amber-400"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;
