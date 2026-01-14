import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Settings } from 'lucide-react';

const TabBar = ({ activeTab, setActiveTab, isVisible = true }) => {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'products', icon: Package, label: 'Nhập kho' },
    { id: 'orders', icon: ShoppingCart, label: 'Xuất kho' },
    { id: 'settings', icon: Settings, label: 'Cài đặt' },
  ];

  // Trạng thái render để giữ component trong DOM khi đang animate out
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      // Đợi animation chạy xong (300ms) rồi mới gỡ khỏi DOM (hoặc chỉ cần ẩn đi bằng CSS)
      // Ở đây ta dùng CSS animation class để trượt xuống, nên giữ render một chút
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Nếu không visible và đã hết thời gian animation thì không render gì cả (để tránh chiếm click)
  // Tuy nhiên, nếu muốn giữ layout ổn định, có thể chỉ cần pointer-events-none.
  // Nhưng yêu cầu là "biến mất", nên unmount hoặc display:none là hợp lý sau khi animate.
  if (!shouldRender && !isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-amber-50/90 border-t border-amber-200 pb-safe-area z-50 backdrop-blur transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
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
