import React from 'react';
import { Download, Upload, Plus, RefreshCw, X, LogOut } from 'lucide-react';
import { formatInputNumber, sanitizeNumberInput } from '../utils/helpers';
import ConfirmModal from '../components/modals/ConfirmModal';
import useSettingsLogic from '../hooks/useSettingsLogic';

const Settings = ({
  products,
  orders,
  setProducts,
  setOrders,
  setInboundShipments,
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
    setInboundShipments,
    settings,
    setSettings,
  });

  return (
    <>
      <div className="p-4 space-y-6 overflow-y-auto pb-24 h-full bg-transparent">
        <img
          src="/tiny-shop-transparent.png"
          alt="Tiny Shop"
          className="h-12 w-auto object-contain"
        />

        {/* 1. Cấu hình Tiền tệ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 font-bold text-amber-800 flex items-center gap-2">
            <RefreshCw size={18} className="text-blue-500" />
            Cấu hình Tiền tệ
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-700 uppercase mb-2">
                Tỷ giá nhập hàng (JPY ➔ VND)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    inputMode="numeric"
                    className="w-full border border-gray-200 rounded-lg pl-3 pr-12 py-3 outline-none focus:border-rose-400 font-medium text-lg text-amber-900"
                    value={formatInputNumber(settings.exchangeRate)}
                    onChange={(e) => {
                      const rawValue = sanitizeNumberInput(e.target.value);
                      const nextValue = rawValue === '' ? 0 : Number(rawValue);
                      saveSettings({ ...settings, exchangeRate: nextValue });
                    }}
                    placeholder="Ví dụ: 175"
                  />
                  <span className="absolute right-3 top-3.5 text-amber-500 text-sm font-bold">VND</span>
                </div>
                <button
                  onClick={() => {
                    if (isFetchingRate) return;
                    fetchOnlineRate();
                  }}
                  disabled={isFetchingRate}
                  className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg font-medium text-sm flex flex-col items-center justify-center min-w-[80px] hover:bg-rose-100 transition"
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
                * Tỷ giá này sẽ được tự động điền khi bạn nhập hàng mới. Bạn nên nhập tỷ giá thực tế mua vào.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Quản lý Danh mục */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 font-bold text-amber-800 flex items-center gap-2">
            <Plus size={18} className="text-green-500" />
            Danh mục sản phẩm
          </div>
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-rose-400 text-sm text-amber-900"
                placeholder="Nhập tên danh mục mới..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                className="bg-rose-500 text-white w-12 h-10 rounded-lg flex items-center justify-center hover:bg-rose-600 active:scale-95 transition"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.categories.map(cat => (
                <div key={cat} className="bg-gray-100 text-amber-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 border border-gray-200">
                  {cat}
                  {cat !== 'Chung' && (
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-amber-500 hover:text-red-500 p-0.5 rounded-full hover:bg-gray-200 transition"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Sao lưu & Khôi phục */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 font-bold text-amber-800 flex items-center gap-2">
            <Download size={18} className="text-orange-500" />
            Sao lưu & Khôi phục
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-amber-700">
              Dữ liệu hiện tại chỉ lưu trên trình duyệt này. Hãy tải về máy thường xuyên để tránh mất dữ liệu.
            </p>

            <button
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-700 py-3 rounded-xl font-bold hover:bg-rose-100 transition border border-rose-100"
            >
              <Download size={20} /> Tải Dữ Liệu Về Máy (Backup)
            </button>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-amber-500">hoặc</span>
              </div>
            </div>

            <div className="relative group">
              <input
                type="file"
                onChange={importData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".json"
              />
              <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-amber-800 py-3 rounded-xl font-bold group-hover:bg-gray-200 transition border border-gray-200">
                <Upload size={20} /> Khôi Phục Dữ Liệu (Restore)
              </button>
            </div>
          </div>
        </div>

        {/* 4. Nút Đăng Xuất */}
        <button
          onClick={onLogout}
          className="w-full bg-red-50 text-red-600 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition active:scale-95 border border-red-100 mt-4"
        >
          <LogOut size={20} /> Đăng Xuất
        </button>

        {/* Footer info */}
        <div className="text-center text-xs text-amber-500 pb-4">
          Phiên bản 3.0 - Tiny Shop<br />
          Dữ liệu được lưu trữ cục bộ (Local Storage)
        </div>
      </div>

      {/* Modal xác nhận dùng chung cho thao tác xoá/khôi phục */}
      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        tone={confirmModal?.tone}
        onCancel={() => {
          setConfirmModal(null);
        }}
        onConfirm={() => {
          confirmModal?.onConfirm?.();
          setConfirmModal(null);
        }}
      />
    </>
  )
}

export default Settings;
