import React from "react";
import { LayoutDashboard, ShoppingCart, Package, Settings } from "lucide-react";
import useMountTransition from "../hooks/useMountTransition";

const TabBar = ({ activeTab, setActiveTab, isVisible = true }) => {
  const tabs = [
    { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { id: "products", icon: Package, label: "Nhập kho" },
    { id: "orders", icon: ShoppingCart, label: "Xuất kho" },
    { id: "settings", icon: Settings, label: "Cài đặt" },
  ];

  const { shouldRender, active } = useMountTransition(isVisible, 300);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 pb-safe-area z-50 backdrop-blur transition-transform duration-300 ease-in-out ${
        active ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex justify-around items-center h-[60px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-rose-600" : "text-amber-500"
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
