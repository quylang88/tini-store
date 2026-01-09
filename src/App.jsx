import React, { useState, useEffect } from 'react';

// --- IMPORT CÁC MÀN HÌNH TỪ THƯ MỤC RIÊNG ---
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Orders from './screens/Orders';
import Settings from './screens/Settings';

// --- IMPORT COMPONENT CHUNG ---
import TabBar from './components/TabBar';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // 1. Dữ liệu Sản phẩm
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('shop_products_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. Dữ liệu Đơn hàng
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('shop_orders_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. Cài đặt chung (Tỷ giá,...) - MỚI
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('shop_settings');
    return saved ? JSON.parse(saved) : {
      exchangeRate: 170, // Tỷ giá mặc định 1 JPY = 170 VND
      categories: ['Chung', 'Mỹ phẩm', 'Thực phẩm', 'Quần áo'] // Danh mục mặc định
    };
  });

  // --- EFFECT LƯU DATA ---
  useEffect(() => {
    try {
      localStorage.setItem('shop_products_v2', JSON.stringify(products));
    } catch (e) {
      console.error("Lỗi lưu sản phẩm:", e);
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shop_orders_v2', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('shop_settings', JSON.stringify(settings));
  }, [settings]);

  return (
    <div className="h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden relative">

        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            orders={orders}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            products={products}
            setProducts={setProducts}
            settings={settings} // Truyền cài đặt xuống kho
          />
        )}

        {activeTab === 'orders' && (
          <Orders
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            settings={settings}       // Truyền cài đặt xuống đơn hàng
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            products={products}
            orders={orders}
            setProducts={setProducts}
            setOrders={setOrders}
            settings={settings}       // Truyền cài đặt để sửa
            setSettings={setSettings} // Hàm sửa cài đặt
          />
        )}
      </div>

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <style>{`
        .pb-safe-area { padding-bottom: env(safe-area-inset-bottom); }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;