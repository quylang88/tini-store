import React, { useState, useRef } from "react";
import { Camera, ScanBarcode, Upload } from "lucide-react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/common/Button";
import { formatInputNumber } from "../../utils/helpers";

const ProductBasicInfoModal = ({
  isOpen,
  product,
  categories,
  onClose,
  onSave,
  onShowScanner,
}) => {
  // Directly initialize state from props.
  // This requires the parent to use a unique `key` prop so that the component
  // is remounted (and state re-initialized) when the product changes.
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || categories[0] || "",
    barcode: product?.barcode || "",
    price: product?.price || "",
    image: product?.image || null,
  });

  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    }
  };

  const handleMoneyChange = (field) => (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [field]: rawValue }));
  };

  const handleSave = () => {
    onSave({
      ...product, // Keep original ID and other fields
      ...formData,
      price: Number(formData.price),
    });
    onClose();
  };

  const footer = (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="secondary" onClick={onClose}>
        Huỷ
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Lưu
      </Button>
    </div>
  );

  return (
    <SheetModal
      open={isOpen}
      onClose={onClose}
      title="Sửa Thông Tin Cơ Bản"
      showCloseIcon={true}
      footer={footer}
    >
      <div className="space-y-4">
        {/* Image Section */}
        <div className="flex flex-col gap-3">
          <div className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-rose-400 overflow-hidden relative">
            {formData.image ? (
              <img
                src={formData.image}
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

          <div className="grid grid-cols-2 gap-3">
            <label
              htmlFor="basic-info-upload"
              className="w-full border border-rose-200 rounded-lg py-2 text-xs font-semibold text-rose-700 flex items-center justify-center gap-2 active:border-rose-400 active:text-rose-600 cursor-pointer"
            >
              <Upload size={16} /> Tải ảnh
            </label>
            <label
              htmlFor="basic-info-camera"
              className="w-full border border-rose-200 rounded-lg py-2 text-xs font-semibold text-rose-700 flex items-center justify-center gap-2 active:border-rose-400 active:text-rose-600 cursor-pointer"
            >
              <Camera size={16} /> Chụp ảnh
            </label>
          </div>

          <input
            type="file"
            id="basic-info-upload"
            ref={uploadInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <input
            type="file"
            id="basic-info-camera"
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
            <label className="text-xs font-bold text-rose-700 uppercase flex justify-between">
              Mã Vạch{" "}
              <ScanBarcode
                size={14}
                className="text-rose-600 cursor-pointer"
                onClick={onShowScanner}
              />
            </label>
            <input
              className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-rose-900 font-mono text-sm"
              value={formData.barcode}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, barcode: val }));
              }}
              placeholder="Quét/Nhập..."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-rose-700 uppercase">
              Danh mục
            </label>
            <select
              className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-rose-900 text-sm bg-transparent"
              value={formData.category}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, category: val }));
              }}
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
            className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-rose-900 font-medium"
            value={formData.name}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({ ...prev, name: val }));
            }}
            placeholder="Nhập tên..."
          />
        </div>

        {/* Price */}
        <div>
          <label className="text-xs font-bold text-rose-700 uppercase">
            Giá bán (VNĐ)
          </label>
          <input
            inputMode="numeric"
            className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-rose-900 font-bold text-lg"
            value={formatInputNumber(formData.price)}
            onChange={handleMoneyChange("price")}
            placeholder="0"
          />
        </div>
      </div>
    </SheetModal>
  );
};

export default ProductBasicInfoModal;
