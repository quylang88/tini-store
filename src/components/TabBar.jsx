import React from "react";
import useMountTransition from "../hooks/ui/useMountTransition";
import { triggerHaptic, HAPTIC_PATTERNS } from "../utils/common/haptics";
import DashboardIcon from "./tabbar/DashboardIcon";
import ProductIcon from "./tabbar/ProductIcon";
import OrderIcon from "./tabbar/OrderIcon";
import SettingsIcon from "./tabbar/SettingsIcon";
import AssistantIcon from "./assistant/AssistantIcon";

const TabBar = ({ activeTab, setActiveTab, isVisible = true }) => {
  const tabs = [
    { id: "dashboard", component: DashboardIcon, label: "Tổng quan" },
    { id: "products", component: ProductIcon, label: "Nhập kho" },
    { id: "assistant", component: AssistantIcon, label: "Trợ lý" },
    { id: "orders", component: OrderIcon, label: "Xuất kho" },
    { id: "settings", component: SettingsIcon, label: "Cài đặt" },
  ];

  const { shouldRender, active } = useMountTransition(isVisible, 300);

  if (!shouldRender) return null;

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 pb-safe-area z-50 backdrop-blur transition-transform duration-300 ease-in-out ${
        active ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const IconComponent = tab.component;
          const isActive = activeTab === tab.id;

          const handleTabClick = () => {
            if (activeTab !== tab.id) {
              triggerHaptic(HAPTIC_PATTERNS.light);
              setActiveTab(tab.id);
            }
          };

          return (
            <button
              key={tab.id}
              onClick={handleTabClick}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 ${
                isActive ? "z-10" : "text-amber-500 z-0"
              }`}
            >
              <IconComponent isActive={isActive} size={24} loop={false} />
              <span
                className={`text-[10px] font-bold uppercase ${
                  isActive
                    ? "bg-[linear-gradient(90deg,#ca8a04_0%,#db2777_35%,#2563eb_65%,#16a34a_100%)] bg-clip-text text-transparent"
                    : ""
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
