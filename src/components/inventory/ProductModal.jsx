import React from "react";
import SheetModal from "../../components/modals/SheetModal";
import Button from "../../components/button/Button";
import useModalCache from "../../hooks/ui/useModalCache";
import ProductIdentityForm from "./ProductIdentityForm";
import ProductCostSection from "./ProductCostSection";
import ProductShippingSection from "./ProductShippingSection";
import ProductStockSection from "./ProductStockSection";
import ProductPricingSection from "./ProductPricingSection";
import ProductHistorySection from "./ProductHistorySection";
import { useProductFormMath } from "../../hooks/inventory/useProductFormMath";

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
  onImageSelect,
  onCurrencyChange,
  onMoneyChange,
  onDecimalChange,
  onShippingMethodChange,
  categories,
  highlightOps,
}) => {
  // Sử dụng logic tính toán đã tách
  const { shippingFeeJpy, shippingFeeVnd, finalProfit, hasProfitData } =
    useProductFormMath(formData, settings);

  const purchaseLots = editingProduct?.purchaseLots || [];
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
          productCode={formData.productCode}
          category={formData.category}
          name={formData.name}
          // Handlers
          onImageChange={onImageSelect} // ProductModal nhận file object, ProductIdentityForm truyền file object
          onProductCodeChange={(val) =>
            setFormData({ ...formData, productCode: val })
          }
          onCategoryChange={(val) =>
            setFormData({ ...formData, category: val })
          }
          onNameChange={(val) => setFormData({ ...formData, name: val })}
          // Cấu hình
          categories={categories}
          disabled={Boolean(editingProduct)} // Vô hiệu hóa các trường định danh nếu đang sửa sản phẩm có sẵn
          allowImageUpload={!editingProduct} // Ẩn nút tải ảnh nếu đang sửa sản phẩm có sẵn
          nameSuggestions={nameSuggestions}
          onSelectExistingProduct={onSelectExistingProduct}
          inputColorClass="text-gray-900"
          highlightOps={highlightOps}
        />

        {/* Khu vực giá nhập */}
        <ProductCostSection
          formData={formData}
          onCurrencyChange={onCurrencyChange}
          onMoneyChange={onMoneyChange}
          highlightOps={highlightOps}
        />

        {/* Phí gửi */}
        <ProductShippingSection
          formData={formData}
          onShippingMethodChange={onShippingMethodChange}
          onDecimalChange={onDecimalChange}
          onMoneyChange={onMoneyChange}
          highlightOps={highlightOps}
          shippingFeeJpy={shippingFeeJpy}
          shippingFeeVnd={shippingFeeVnd}
        />

        {/* Tồn kho nhập vào */}
        <ProductStockSection
          formData={formData}
          setFormData={setFormData}
          highlightOps={highlightOps}
        />

        {/* Giá bán + Lợi nhuận + Hạn sử dụng */}
        <ProductPricingSection
          formData={formData}
          setFormData={setFormData}
          onMoneyChange={onMoneyChange}
          highlightOps={highlightOps}
          finalProfit={finalProfit}
          hasProfitData={hasProfitData}
          isEditingLot={isEditingLot}
        />

        {/* Thống kê giá nhập đang còn */}
        <ProductHistorySection
          purchaseLots={purchaseLots}
          isEditingLot={isEditingLot}
        />
      </div>
    </SheetModal>
  );
};

export default ProductModal;
