import React, { useState, useEffect } from 'react';

// --- IMPORT CÁC MÀN HÌNH TỪ THƯ MỤC RIÊNG ---
// (Lưu ý: Bạn phải tạo các file này trong thư mục src/screens/ trước)
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Orders from './screens/Orders';
import Settings from './screens/Settings';

// --- IMPORT COMPONENT CHUNG ---
import TabBar from './components/TabBar';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- QUẢN LÝ DỮ LIỆU TẬP TRUNG (Single Source of Truth) ---
  // Dữ liệu sản phẩm và đơn hàng được giữ ở App cha và truyền xuống các con
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('shop_products_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('shop_orders_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Tự động lưu vào localStorage khi dữ liệu thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('shop_products_v2', JSON.stringify(products));
    } catch (e) {
      console.error("Lỗi lưu sản phẩm (có thể do bộ nhớ đầy):", e);
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shop_orders_v2', JSON.stringify(orders));
  }, [orders]);

  return (
    <div className="h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden flex flex-col">
      {/* KHU VỰC HIỂN THỊ NỘI DUNG CHÍNH */}
      <div className="flex-1 overflow-hidden relative">

        {activeTab === 'dashboard' && (
          <Dashboard products={products} orders={orders} />
        )}

        {activeTab === 'inventory' && (
          <Inventory products={products} setProducts={setProducts} />
        )}

        {activeTab === 'orders' && (
          <Orders
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            products={products}
            orders={orders}
            setProducts={setProducts}
            setOrders={setOrders}
          />
        )}
      </div>

      {/* THANH ĐIỀU HƯỚNG BÊN DƯỚI */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* CSS Global bổ trợ cho hiệu ứng slide và safe-area trên iPhone */}
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