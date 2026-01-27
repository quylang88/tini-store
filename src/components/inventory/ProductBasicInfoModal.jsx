import React, { useState, useRef, useEffect } from "react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/button/Button";
import ProductIdentityForm from "./ProductIdentityForm";
import { formatInputNumber } from "../../utils/formatters/formatUtils";
import useHighlightFields from "../../hooks/ui/useHighlightFields";

const ProductBasicInfoModal = ({
  isOpen,
  product,
  categories,
  onClose,
  onSave,
  onShowScanner,
  onError,
}) => {
  // Lưu prevProduct để theo dõi thay đổi cho cập nhật state dẫn xuất
  const [prevProduct, setPrevProduct] = useState(product);
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || categories[0] || "",
    barcode: product?.barcode || "",
    price: product?.price || "",
    image: product?.image || null,
    note: product?.note || "",
  });

  const highlightOps = useHighlightFields();
  const textareaRef = useRef(null);

  // Auto-resize textarea on mount/change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.note, isOpen]);

  // State dẫn xuất: Cập nhật formData khi product thay đổi
  if (product !== prevProduct) {
    setPrevProduct(product);
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || categories[0] || "",
        barcode: product.barcode || "",
        price: product.price || "",
        image: product.image || null,
        note: product.note || "",
      });
    }
  }

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
    const missing = [];
    if (!formData.name || String(formData.name).trim() === "")
      missing.push("name");
    if (!formData.price || String(formData.price).trim() === "")
      missing.push("price");

    if (missing.length > 0) {
      highlightOps.triggerHighlights(missing);
      if (onError) {
        onError({
          title: "Thiếu thông tin",
          message: "Vui lòng nhập đầy đủ Tên sản phẩm và Giá bán.",
        });
      }
      return;
    }

    onSave({
      ...product, // Giữ nguyên ID và các trường khác
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
          // Dữ liệu
          image={formData.image}
          barcode={formData.barcode}
          category={formData.category}
          name={formData.name}
          // Xử lý sự kiện
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
          // Cấu hình
          categories={categories}
          onShowScanner={onShowScanner}
          disabled={false}
          allowImageUpload={true}
          inputColorClass="text-gray-900"
          highlightOps={highlightOps}
        />

        {/* Nhập giá - Thêm lại thủ công */}
        <div>
          <label className="text-xs font-bold text-rose-700 uppercase">
            Giá bán (VNĐ)
          </label>
          <input
            inputMode="numeric"
            className={`w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none text-gray-900 font-bold text-lg ${
              highlightOps.isHighlighted("price")
                ? highlightOps.highlightClass
                : ""
            }`}
            value={formatInputNumber(formData.price)}
            onChange={handleMoneyChange}
            placeholder="0"
            {...highlightOps.getHighlightProps("price", formData.price)}
          />
        </div>

        {/* Nhập ghi chú */}
        <div>
          <label className="text-xs font-bold text-rose-700 uppercase">
            Ghi chú
          </label>
          <textarea
            ref={textareaRef}
            className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-rose-400 text-gray-900 text-sm mt-1 resize-none overflow-y-auto"
            style={{ maxHeight: "160px", minHeight: "100px" }}
            rows={1}
            value={formData.note}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, note: e.target.value }));
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Ghi chú về sản phẩm..."
          />
        </div>
      </div>
    </SheetModal>
  );
};

export default ProductBasicInfoModal;
