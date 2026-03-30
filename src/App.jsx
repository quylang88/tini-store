import React, { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

// --- IMPORT CÁC MÀN HÌNH TỪ THƯ MỤC RIÊNG ---
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Inventory from "./screens/Inventory";
import Orders from "./screens/Orders";
import Assistant from "./screens/Assistant";
import Settings from "./screens/Settings";
import StatsDetail from "./screens/dashboard/StatsDetail";

// --- IMPORT COMPONENT CHUNG ---
import TabBar from "./components/TabBar";
import FloatingActionButton from "./components/button/FloatingActionButton";
import ConfirmModal from "./components/modals/ConfirmModal";
import ScreenTransition from "./components/common/ScreenTransition";
import SplashScreen from "./screens/login/SplashScreen";
import OfflineAlert from "./screens/login/OfflineAlert";

// --- IMPORT HOOKS ---
import useDailyGreeting from "./hooks/core/useDailyGreeting";
import { getRandomGreeting } from "./services/ai/chatHelpers";
import useAppAuth from "./hooks/app/useAppAuth";
import useAppData from "./hooks/app/useAppData";
import useAppNavigation from "./hooks/app/useAppNavigation";
import useBackupLogic from "./hooks/app/useBackupLogic";
import useAppInit from "./hooks/app/useAppInit";

const App = () => {
  // --- 1. AUTHENTICATION & INIT ---
  const {
    isAuthenticated,
    logoutModalOpen,
    handleLoginSuccess,
    handleLogout,
    closeLogoutModal,
    confirmLogout,
  } = useAppAuth();

  const { appReady, showWarning, offlineAcknowledged, handleForceContinue } =
    useAppInit(isAuthenticated);

  // --- 2. DATA MANAGEMENT ---
  const {
    isDataLoaded,
    products,
    setProducts,
    orders,
    setOrders,
    settings,
    setSettings,
    customers,
    setCustomers,
    chatSummary,
    setChatSummary,
    pendingBuffer,
    setPendingBuffer,
    resetData,
  } = useAppData(isAuthenticated);

  // --- 3. NAVIGATION ---
  const {
    activeTab,
    direction,
    handleTabChange,
    isTabBarVisible,
    setIsTabBarVisible,
  } = useAppNavigation();

  // --- 4. BACKUP LOGIC ---
  const { backupReminderOpen, setBackupReminderOpen, handleBackupNow } =
    useBackupLogic({
      isAuthenticated,
      isDataLoaded,
      products,
      orders,
      settings,
      setSettings,
      customers,
      chatSummary,
    });

  // --- 5. UI STATE (ASSISTANT & OTHERS) ---
  const [chatMessages, setChatMessages] = useState(() => [getRandomGreeting()]);
  const [isChatTyping, setIsChatTyping] = useState(false);

  // FAB State - Global management to prevent jumping between tabs
  const [fabConfig, setFabConfig] = useState({
    isVisible: false,
    onClick: null,
    icon: Plus,
    label: "",
    color: "rose",
  });

  const updateFab = useCallback((config) => {
    setFabConfig((prev) => ({ ...prev, ...config }));
  }, []);

  // Wrap tab change to reset FAB visibility
  const onTabChange = (tab) => {
    setFabConfig((prev) => ({ ...prev, isVisible: false }));
    handleTabChange(tab);
  };

  // Daily Greeting
  const updateLastGreetingDate = useCallback(
    (dateStr) => {
      setSettings((prev) => ({ ...prev, lastGreetingDate: dateStr }));
    },
    [setSettings],
  );

  useDailyGreeting(
    isAuthenticated,
    settings.lastGreetingDate,
    updateLastGreetingDate,
  );

  // --- 6. RENDERING ---
  if (!isAuthenticated) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  // Chỉ hiển thị app khi đã load xong ảnh splash VÀ load xong dữ liệu từ IndexedDB
  if (!appReady || !isDataLoaded) {
    return (
      <SplashScreen showWarning={showWarning} onConfirm={handleForceContinue} />
    );
  }

  return (
    <div className="h-[100dvh] bg-rose-50 text-gray-900 font-sans overflow-hidden flex flex-col">
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
                onOpenDetail={() => onTabChange("stats-detail")}
                settings={settings}
                updateFab={updateFab}
                isActive={activeTab === "dashboard"}
              />
            </ScreenTransition>
          )}

          {activeTab === "stats-detail" && (
            <ScreenTransition
              key="stats-detail"
              custom={direction}
              className="h-full"
              onSwipeBack={() => onTabChange("dashboard")}
            >
              <StatsDetail
                products={products}
                orders={orders}
                onBack={() => onTabChange("dashboard")}
                updateFab={updateFab}
                isActive={activeTab === "stats-detail"}
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
                updateFab={updateFab}
                isActive={activeTab === "products"}
              />
            </ScreenTransition>
          )}

          {activeTab === "assistant" && (
            <motion.div
              key="assistant"
              className="absolute top-0 left-0 w-full h-full z-20"
              initial={{
                clipPath: "circle(0px at 50% calc(100% - 25px))",
              }}
              animate={{
                clipPath: "circle(150% at 50% calc(100% - 25px))",
              }}
              transition={{
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Assistant
                products={products}
                setProducts={setProducts}
                orders={orders}
                setOrders={setOrders}
                settings={settings}
                messages={chatMessages}
                setMessages={setChatMessages}
                isTyping={isChatTyping}
                setIsTyping={setIsChatTyping}
                setTabBarVisible={setIsTabBarVisible}
                chatSummary={chatSummary}
                setChatSummary={setChatSummary}
                pendingBuffer={pendingBuffer}
                setPendingBuffer={setPendingBuffer}
                themeId={settings.themeId}
                setThemeId={(id) =>
                  setSettings((prev) => ({ ...prev, themeId: id }))
                }
                updateFab={updateFab}
                isActive={activeTab === "assistant"}
              />
            </motion.div>
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
                customers={customers}
                setCustomers={setCustomers}
                updateFab={updateFab}
                isActive={activeTab === "orders"}
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
                customers={customers}
                setCustomers={setCustomers}
                chatSummary={chatSummary}
                setChatSummary={setChatSummary}
                onLogout={handleLogout}
                updateFab={updateFab}
                isActive={activeTab === "settings"}
              />
            </ScreenTransition>
          )}
        </AnimatePresence>
      </div>

      <TabBar
        activeTab={activeTab}
        setActiveTab={onTabChange}
        isVisible={isTabBarVisible}
      />

      <AnimatePresence>
        {fabConfig.isVisible && (
          <motion.div
            layout
            layoutId="floating-action-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+90px)] z-30"
          >
            <FloatingActionButton
              onClick={fabConfig.onClick}
              ariaLabel={fabConfig.label}
              icon={fabConfig.icon}
              color={fabConfig.color}
              className="!static"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={logoutModalOpen}
        title="Đăng xuất khỏi hệ thống?"
        message="Bạn có chắc chắn muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        tone="danger"
        onCancel={closeLogoutModal}
        onConfirm={() => {
          confirmLogout(() => {
            onTabChange("dashboard");
            resetData();
          });
        }}
      />

      <ConfirmModal
        open={backupReminderOpen}
        title="Sao lưu dữ liệu?"
        message="Bạn chưa sao lưu dữ liệu trong vài ngày qua. Hãy tải về máy để tránh mất dữ liệu."
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
