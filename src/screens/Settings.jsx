import React from "react";
import { Download, Upload, Plus, RefreshCw, X, LogOut } from "lucide-react";
import { formatInputNumber, sanitizeNumberInput } from "../utils/helpers";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ErrorModal from "../components/modals/ErrorModal";
import InfoModal from "../components/modals/InfoModal";
import SettingsSection from "./settings/SettingsSection";
import useSettingsLogic from "../hooks/useSettingsLogic";
import Button from "../components/common/Button";
import AppHeader from "../components/common/AppHeader";

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
  } = useSettingsLogic({
    products,
    orders,
    setProducts,
    setOrders,
    settings,
    setSettings,
  });

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
            <label className="block text-xs font-bold text-amber-700 uppercase mb-2">
              Tỷ giá nhập kho (JPY ➔ VND)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  inputMode="numeric"
                  className="w-full border border-gray-200 rounded-lg pl-3 pr-12 py-3 outline-none focus:border-rose-400 font-medium text-lg text-amber-900"
                  value={formatInputNumber(settings.exchangeRate)}
                  onChange={(e) => {
                    const rawValue = sanitizeNumberInput(e.target.value);
                    const nextValue = rawValue === "" ? 0 : Number(rawValue);
                    saveSettings({ ...settings, exchangeRate: nextValue });
                  }}
                  placeholder="Ví dụ: 175"
                />
                <span className="absolute right-3 top-3.5 text-amber-500 text-sm font-bold">
                  VND
                </span>
              </div>
              <button
                onClick={() => {
                  if (isFetchingRate) return;
                  fetchOnlineRate();
                }}
                disabled={isFetchingRate}
                className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg font-medium text-sm flex flex-col items-center justify-center min-w-[80px] active:bg-rose-100 transition"
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
            <p className="text-xs text-amber-600 mt-2">
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
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-rose-400 text-sm text-amber-900"
              placeholder="Nhập tên danh mục mới..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              className="bg-rose-500 text-white w-12 h-10 rounded-lg flex items-center justify-center active:bg-rose-600 active:scale-95 transition"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.categories.map((cat) => (
              <div
                key={cat}
                className="bg-gray-100 text-amber-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border border-gray-200"
              >
                {cat}
                {cat !== "Chung" && (
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-amber-500 active:text-red-500 p-0.5 rounded-full active:bg-gray-200 transition"
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
          <p className="text-sm text-amber-700">
            Dữ liệu hiện tại chỉ lưu trên trình duyệt này. Hãy tải về máy thường
            xuyên để tránh mất dữ liệu.
          </p>

          {/* Tùy chọn Tự động sao lưu */}
          <div className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100">
            <span className="text-sm font-medium text-amber-900">
              Tự động sao lưu
            </span>
            <select
              className="bg-white border border-amber-200 text-amber-800 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-amber-400"
              value={settings.autoBackupInterval || 0}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                saveSettings({ ...settings, autoBackupInterval: value });
              }}
            >
              <option value={0}>Tắt (Thủ công)</option>
              <option value={1}>Mỗi ngày</option>
              <option value={3}>Mỗi 3 ngày</option>
              <option value={7}>Mỗi tuần</option>
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
            >
              <Download size={20} /> Tải Dữ Liệu Về Máy (Backup)
            </button>
            {settings.lastBackupDate && (
              <p className="text-xs text-center text-amber-600 font-medium">
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
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-stone-400">hoặc</span>
            </div>
          </div>

          <div className="relative group">
            <input
              type="file"
              onChange={importData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept=".json"
            />
            <button className="w-full flex items-center justify-center gap-2 bg-white text-stone-600 py-3 rounded-xl font-bold active:bg-stone-50 transition border border-stone-200 shadow-sm hover:text-amber-600 hover:border-amber-200">
              <Upload size={20} /> Khôi Phục Dữ Liệu (Restore)
            </button>
          </div>
        </SettingsSection>

        {/* 4. Nút Đăng Xuất */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 mt-4 bg-stone-100 text-stone-500 py-3 rounded-xl font-bold active:bg-stone-200 transition"
        >
          <LogOut size={20} /> Đăng Xuất
        </button>

        {/* Footer info */}
        <div className="text-center text-xs text-amber-500 pb-4">
          Phiên bản 3.0 - Tiny Shop
          <br />
          Dữ liệu được lưu trữ cục bộ (Local Storage)
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
