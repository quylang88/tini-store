import React, { useRef } from 'react';
import { ScanBarcode, Upload, X, Camera } from 'lucide-react';
import { formatInputNumber, formatNumber } from '../../utils/helpers';
import { getWarehouseLabel } from '../../utils/warehouseUtils';

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
  categories
}) => {
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Lợi nhuận = giá bán - (giá nhập + phí gửi) cho 1 sản phẩm.
  const shippingWeight = Number(formData.shippingWeightKg) || 0;
  const exchangeRateValue = Number(settings?.exchangeRate) || 0;
  const shippingFeeJpy = formData.shippingMethod === 'jp' ? Math.round(shippingWeight * 900) : 0;
  const shippingFeeVnd = formData.shippingMethod === 'jp'
    ? Math.round(shippingFeeJpy * exchangeRateValue)
    : Number(formData.shippingFeeVnd) || 0;
  const purchaseLots = editingProduct?.purchaseLots || [];
  const hasProfitData = Number(formData.price) > 0 && (Number(formData.cost) + shippingFeeVnd) > 0;
  const finalProfit = (Number(formData.price) || 0) - (Number(formData.cost) || 0) - shippingFeeVnd;
  const isEditingLot = Boolean(editingProduct && editingLotId);
  const modalTitle = isEditingLot ? 'Sửa Lần Nhập Hàng' : 'Thêm Mới';
  if (!isOpen) {
    return null;
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm">
      <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg text-amber-900">{modalTitle}</h3>
          <button onClick={onClose} className="bg-amber-100 p-1.5 rounded-full"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Khu vực ảnh: tách riêng nút tải ảnh và nút mở camera */}
          <div className="flex flex-col gap-3">
            <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-amber-400 overflow-hidden relative">
              {formData.image ? (
                <img src={formData.image} className="w-full h-full object-contain absolute inset-0" alt="Preview" />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload size={24} className="mb-2" />
                  <span className="text-xs">Chưa có ảnh sản phẩm</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Dùng label để trình duyệt mở đúng luồng chọn file */}
              <label
                htmlFor="inventory-upload"
                className="w-full border border-amber-200 rounded-lg py-2 text-xs font-semibold text-amber-700 flex items-center justify-center gap-2 hover:border-rose-400 hover:text-rose-600 cursor-pointer"
              >
                <Upload size={16} /> Tải ảnh
              </label>
              {/* Dùng label để ưu tiên mở camera trên thiết bị hỗ trợ */}
              <label
                htmlFor="inventory-camera"
                className="w-full border border-amber-200 rounded-lg py-2 text-xs font-semibold text-amber-700 flex items-center justify-center gap-2 hover:border-rose-400 hover:text-rose-600 cursor-pointer"
              >
                <Camera size={16} /> Chụp ảnh
              </label>
            </div>
            <input
              type="file"
              id="inventory-upload"
              ref={uploadInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
            />
            <input
              type="file"
              id="inventory-camera"
              ref={cameraInputRef}
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
              capture="environment"
            />
          </div>

          {/* Barcode & Category */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-amber-700 uppercase flex justify-between">
                Mã Vạch <ScanBarcode size={14} className="text-rose-600 cursor-pointer" onClick={onShowScanner} />
              </label>
              <input
                className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-amber-900 font-mono text-sm"
                value={formData.barcode}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Quét/Nhập..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-amber-700 uppercase">Danh mục</label>
              <select
                className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-amber-900 text-sm bg-transparent"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-amber-700 uppercase">Tên sản phẩm</label>
            <input
              className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-amber-900 font-medium"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên..."
            />
            {!editingProduct && nameSuggestions?.length > 0 && (
              <div className="mt-2 bg-white border border-amber-100 rounded-lg shadow-sm overflow-hidden">
                {nameSuggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onSelectExistingProduct(product)}
                    className="w-full text-left px-3 py-2 text-sm text-amber-900 hover:bg-amber-50 flex items-center justify-between"
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="text-[10px] text-amber-500">{formatNumber(product.price)}đ</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Khu vực giá nhập: cho chọn Yên hoặc VNĐ */}
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-amber-800 uppercase">Giá nhập</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onCurrencyChange('JPY')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                    formData.costCurrency === 'JPY'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                  }`}
                >
                  Theo Yên
                </button>
                <button
                  type="button"
                  onClick={() => onCurrencyChange('VND')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                    formData.costCurrency === 'VND'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                  }`}
                >
                  Theo VNĐ
                </button>
              </div>
            </div>
            {formData.costCurrency === 'JPY' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-amber-800 uppercase">Giá nhập (Yên)</label>
                    <div className="relative">
                      <span className="absolute left-0 top-2 text-amber-500">¥</span>
                      <input
                        inputMode="numeric"
                        className="w-full bg-transparent border-b border-amber-100 py-2 pl-4 focus:border-amber-400 outline-none text-amber-900 font-bold"
                        value={formatInputNumber(formData.costJPY)}
                        onChange={onMoneyChange('costJPY')}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-amber-800 uppercase">Tỷ giá</label>
                    <input
                      inputMode="numeric"
                      className="w-full bg-transparent border-b border-amber-100 py-2 focus:border-amber-400 outline-none text-amber-900 text-right"
                      value={formatInputNumber(formData.exchangeRate)}
                      onChange={onMoneyChange('exchangeRate')}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="text-right text-xs text-amber-600 font-medium">
                  = {formatNumber(formData.cost)} VNĐ (Vốn)
                </div>
              </>
            ) : (
              <div className="relative">
                <span className="absolute left-0 top-2 text-amber-500">đ</span>
                <input
                  inputMode="numeric"
                  className="w-full bg-transparent border-b border-amber-100 py-2 pl-4 focus:border-amber-400 outline-none text-amber-900 font-bold"
                  value={formatInputNumber(formData.cost)}
                  onChange={onMoneyChange('cost')}
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Phí gửi nằm ngay sau phần giá nhập */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Phí gửi</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onShippingMethodChange('jp')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                    formData.shippingMethod === 'jp'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                  }`}
                >
                  Mua tại Nhật
                </button>
                <button
                  type="button"
                  onClick={() => onShippingMethodChange('vn')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                    formData.shippingMethod === 'vn'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                  }`}
                >
                  Mua tại VN
                </button>
              </div>
            </div>
            {formData.shippingMethod === 'jp' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-800 uppercase">Nhập cân (kg)</label>
                <input
                  inputMode="decimal"
                  className="w-full bg-transparent border-b border-amber-100 py-2 focus:border-amber-400 outline-none text-amber-900 font-bold"
                  value={formData.shippingWeightKg}
                  onChange={onDecimalChange('shippingWeightKg')}
                  placeholder="0"
                />
                <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
                  <span>Phí gửi: {formatNumber(shippingFeeJpy)}¥ (~{formatNumber(shippingFeeVnd)}đ)</span>
                  <span className="text-[10px] text-amber-500">900 yên / 1kg</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-amber-800 uppercase">Phí gửi (VNĐ)</label>
                <input
                  inputMode="numeric"
                  className="w-full bg-transparent border-b border-amber-100 py-2 focus:border-amber-400 outline-none text-amber-900 font-bold"
                  value={formatInputNumber(formData.shippingFeeVnd)}
                  onChange={onMoneyChange('shippingFeeVnd')}
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Tồn kho nhập vào */}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Tồn kho nhập về</div>
              <div className="flex gap-2">
                {[
                  { key: 'vinhPhuc', label: 'Vĩnh Phúc' },
                  { key: 'daLat', label: 'Lâm Đồng' },
                ].map((warehouse) => (
                  <button
                    key={warehouse.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, warehouse: warehouse.key })}
                    className={`px-2 py-1 text-[10px] font-semibold rounded border transition ${
                      formData.warehouse === warehouse.key
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-transparent text-amber-700 border-amber-200 hover:border-rose-400'
                    }`}
                  >
                    {warehouse.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-amber-800 uppercase">Số lượng</label>
                <input
                  type="number"
                  className="w-full border-b border-amber-100 bg-transparent py-2 focus:border-rose-400 outline-none text-amber-900 font-bold text-lg"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div />
            </div>
          </div>

          {/* Giá bán + lợi nhuận */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-xs font-bold text-amber-700 uppercase">Giá bán (VNĐ)</label>
              <input
                inputMode="numeric"
                className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-amber-900 font-bold text-lg"
                value={formatInputNumber(formData.price)}
                onChange={onMoneyChange('price')}
                placeholder="0"
              />
            </div>
            <div className="min-w-0 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex flex-col gap-1">
              <div className="text-xs font-bold text-emerald-700 uppercase">Lợi nhuận (VNĐ)</div>
              <div className="text-lg font-bold text-emerald-700">
                {hasProfitData ? formatNumber(finalProfit) : '0'}
              </div>
            </div>
          </div>

          {/* Thống kê giá nhập đang còn */}
          {purchaseLots.length > 0 && (
            <div className="bg-white border border-amber-100 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Giá nhập còn tồn</div>
              {purchaseLots.map((lot) => (
                <div key={lot.id} className="flex items-center justify-between text-xs text-amber-800">
                  <div className="font-semibold">{formatNumber(lot.cost)}đ</div>
                  <div className="text-[10px] text-amber-600">
                    {lot.quantity} sp • {getWarehouseLabel(lot.warehouse)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={onSave} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-rose-200 active:scale-95 transition">
            Lưu Sản Phẩm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
