import React, { useRef } from "react";
import { ScanBarcode, Upload } from "lucide-react";
import { formatNumber } from "../../utils/formatters/formatUtils";

const ProductIdentityForm = ({
  // Thuộc tính dữ liệu
  image,
  barcode,
  category,
  name,

  // Xử lý sự kiện
  onImageChange, // callback(file)
  onBarcodeChange,
  onCategoryChange,
  onNameChange,

  // Cấu hình/Tiện ích
  categories = [],
  onShowScanner,
  disabled = false, // Vô hiệu hóa nhập liệu văn bản
  allowImageUpload = true, // Kiểm soát hiển thị nút tải ảnh

  // Gợi ý (cho Tên)
  nameSuggestions = [],
  onSelectExistingProduct,

  // Ghi đè kiểu dáng
  inputColorClass = "text-gray-900", // Mặc định màu tối theo yêu cầu
  highlightOps, // Prop mới để xử lý highlight
}) => {
  const uploadInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onImageChange) {
      onImageChange(file);
      event.target.value = ""; // Đặt lại input
    }
  };

  // Lấy logic highlight một cách an toàn
  const getHighlightProps = highlightOps?.getHighlightProps || (() => ({}));
  const isHighlighted = highlightOps?.isHighlighted || (() => false);
  const highlightClass = highlightOps?.highlightClass || "";

  return (
    <div className="space-y-4">
      {/* Phần hình ảnh */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor={allowImageUpload ? "pid-image-input" : undefined}
          className={`w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-rose-400 overflow-hidden relative ${
            allowImageUpload
              ? "cursor-pointer active:border-rose-400 active:bg-rose-50"
              : ""
          }`}
        >
          {image ? (
            <img
              src={image}
              className="w-full h-full object-contain absolute inset-0"
              alt="Preview"
            />
          ) : (
            <div className="flex flex-col items-center">
              <Upload size={24} className="mb-2" />
              <span className="text-xs">
                {allowImageUpload ? "Chạm để thêm ảnh" : "Chưa có ảnh"}
              </span>
            </div>
          )}
        </label>

        {/* Input ẩn - Gộp chung */}
        <input
          type="file"
          id="pid-image-input"
          ref={uploadInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          disabled={!allowImageUpload}
        />
      </div>

      {/* Mã vạch & Danh mục */}
      <div className="grid grid-cols-2 gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-rose-700 uppercase flex justify-between">
            Mã Vạch
            {allowImageUpload && ( // Chỉ hiển thị máy quét nếu được phép sửa định danh (đại diện cho tạo mới/sửa cơ bản)
              <ScanBarcode
                size={14}
                className="text-rose-600 cursor-pointer"
                onClick={onShowScanner}
              />
            )}
          </label>
          <input
            className={`w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none font-mono text-sm ${inputColorClass}`}
            value={barcode || ""}
            onChange={(e) => onBarcodeChange && onBarcodeChange(e.target.value)}
            placeholder={disabled ? "---" : "Quét/Nhập..."}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-rose-700 uppercase">
            Danh mục
          </label>
          <select
            className={`w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-sm bg-transparent disabled:opacity-60 ${inputColorClass}`}
            value={category || ""}
            onChange={(e) =>
              onCategoryChange && onCategoryChange(e.target.value)
            }
            disabled={disabled}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tên sản phẩm */}
      <div>
        <label className="text-xs font-bold text-rose-700 uppercase">
          Tên sản phẩm
        </label>
        <input
          className={`w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none font-medium disabled:text-gray-500 ${inputColorClass} ${
            isHighlighted("name") ? highlightClass : ""
          }`}
          value={name || ""}
          onChange={(e) => onNameChange && onNameChange(e.target.value)}
          placeholder="Nhập tên..."
          disabled={disabled}
          {...getHighlightProps("name", name)}
        />
        {/* Gợi ý tên (Chỉ liên quan khi được phép sửa, ví dụ: tạo sản phẩm mới) */}
        {!disabled && nameSuggestions?.length > 0 && (
          <div className="mt-2 bg-white border border-rose-100 rounded-lg shadow-sm overflow-hidden">
            {nameSuggestions.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() =>
                  onSelectExistingProduct && onSelectExistingProduct(prod)
                }
                className="w-full text-left px-3 py-2 text-sm text-gray-900 active:bg-rose-50 flex items-center justify-between"
              >
                <span className="font-medium">{prod.name}</span>
                <span className="text-[10px] text-rose-500">
                  {formatNumber(prod.price)}đ
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductIdentityForm;
