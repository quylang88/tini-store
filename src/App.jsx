import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

// --- IMPORT CÁC MÀN HÌNH TỪ THƯ MỤC RIÊNG ---
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Inventory from "./screens/Inventory";
import Orders from "./screens/Orders";
import Settings from "./screens/Settings";
import StatsDetail from "./screens/dashboard/StatsDetail";
import { normalizePurchaseLots } from "./utils/purchaseUtils";

// --- IMPORT COMPONENT CHUNG ---
import TabBar from "./components/TabBar";
import ConfirmModal from "./components/modals/ConfirmModal";
import ScreenTransition from "./components/common/ScreenTransition";
import SplashScreen from "./screens/login/SplashScreen";
import OfflineAlert from "./screens/login/OfflineAlert";
import useImagePreloader from "./hooks/useImagePreloader";
import { exportDataToJSON } from "./utils/backupUtils";

// Định nghĩa thứ tự tab để xác định hướng chuyển cảnh
const TAB_ORDER = {
  dashboard: 0,
  products: 1,
  orders: 2,
  settings: 3,
  "stats-detail": 10, // Coi như màn hình con của dashboard
};

const App = () => {
  // --- 1. QUẢN LÝ TRẠNG THÁI ĐĂNG NHẬP ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("tini_auth") === "true";
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [direction, setDirection] = useState(0); // 1: phải sang trái (push), -1: trái sang phải (pop)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [backupReminderOpen, setBackupReminderOpen] = useState(false);

  // --- 2. KHỞI TẠO DỮ LIỆU TỪ LOCALSTORAGE ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("shop_products_v2");
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map((product) => normalizePurchaseLots(product));
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("shop_orders_v2");
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("shop_settings");
    return saved
      ? JSON.parse(saved)
      : {
          exchangeRate: 170,
          categories: ["Chung", "Mỹ phẩm", "Thực phẩm", "Quần áo"],
        };
  });

  // --- 3. TỰ ĐỘNG LƯU DỮ LIỆU ---
  useEffect(() => {
    try {
      localStorage.setItem("shop_products_v2", JSON.stringify(products));
    } catch (e) {
      console.error("Lỗi lưu sản phẩm:", e);
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem("shop_orders_v2", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("shop_settings", JSON.stringify(settings));
  }, [settings]);

  // --- 4. HÀM XỬ LÝ NAV & AUTH ---
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem("tini_auth", "true");
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const handleBackupNow = React.useCallback(() => {
    const now = new Date().toISOString();
    const newSettings = { ...settings, lastBackupDate: now };
    setSettings(newSettings);
    exportDataToJSON(products, orders, newSettings);
    setBackupReminderOpen(false);
  }, [settings, products, orders]);

  // --- 3b. KIỂM TRA SAO LƯU (AUTO REMINDER / DOWNLOAD) ---
  useEffect(() => {
    if (!isAuthenticated || products.length === 0) return;

    const checkBackupStatus = () => {
      if (sessionStorage.getItem("hasCheckedBackup")) return;

      const lastBackup = settings.lastBackupDate
        ? new Date(settings.lastBackupDate).getTime()
        : 0;
      const now = Date.now();
      const daysSinceBackup = (now - lastBackup) / (1000 * 60 * 60 * 24);

      // Case A: Tự động sao lưu được bật và đã đến hạn
      if (
        settings.autoBackupInterval > 0 &&
        daysSinceBackup >= settings.autoBackupInterval
      ) {
        handleBackupNow();
        sessionStorage.setItem("hasCheckedBackup", "true");
        return;
      }

      // Case B: Không bật tự động, nhưng quá hạn mặc định (7 ngày) -> Hiện nhắc nhở
      const isAutoOff = !settings.autoBackupInterval;
      if (isAutoOff && daysSinceBackup > 7) {
        setBackupReminderOpen(true);
        sessionStorage.setItem("hasCheckedBackup", "true");
      }
    };

    const timer = setTimeout(checkBackupStatus, 2000);
    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    products.length,
    settings.lastBackupDate,
    settings.autoBackupInterval,
    handleBackupNow,
  ]);

  // Hàm chuyển tab có tính toán hướng animation
  const handleTabChange = (newTab) => {
    const currentOrder = TAB_ORDER[activeTab] ?? 0;
    const newOrder = TAB_ORDER[newTab] ?? 0;

    if (newTab === "stats-detail") {
      setDirection(1); // Push
    } else if (activeTab === "stats-detail") {
      setDirection(-1); // Pop
    } else {
      setDirection(newOrder > currentOrder ? 1 : -1);
    }
    setActiveTab(newTab);

    // Cập nhật hiển thị TabBar dựa trên tab mới
    if (newTab === "stats-detail") {
      setIsTabBarVisible(false);
    } else {
      setIsTabBarVisible(true);
    }
  };

  // --- 5. LOGIC HIỂN THỊ TABBAR ---
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  // --- 5b. PRELOAD TÀI NGUYÊN DASHBOARD ---
  const {
    isLoaded: appReady,
    showWarning,
    handleForceContinue: originalHandleForceContinue,
  } = useImagePreloader("/tiny-shop-transparent.png", isAuthenticated);

  const [offlineAcknowledged, setOfflineAcknowledged] = useState(false);

  const handleForceContinue = () => {
    if (showWarning) {
      setOfflineAcknowledged(true);
    }
    originalHandleForceContinue();
  };

  // --- 6. RENDERING ---
  if (!isAuthenticated) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  if (!appReady) {
    return (
      <SplashScreen showWarning={showWarning} onConfirm={handleForceContinue} />
    );
  }

  return (
    <div className="h-screen bg-rose-50 text-gray-900 font-sans overflow-hidden flex flex-col pt-[env(safe-area-inset-top)]">
      <OfflineAlert initialAcknowledged={offlineAcknowledged} />
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          {activeTab === "dashboard" && (
            <ScreenTransition
              key="dashboard"
              custom={direction}
              className="h-full"
            >
              <Dashboard
                products={products}
                orders={orders}
                onOpenDetail={() => handleTabChange("stats-detail")}
              />
            </ScreenTransition>
          )}

          {activeTab === "stats-detail" && (
            <ScreenTransition
              key="stats-detail"
              custom={direction}
              className="h-full"
              onSwipeBack={() => handleTabChange("dashboard")}
            >
              <StatsDetail
                products={products}
                orders={orders}
                onBack={() => handleTabChange("dashboard")}
              />
            </ScreenTransition>
          )}

          {activeTab === "products" && (
            <ScreenTransition
              key="products"
              custom={direction}
              className="h-full"
            >
              <Inventory
                products={products}
                setProducts={setProducts}
                orders={orders}
                setOrders={setOrders}
                settings={settings}
                setTabBarVisible={setIsTabBarVisible}
              />
            </ScreenTransition>
          )}

          {activeTab === "orders" && (
            <ScreenTransition
              key="orders"
              custom={direction}
              className="h-full"
            >
              <Orders
                products={products}
                setProducts={setProducts}
                orders={orders}
                setOrders={setOrders}
                settings={settings}
                setTabBarVisible={setIsTabBarVisible}
              />
            </ScreenTransition>
          )}

          {activeTab === "settings" && (
            <ScreenTransition
              key="settings"
              custom={direction}
              className="h-full"
            >
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
        </AnimatePresence>
      </div>

      <TabBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isVisible={isTabBarVisible}
      />

      <ConfirmModal
        open={logoutModalOpen}
        title="Đăng xuất khỏi hệ thống?"
        message="Bạn có chắc chắn muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        tone="danger"
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={() => {
          setIsAuthenticated(false);
          sessionStorage.removeItem("tini_auth");
          handleTabChange("dashboard");
          setLogoutModalOpen(false);
        }}
      />

      <ConfirmModal
        open={backupReminderOpen}
        title="Sao lưu dữ liệu?"
        message="Bạn chưa sao lưu dữ liệu trong vài ngày qua. Hãy tải về máy để tránh mất mát khi xoá app."
        confirmLabel="Sao lưu ngay"
        cancelLabel="Để sau"
        tone="info"
        onCancel={() => setBackupReminderOpen(false)}
        onConfirm={handleBackupNow}
      />
    </div>
  );
};

export default App;
