import React, { useRef } from "react";
import { ScanBarcode, Upload, Camera } from "lucide-react";
import { formatNumber } from "../../utils/formatters/formatUtils";
const ProductIdentityForm = ({
  // Data props
  image,
  barcode,
  category,
  name,

  // Handlers
  onImageChange, // callback(file)
  onBarcodeChange,
  onCategoryChange,
  onNameChange,

  // Config/Helpers
  categories = [],
  onShowScanner,
  disabled = false, // Disables text inputs
  allowImageUpload = true, // Controls visibility of upload buttons

  // Suggestions (for Name)
  nameSuggestions = [],
  onSelectExistingProduct,

  // Style override
  inputColorClass = "text-gray-900", // Mặc định màu tối theo yêu cầu
  highlightOps, // Prop mới để xử lý highlight
}) => {
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onImageChange) {
      onImageChange(file);
      event.target.value = ""; // Reset input
    }
  };

  // Lấy logic highlight một cách an toàn
  const getHighlightProps = highlightOps?.getHighlightProps || (() => ({}));
  const isHighlighted = highlightOps?.isHighlighted || (() => false);
  const highlightClass = highlightOps?.highlightClass || "";

  return (
    <div className="space-y-4">
      {/* Image Section */}
      <div className="flex flex-col gap-3">
        <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-rose-400 overflow-hidden relative">
          {image ? (
            <img
              src={image}
              className="w-full h-full object-contain absolute inset-0"
              alt="Preview"
            />
          ) : (
            <div className="flex flex-col items-center">
              <Upload size={24} className="mb-2" />
              <span className="text-xs">Chưa có ảnh sản phẩm</span>
            </div>
          )}
        </div>

        {/* Upload Buttons */}
        {allowImageUpload && (
          <div className="grid grid-cols-2 gap-3">
            <label
              htmlFor="pid-upload"
              className="w-full border border-rose-200 rounded-lg py-2 text-xs font-semibold text-rose-700 flex items-center justify-center gap-2 active:border-rose-400 active:text-rose-600 cursor-pointer"
            >
              <Upload size={16} /> Tải ảnh
            </label>
            <label
              htmlFor="pid-camera"
              className="w-full border border-rose-200 rounded-lg py-2 text-xs font-semibold text-rose-700 flex items-center justify-center gap-2 active:border-rose-400 active:text-rose-600 cursor-pointer"
            >
              <Camera size={16} /> Chụp ảnh
            </label>
          </div>
        )}

        {/* Hidden Inputs */}
        <input
          type="file"
          id="pid-upload"
          ref={uploadInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          disabled={!allowImageUpload}
        />
        <input
          type="file"
          id="pid-camera"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          capture="environment"
          disabled={!allowImageUpload}
        />
      </div>

      {/* Barcode & Category */}
      <div className="grid grid-cols-2 gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-rose-700 uppercase flex justify-between">
            Mã Vạch
            {allowImageUpload && ( // Show scanner only if we are allowed to edit identity (proxy for creating new/editing basic)
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

      {/* Name */}
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
        {/* Name Suggestions (Only relevant when editing is allowed, e.g. creating new product) */}
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
