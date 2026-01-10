import React, { useRef } from 'react';
import { ScanBarcode, Upload, X, Camera } from 'lucide-react';
import { formatInputNumber, formatNumber } from '../../utils/helpers';

const ProductModal = ({
  isOpen,
  editingProduct,
  formData,
  setFormData,
  onClose,
  onSave,
  onShowScanner,
  onImageSelect,
  onCurrencyChange,
  onMoneyChange,
  categories
}) => {
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
          <h3 className="font-bold text-lg">{editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Mới'}</h3>
          <button onClick={onClose} className="bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Khu vực ảnh: tách riêng nút tải ảnh và nút mở camera */}
          <div className="flex flex-col gap-3">
            <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden relative">
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
                className="w-full border border-gray-200 rounded-lg py-2 text-xs font-semibold text-gray-600 flex items-center justify-center gap-2 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer"
              >
                <Upload size={16} /> Tải ảnh
              </label>
              {/* Dùng label để ưu tiên mở camera trên thiết bị hỗ trợ */}
              <label
                htmlFor="inventory-camera"
                className="w-full border border-gray-200 rounded-lg py-2 text-xs font-semibold text-gray-600 flex items-center justify-center gap-2 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer"
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
              <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                Mã Vạch <ScanBarcode size={14} className="text-indigo-600 cursor-pointer" onClick={onShowScanner} />
              </label>
              <input
                className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-mono text-sm"
                value={formData.barcode}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Quét/Nhập..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Danh mục</label>
              <select
                className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 text-sm bg-transparent"
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
            <label className="text-xs font-bold text-gray-500 uppercase">Tên sản phẩm</label>
            <input
              className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-medium"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên..."
            />
          </div>

          {/* Khu vực giá nhập */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-blue-800 uppercase">Giá nhập</label>
              <select
                className="bg-transparent text-[10px] font-semibold text-blue-700 border border-blue-200 rounded px-2 py-1"
                value={formData.costCurrency}
                onChange={onCurrencyChange}
              >
                <option value="JPY">Theo Yên</option>
                <option value="VND">Theo VNĐ</option>
              </select>
            </div>

            {formData.costCurrency === 'JPY' ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="text-[10px] font-bold text-blue-800 uppercase">Giá nhập (Yên)</label>
                    <div className="relative">
                      <span className="absolute left-0 top-2 text-blue-500">¥</span>
                      <input
                        inputMode="numeric"
                        className="w-full bg-transparent border-b border-blue-200 py-2 pl-4 focus:border-blue-500 outline-none text-blue-900 font-bold"
                        value={formatInputNumber(formData.costJPY)}
                        onChange={onMoneyChange('costJPY')}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-blue-800 uppercase">Tỷ giá</label>
                    <input
                      inputMode="numeric"
                      className="w-full bg-transparent border-b border-blue-200 py-2 focus:border-blue-500 outline-none text-blue-900 text-right"
                      value={formatInputNumber(formData.exchangeRate)}
                      onChange={onMoneyChange('exchangeRate')}
                    />
                  </div>
                </div>
                <div className="text-right text-xs text-blue-600 font-medium">
                  = {formatNumber(formData.cost)} VNĐ (Vốn)
                </div>
              </>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-blue-800 uppercase">Giá nhập (VNĐ)</label>
                <div className="relative">
                  <span className="absolute left-0 top-2 text-blue-500">đ</span>
                  <input
                    inputMode="numeric"
                    className="w-full bg-transparent border-b border-blue-200 py-2 pl-4 focus:border-blue-500 outline-none text-blue-900 font-bold"
                    value={formatInputNumber(formData.cost)}
                    onChange={onMoneyChange('cost')}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* VND Pricing & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Giá bán (VNĐ)</label>
              <input
                inputMode="numeric"
                className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-bold text-lg"
                value={formatInputNumber(formData.price)}
                onChange={onMoneyChange('price')}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Tồn kho</label>
              <input
                type="number"
                className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-bold text-lg"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <button onClick={onSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-indigo-200 active:scale-95 transition">
            Lưu Sản Phẩm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
