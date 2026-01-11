import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, Settings as SettingsIcon } from 'lucide-react';

const TabBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'orders', icon: ShoppingCart, label: 'Đơn hàng' },
    { id: 'inventory', icon: Package, label: 'Kho hàng' },
    { id: 'settings', icon: SettingsIcon, label: 'Cài đặt' },
  ];

  // Nâng thanh tabbar lên nhẹ để hợp với giao diện iPhone
  return (
    <div className="fixed bottom-2 left-0 right-0 bg-amber-50/90 border-t border-amber-200 pb-safe-area z-50 backdrop-blur">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-rose-600' : 'text-amber-400'
                }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;
