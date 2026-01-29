import React, { useState, useRef, useEffect } from "react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/button/Button";
import ProductIdentityForm from "./ProductIdentityForm";
import ConfirmModalHost from "../modals/ConfirmModalHost";
import { formatInputNumber } from "../../utils/formatters/formatUtils";
import useHighlightFields from "../../hooks/ui/useHighlightFields";

// Helper để tạo object form chuẩn từ product
const getInitialFormData = (product, categories) => ({
  name: product?.name || "",
  category: product?.category || categories?.[0] || "",
  productCode: product?.productCode || "",
  price: product?.price || "",
  image: product?.image || null,
  note: product?.note || "",
});

const ProductBasicInfoModal = ({
  isOpen,
  product,
  categories,
  onClose,
  onSave,
  onError,
}) => {
  // Lưu prevProduct để theo dõi thay đổi cho cập nhật state dẫn xuất
  const [prevProduct, setPrevProduct] = useState(product);
  const [confirmModal, setConfirmModal] = useState(null);

  // Khởi tạo state cho formData và initialFormData (để so sánh thay đổi)
  const [formData, setFormData] = useState(() =>
    getInitialFormData(product, categories),
  );
  // Thay thế ref bằng state để tránh lỗi "Access refs during render"
  // và đảm bảo tính nhất quán của React flow.
  const [initialFormData, setInitialFormData] = useState(() =>
    getInitialFormData(product, categories),
  );

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
    // Luôn cập nhật lại form khi product đổi (kể cả khi reset về null)
    const newData = getInitialFormData(product, categories);
    setFormData(newData);
    setInitialFormData(newData);
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

  const hasChanges = () => {
    if (!initialFormData) return false;
    const initial = initialFormData;
    const current = formData;

    return (
      initial.name !== current.name ||
      initial.category !== current.category ||
      initial.productCode !== current.productCode ||
      String(initial.price) !== String(current.price) ||
      initial.image !== current.image ||
      initial.note !== current.note
    );
  };

  const handleClose = () => {
    if (!hasChanges()) {
      onClose();
      return;
    }
    setConfirmModal({
      title: "Huỷ chỉnh sửa?",
      message: "Bạn đang có thay đổi chưa lưu. Bạn có chắc muốn huỷ không?",
      confirmLabel: "Huỷ thay đổi",
      cancelLabel: "Tiếp tục sửa",
      tone: "danger",
      onConfirm: () => onClose(),
    });
  };

  const handleSave = () => {
    const missing = [];
    if (!formData.name || String(formData.name).trim() === "")
      missing.push("name");
    if (!formData.price || String(formData.price).trim() === "")
      missing.push("price");
    if (!formData.productCode || String(formData.productCode).trim() === "")
      missing.push("productCode");

    if (missing.length > 0) {
      highlightOps.triggerHighlights(missing);
      if (onError) {
        onError({
          title: "Thiếu thông tin",
          message: "Vui lòng nhập đầy đủ Tên sản phẩm, Mã sản phẩm và Giá bán.",
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
      <Button variant="secondary" onClick={handleClose}>
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
      onClose={handleClose}
      title="Sửa Thông Tin Cơ Bản"
      showCloseIcon={true}
      footer={footer}
    >
      <div className="space-y-4">
        <ProductIdentityForm
          // Dữ liệu
          image={formData.image}
          productCode={formData.productCode}
          category={formData.category}
          name={formData.name}
          // Xử lý sự kiện
          onImageChange={handleImageFileChange}
          onProductCodeChange={(val) =>
            setFormData((prev) => ({ ...prev, productCode: val }))
          }
          onCategoryChange={(val) =>
            setFormData((prev) => ({ ...prev, category: val }))
          }
          onNameChange={(val) =>
            setFormData((prev) => ({ ...prev, name: val }))
          }
          // Cấu hình
          categories={categories}
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
            enterKeyHint="done"
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
      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
      />
    </SheetModal>
  );
};

export default ProductBasicInfoModal;
