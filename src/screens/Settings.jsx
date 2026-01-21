import React from "react";
import {
  Download,
  Upload,
  Plus,
  RefreshCw,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  formatInputNumber,
  sanitizeNumberInput,
} from "../utils/formatters/formatUtils";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import InfoModal from "../components/modals/InfoModal";
import SettingsSection from "./settings/SettingsSection";
import useSettingsLogic from "../hooks/settings/useSettingsLogic";
import AppHeader from "../components/common/AppHeader";
import AnimatedFilterTabs from "../components/common/AnimatedFilterTabs";
import { AnimatePresence, motion } from "framer-motion";

const Settings = ({
  products,
  orders,
  setProducts,
  setOrders,
  settings,
  setSettings,
  onLogout,
}) => {
  const {
    newCategory,
    setNewCategory,
    isFetchingRate,
    confirmModal,
    setConfirmModal,
    noticeModal,
    setNoticeModal,
    infoModal,
    setInfoModal,
    saveSettings,
    handleAddCategory,
    handleDeleteCategory,
    fetchOnlineRate,
    exportData,
    importData,
    handleAutoBackupChange,
  } = useSettingsLogic({
    products,
    orders,
    setProducts,
    setOrders,
    settings,
    setSettings,
  });

  const isAutoBackupOn = settings.autoBackupInterval > 0;

  const [isScrolled, setIsScrolled] = React.useState(false);

  const handleScroll = (e) => {
    const currentScrollTop = e.target.scrollTop;
    setIsScrolled(currentScrollTop > 10);
  };

  return (
    <div className="relative h-full bg-transparent">
      <AppHeader isScrolled={isScrolled} />

      <div
        className="h-full overflow-y-auto min-h-0 p-4 pt-[80px] space-y-6 pb-24"
        onScroll={handleScroll}
      >
        {/* 1. Cấu hình Tiền tệ */}
        <SettingsSection
          title="Cấu hình Tiền tệ"
          icon={RefreshCw}
          iconClassName="text-blue-500"
        >
          <div>
            <label className="block text-xs font-bold text-rose-700 uppercase mb-2">
              Tỷ giá nhập kho (JPY ➔ VND)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  inputMode="numeric"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-12 py-3 outline-none focus:border-rose-400 font-medium text-lg text-gray-900"
                  value={formatInputNumber(settings.exchangeRate)}
                  onChange={(e) => {
                    const rawValue = sanitizeNumberInput(e.target.value);
                    const nextValue = rawValue === "" ? 0 : Number(rawValue);
                    saveSettings({ ...settings, exchangeRate: nextValue });
                  }}
                  placeholder="Ví dụ: 175"
                />
                <span className="absolute right-3 top-3.5 text-rose-500 text-sm font-bold">
                  VND
                </span>
              </div>
              <button
                onClick={() => {
                  if (isFetchingRate) return;
                  fetchOnlineRate();
                }}
                disabled={isFetchingRate}
                className="bg-rose-100 text-rose-600 px-4 py-1 rounded-lg font-medium text-sm flex flex-col items-center justify-center min-w-[80px] active:bg-rose-100 active:scale-95 border border-rose-300 transition"
              >
                {isFetchingRate ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>
                    <RefreshCw size={18} className="mb-1" />
                    <span>Online</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-rose-600 mt-2">
              * Tỷ giá này sẽ được tự động điền khi bạn nhập kho mới. Bạn nên
              nhập tỷ giá thực tế mua vào.
            </p>
          </div>
        </SettingsSection>

        {/* 2. Quản lý Danh mục */}
        <SettingsSection
          title="Danh mục sản phẩm"
          icon={Plus}
          iconClassName="text-green-500"
        >
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-rose-400 text-sm text-gray-900"
              placeholder="Nhập tên danh mục mới..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              className="bg-rose-500 text-white w-12 h-10 rounded-lg flex items-center justify-center active:bg-rose-400 active:scale-95 transition"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.categories.map((cat) => (
              <div
                key={cat}
                className="bg-rose-50 text-rose-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border border-rose-200"
              >
                {cat}
                {cat !== "Chung" && (
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-rose-500 active:text-red-500 p-0.5 rounded-full active:bg-gray-200 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </SettingsSection>

        {/* 3. Sao lưu & Khôi phục */}
        <SettingsSection
          title="Sao lưu & Khôi phục"
          icon={Download}
          iconClassName="text-orange-500"
        >
          {/* Tùy chọn Tự động sao lưu */}
          <div className="bg-amber-100 p-3 rounded-lg border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-rose-900">
                Tự động sao lưu
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isAutoBackupOn}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    handleAutoBackupChange(isChecked ? 3 : 0);
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            <AnimatePresence>
              {isAutoBackupOn && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <AnimatedFilterTabs
                    tabs={[
                      { key: 3, label: "3 ngày" },
                      { key: 7, label: "7 ngày" },
                    ]}
                    activeTab={settings.autoBackupInterval}
                    onChange={(key) => handleAutoBackupChange(key)}
                    className="justify-end"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 bg-rose-100 text-rose-600 py-3 rounded-xl font-bold shadow-sm active:bg-rose-200 active:scale-95 border border-rose-300 transition-all"
            >
              <Download size={20} /> Backup Dữ Liệu
            </button>
            {settings.lastBackupDate && (
              <p className="text-xs text-center text-rose-600 font-medium">
                Lần cuối:{" "}
                {new Date(settings.lastBackupDate).toLocaleDateString("vi-VN")}{" "}
                {new Date(settings.lastBackupDate).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rose-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-amber-50 text-rose-500">hoặc</span>
            </div>
          </div>

          <label className="w-full flex items-center justify-center gap-2 bg-white text-stone-600 py-3 rounded-xl font-bold shadow-sm active:bg-stone-100 active:scale-95 border border-stone-200 transition-all cursor-pointer">
            <input
              type="file"
              onChange={importData}
              className="hidden"
              accept=".json"
            />
            <Upload size={20} /> Khôi Phục Dữ Liệu
          </label>
        </SettingsSection>

        {/* 4. Nút Đăng Xuất */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 mt-4 bg-rose-500 text-white py-3 rounded-xl font-bold active:scale-95 active:bg-rose-400 transition-all"
        >
          <LogOut size={20} /> Đăng Xuất
        </button>

        {/* Footer info */}
        <div className="text-center text-xs text-rose-400 pb-4">
          Phiên bản 15.6 - Tiny Shop
          <br />
          Được phát triển bởi Quý Lăng &copy; 2026
        </div>
      </div>

      {/* Modal xác nhận dùng chung cho thao tác xoá/khôi phục */}
      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => {
          setConfirmModal(null);
        }}
      />

      {/* Modal cảnh báo nhẹ cho các lỗi nhập liệu trong màn hình cài đặt */}
      <ErrorModal
        open={Boolean(noticeModal)}
        title={noticeModal?.title}
        message={noticeModal?.message}
        onClose={() => setNoticeModal(null)}
      />

      {/* Modal cập nhật tỷ giá online chỉ cần chạm ra ngoài để đóng */}
      <InfoModal
        open={Boolean(infoModal)}
        title={infoModal?.title}
        message={infoModal?.message}
        onClose={() => setInfoModal(null)}
      />
    </div>
  );
};

export default Settings;
