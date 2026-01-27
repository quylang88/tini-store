import React from "react";
import {
  formatInputNumber,
  formatNumber,
} from "../../utils/formatters/formatUtils";
import {
  getWarehouseLabel,
  getWarehouses,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/button/Button";
import useModalCache from "../../hooks/ui/useModalCache";
import ProductIdentityForm from "./ProductIdentityForm";
import MonthYearPickerInput from "../common/MonthYearPickerInput";

const ProductModal = ({
  isOpen,
  editingProduct,
  editingLotId,
  formData,
  setFormData,
  settings,
  nameSuggestions,
  onSelectExistingProduct,
  onClose,
  onSave,
  onShowScanner,
  onImageSelect,
  onCurrencyChange,
  onMoneyChange,
  onDecimalChange,
  onShippingMethodChange,
  categories,
  highlightOps,
}) => {
  // Lấy logic highlight một cách an toàn
  const getHighlightProps = highlightOps?.getHighlightProps || (() => ({}));
  const isHighlighted = highlightOps?.isHighlighted || (() => false);
  const highlightClass = highlightOps?.highlightClass || "";

  // Tính toán lợi nhuận
  const shippingWeight = Number(formData.shippingWeightKg) || 0;
  const exchangeRateValue = Number(settings?.exchangeRate) || 0;
  const shippingFeeJpy =
    formData.shippingMethod === "jp" ? Math.round(shippingWeight * 900) : 0;
  const shippingFeeVnd =
    formData.shippingMethod === "jp"
      ? Math.round(shippingFeeJpy * exchangeRateValue)
      : Number(formData.shippingFeeVnd) || 0;
  const purchaseLots = editingProduct?.purchaseLots || [];
  const hasProfitData =
    Number(formData.price) > 0 && Number(formData.cost) + shippingFeeVnd > 0;
  const finalProfit =
    (Number(formData.price) || 0) -
    (Number(formData.cost) || 0) -
    shippingFeeVnd;

  const isEditingLot = Boolean(editingProduct && editingLotId);
  // Nếu đang editingProduct mà không phải editingLot (edit history item) thì là Add Restock
  const isAddRestockMode = Boolean(editingProduct && !editingLotId);

  // Cache tiêu đề để không bị đổi khi đang chạy animation đóng modal
  const modalTitle = useModalCache(
    isEditingLot
      ? "Sửa Lần Nhập Hàng"
      : isAddRestockMode
        ? "Thêm Lần Nhập Hàng"
        : "Thêm Mới",
    isOpen,
  );

  // Footer chứa 2 nút hành động (Hủy / Lưu) theo yêu cầu modal dạng Action
  const footer = (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={onClose}>
        Huỷ
      </Button>
      <Button variant="primary" onClick={onSave}>
        Lưu
      </Button>
    </div>
  );

  return (
    <SheetModal
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      showCloseIcon={true} // Modal nhập liệu có nút X
      footer={footer}
    >
      <div className="space-y-4">
        {/* TÁI CẤU TRÚC: Form định danh sản phẩm dùng chung */}
        <ProductIdentityForm
          // Data
          image={formData.image}
          barcode={formData.barcode}
          category={formData.category}
          name={formData.name}
          // Handlers
          onImageChange={onImageSelect} // ProductModal nhận file object, ProductIdentityForm truyền file object
          onBarcodeChange={(val) => setFormData({ ...formData, barcode: val })}
          onCategoryChange={(val) =>
            setFormData({ ...formData, category: val })
          }
          onNameChange={(val) => setFormData({ ...formData, name: val })}
          // Cấu hình
          categories={categories}
          onShowScanner={onShowScanner}
          disabled={Boolean(editingProduct)} // Vô hiệu hóa các trường định danh nếu đang sửa sản phẩm có sẵn
          allowImageUpload={!editingProduct} // Ẩn nút tải ảnh nếu đang sửa sản phẩm có sẵn
          nameSuggestions={nameSuggestions}
          onSelectExistingProduct={onSelectExistingProduct}
          inputColorClass="text-gray-900"
          highlightOps={highlightOps}
        />

        {/* Khu vực giá nhập: cho chọn Yên hoặc VNĐ */}
        <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-rose-800 uppercase">
              Giá nhập
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onCurrencyChange("JPY")}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  formData.costCurrency === "JPY"
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
                }`}
              >
                Theo Yên
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange("VND")}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  formData.costCurrency === "VND"
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
                }`}
              >
                Theo VNĐ
              </button>
            </div>
          </div>

          <div className="relative">
            {/* Form nhập theo Yên */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                formData.costCurrency === "JPY"
                  ? "opacity-100 translate-x-0 relative z-10"
                  : "opacity-0 -translate-x-4 absolute inset-0 -z-10 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-rose-800 uppercase">
                    Giá nhập (Yên)
                  </label>
                  <div className="relative">
                    <span className="absolute left-0 top-2 text-rose-500">
                      ¥
                    </span>
                    <input
                      inputMode="numeric"
                      className={`w-full bg-transparent border-b border-rose-100 py-2 pl-4 focus:border-rose-400 outline-none text-gray-900 font-bold ${
                        isHighlighted("costJPY") ? highlightClass : ""
                      }`}
                      value={formatInputNumber(formData.costJPY)}
                      onChange={onMoneyChange("costJPY")}
                      placeholder="0"
                      tabIndex={formData.costCurrency === "JPY" ? 0 : -1}
                      {...getHighlightProps("costJPY", formData.costJPY)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-rose-800 uppercase">
                    Tỷ giá
                  </label>
                  <input
                    inputMode="numeric"
                    className="w-full bg-transparent border-b border-rose-100 py-2 focus:border-rose-400 outline-none text-gray-900 text-right"
                    value={formatInputNumber(formData.exchangeRate)}
                    onChange={onMoneyChange("exchangeRate")}
                    placeholder="0"
                    tabIndex={formData.costCurrency === "JPY" ? 0 : -1}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                = {formatNumber(formData.cost)} VNĐ (Vốn)
              </div>
            </div>

            {/* Form nhập theo VNĐ */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                formData.costCurrency === "VND"
                  ? "opacity-100 translate-x-0 relative z-10"
                  : "opacity-0 translate-x-4 absolute inset-0 -z-10 pointer-events-none"
              }`}
            >
              <div className="relative">
                <span className="absolute left-0 top-2 text-rose-500">đ</span>
                <input
                  inputMode="numeric"
                  className={`w-full bg-transparent border-b border-rose-100 py-2 pl-4 focus:border-rose-400 outline-none text-gray-900 font-bold ${
                    isHighlighted("costVNDInput") ? highlightClass : ""
                  }`}
                  value={formatInputNumber(formData.costVNDInput)}
                  onChange={onMoneyChange("costVNDInput")}
                  placeholder="0"
                  tabIndex={formData.costCurrency === "VND" ? 0 : -1}
                  {...getHighlightProps("costVNDInput", formData.costVNDInput)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Phí gửi */}
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-rose-800 uppercase">
              Phí gửi
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onShippingMethodChange("jp")}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  formData.shippingMethod === "jp"
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
                }`}
              >
                Mua tại Nhật
              </button>
              <button
                type="button"
                onClick={() => onShippingMethodChange("vn")}
                className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                  formData.shippingMethod === "vn"
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
                }`}
              >
                Mua tại VN
              </button>
            </div>
          </div>

          <div className="relative">
            {/* Form phí gửi Nhật */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                formData.shippingMethod === "jp"
                  ? "opacity-100 translate-x-0 relative z-10"
                  : "opacity-0 -translate-x-4 absolute inset-0 -z-10 pointer-events-none"
              }`}
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-rose-800 uppercase">
                  Nhập cân (kg)
                </label>
                <input
                  inputMode="decimal"
                  lang="en"
                  className={`w-full bg-transparent border-b border-rose-100 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold ${
                    isHighlighted("shippingWeightKg") ? highlightClass : ""
                  }`}
                  value={formData.shippingWeightKg}
                  onChange={onDecimalChange("shippingWeightKg")}
                  placeholder="0"
                  tabIndex={formData.shippingMethod === "jp" ? 0 : -1}
                  {...getHighlightProps(
                    "shippingWeightKg",
                    formData.shippingWeightKg,
                  )}
                />
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>
                    Phí gửi: {formatNumber(shippingFeeJpy)}¥ (~
                    {formatNumber(shippingFeeVnd)}đ)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    900 yên / 1kg
                  </span>
                </div>
              </div>
            </div>

            {/* Form phí gửi Việt Nam */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                formData.shippingMethod === "vn"
                  ? "opacity-100 translate-x-0 relative z-10"
                  : "opacity-0 translate-x-4 absolute inset-0 -z-10 pointer-events-none"
              }`}
            >
              <div>
                <label className="text-[10px] font-bold text-rose-800 uppercase">
                  Phí gửi (VNĐ)
                </label>
                <input
                  inputMode="numeric"
                  className="w-full bg-transparent border-b border-rose-100 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold"
                  value={formatInputNumber(formData.shippingFeeVndInput)}
                  onChange={onMoneyChange("shippingFeeVndInput")}
                  placeholder="0"
                  tabIndex={formData.shippingMethod === "vn" ? 0 : -1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tồn kho nhập vào */}
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-rose-800 uppercase">
              Tồn kho nhập về
            </div>
            <div className="flex gap-2">
              {getWarehouses().map((warehouse) => (
                <button
                  key={warehouse.key}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, warehouse: warehouse.key })
                  }
                  className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                    formData.warehouse === resolveWarehouseKey(warehouse.key)
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-transparent text-rose-700 border-rose-200 active:border-rose-400"
                  }`}
                >
                  {warehouse.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-rose-800 uppercase">
                Số lượng
              </label>
              <input
                type="number"
                className={`w-full border-b border-rose-100 bg-transparent py-2 focus:border-rose-400 outline-none text-gray-900 font-bold text-lg ${
                  isHighlighted("quantity") ? highlightClass : ""
                }`}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="0"
                {...getHighlightProps("quantity", formData.quantity)}
              />
            </div>
            <div />
          </div>
        </div>

        {/* Hạn sử dụng */}
        <div>
          <label className="text-xs font-bold text-rose-700 uppercase">
            Hạn sử dụng
          </label>
          <MonthYearPickerInput
            value={formData.expiryDate || ""}
            onChange={(val) => setFormData({ ...formData, expiryDate: val })}
            placeholder="Chọn tháng/năm..."
          />
        </div>

        {/* Giá bán + Lợi nhuận */}
        <div className="grid grid-cols-2 gap-3 items-start">
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-bold text-rose-700 uppercase">
              Giá bán (VNĐ)
            </label>
            <input
              inputMode="numeric"
              className={`w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold text-lg disabled:text-gray-500 ${
                isHighlighted("price") ? highlightClass : ""
              }`}
              value={formatInputNumber(formData.price)}
              onChange={onMoneyChange("price")}
              placeholder="0"
              disabled={isEditingLot}
              {...getHighlightProps("price", formData.price)}
            />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-bold text-emerald-700 uppercase">
              Lợi nhuận (VNĐ)
            </label>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <div className="text-lg font-bold text-emerald-700">
                {hasProfitData ? formatNumber(finalProfit) : "0"}
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê giá nhập đang còn */}
        {purchaseLots.length > 0 && !isEditingLot && (
          <div className="bg-white border border-rose-100 rounded-xl p-3 space-y-2">
            <div className="text-[10px] font-bold text-rose-800 uppercase">
              Giá nhập còn tồn
            </div>
            {purchaseLots.map((lot) => (
              <div
                key={lot.id}
                className="flex items-center justify-between text-xs text-gray-900"
              >
                <div className="font-semibold">{formatNumber(lot.cost)}đ</div>
                <div className="text-[10px] text-rose-600">
                  {lot.quantity} sp • {getWarehouseLabel(lot.warehouse)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SheetModal>
  );
};

export default ProductModal;
