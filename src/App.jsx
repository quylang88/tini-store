import React, { useState, useEffect } from 'react';

// --- IMPORT CÁC MÀN HÌNH TỪ THƯ MỤC RIÊNG ---
// Đảm bảo bạn đã tạo đủ các file này trong thư mục src/screens/
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Inventory from './screens/Inventory';
import Orders from './screens/Orders';
import Settings from './screens/Settings';
import StatsDetail from './screens/StatsDetail';
import { normalizePurchaseLots } from './utils/purchaseUtils';

// --- IMPORT COMPONENT CHUNG ---
import TabBar from './components/TabBar';
import ConfirmModal from './components/modals/ConfirmModal';
import ScreenTransition from './components/common/ScreenTransition';

const App = () => {
  // --- 1. QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP ---
  // Kiểm tra session để giữ đăng nhập khi F5
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('tini_auth') === 'true';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  // Modal xác nhận đăng xuất để giao diện đồng bộ
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // --- 2. KHỞI TẠO DỮ LIỆU TỪ LOCALSTORAGE ---
  // Dữ liệu Sản phẩm (chuẩn hoá thêm danh sách lô giá nhập).
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('shop_products_v2');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map((product) => normalizePurchaseLots(product));
  });

  // Dữ liệu Đơn hàng
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('shop_orders_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Cài đặt chung (Tỷ giá, Danh mục)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('shop_settings');
    return saved ? JSON.parse(saved) : {
      exchangeRate: 170,
      categories: ['Chung', 'Mỹ phẩm', 'Thực phẩm', 'Quần áo']
    };
  });

  // --- 3. TỰ ĐỘNG LƯU DỮ LIỆU KHI CÓ THAY ĐỔI ---
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

  // --- 4. CÁC HÀM XỬ LÝ AUTH ---
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('tini_auth', 'true');
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  // --- 5. LOGIC HIỂN THỊ TABBAR ---
  // Mặc định hiển thị, trừ khi vào các màn chi tiết (như Thống kê chi tiết)
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  // Khi chuyển tab, tự động cập nhật trạng thái hiển thị của TabBar
  useEffect(() => {
    if (activeTab === 'stats-detail') {
      setIsTabBarVisible(false);
    } else {
      setIsTabBarVisible(true);
    }
  }, [activeTab]);

  // --- 6. RENDERING ---

  // Nếu chưa đăng nhập -> Hiện màn hình Login
  if (!isAuthenticated) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  // Nếu đã đăng nhập -> Hiện App chính
  return (
    <div className="h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 text-gray-900 font-sans overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden relative">

        {activeTab === 'dashboard' && (
          // Dùng wrapper chuyển cảnh để tab Dashboard vào/ra mượt hơn.
          <ScreenTransition className="h-full">
            <Dashboard
              products={products}
              orders={orders}
              onOpenDetail={() => setActiveTab('stats-detail')}
            />
          </ScreenTransition>
        )}

        {activeTab === 'stats-detail' && (
          // Màn chi tiết thống kê có liên kết với Dashboard nên dùng cùng hiệu ứng.
          <ScreenTransition className="h-full">
            <StatsDetail
              products={products}
              orders={orders}
              onBack={() => setActiveTab('dashboard')}
            />
          </ScreenTransition>
        )}

        {activeTab === 'products' && (
          // Mỗi tab đều bọc transition để tránh lặp class cho từng màn hình.
          <ScreenTransition className="h-full">
            <Inventory
              products={products}
              setProducts={setProducts}
              orders={orders}
              setOrders={setOrders}
              settings={settings}
            />
          </ScreenTransition>
        )}

        {activeTab === 'orders' && (
          <ScreenTransition className="h-full">
            <Orders
              products={products}
              setProducts={setProducts}
              orders={orders}
              setOrders={setOrders}
              settings={settings}
              // Truyền hàm để màn Orders có thể ẩn TabBar khi vào chế độ Tạo đơn
              setTabBarVisible={setIsTabBarVisible}
            />
          </ScreenTransition>
        )}

        {activeTab === 'settings' && (
          <ScreenTransition className="h-full">
            <Settings
              products={products}
              orders={orders}
              setProducts={setProducts}
              setOrders={setOrders}
              settings={settings}
              setSettings={setSettings}
              onLogout={handleLogout}
            />
          </ScreenTransition>
        )}
      </div>

      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isVisible={isTabBarVisible}
      />

      {/* Modal xác nhận đăng xuất thay thế confirm */}
      <ConfirmModal
        open={logoutModalOpen}
        title="Đăng xuất khỏi hệ thống?"
        message="Bạn có chắc chắn muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        tone="danger"
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={() => {
          setIsAuthenticated(false);
          sessionStorage.removeItem('tini_auth'); // Xóa phiên làm việc
          setActiveTab('dashboard'); // Reset tab về mặc định
          setLogoutModalOpen(false);
        }}
      />

      {/* CSS Global */}
      <style>{`
        .pb-safe-area { padding-bottom: env(safe-area-inset-bottom); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes slide-down-out { from { transform: translateY(0); } to { transform: translateY(100%); } }
        .animate-slide-down-out { animation: slide-down-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
