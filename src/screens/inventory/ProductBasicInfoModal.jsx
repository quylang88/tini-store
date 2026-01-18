import React, { useState } from "react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/common/Button";
import ProductIdentityForm from "./ProductIdentityForm";
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
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || categories[0] || "",
    barcode: product?.barcode || "",
    price: product?.price || "",
    image: product?.image || null,
  });

  const handleImageFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoneyChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, price: rawValue }));
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
        <ProductIdentityForm
          // Data
          image={formData.image}
          barcode={formData.barcode}
          category={formData.category}
          name={formData.name}
          // Handlers
          onImageChange={handleImageFileChange}
          onBarcodeChange={(val) =>
            setFormData((prev) => ({ ...prev, barcode: val }))
          }
          onCategoryChange={(val) =>
            setFormData((prev) => ({ ...prev, category: val }))
          }
          onNameChange={(val) =>
            setFormData((prev) => ({ ...prev, name: val }))
          }
          // Config
          categories={categories}
          onShowScanner={onShowScanner}
          disabled={false}
          allowImageUpload={true}
          inputColorClass="text-gray-900" // Explicitly setting color as requested
        />

        {/* Price Input - Manually added back */}
        <div>
          <label className="text-xs font-bold text-rose-700 uppercase">
            Giá bán (VNĐ)
          </label>
          <input
            inputMode="numeric"
            className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold text-lg"
            value={formatInputNumber(formData.price)}
            onChange={handleMoneyChange}
            placeholder="0"
          />
        </div>
      </div>
    </SheetModal>
  );
};

export default ProductBasicInfoModal;
