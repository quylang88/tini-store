import React, { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import InventoryHeader from '../components/inventory/InventoryHeader';
import ProductList from '../components/inventory/ProductList';
import ProductDetailModal from '../components/inventory/ProductDetailModal';
import ProductModal from '../components/inventory/ProductModal';
import ConfirmModalHost from '../components/modals/ConfirmModalHost';
import ErrorModal from '../components/modals/ErrorModal';
import FloatingAddButton from '../components/common/FloatingAddButton';
import useInventoryLogic from '../hooks/useInventoryLogic';
import useFilterTransition from '../hooks/useFilterTransition';

const Inventory = ({ products, setProducts, settings }) => {
  const [detailProduct, setDetailProduct] = useState(null);
  const {
    isModalOpen,
    showScanner,
    setShowScanner,
    editingProduct,
    editingLotId,
    searchTerm,
    setSearchTerm,
    confirmModal,
    setConfirmModal,
    errorModal,
    setErrorModal,
    activeCategories,
    warehouseFilter,
    formData,
    setFormData,
    handleMoneyChange,
    handleDecimalChange,
    handleCurrencyChange,
    handleShippingMethodChange,
    handleScanSuccess,
    handleImageSelect,
    handleSave,
    openModal,
    openEditLot,
    closeModal,
    handleCancelModal,
    handleDelete,
    filteredProducts,
    nameSuggestions,
    handleSelectExistingProduct,
    toggleCategory,
    setWarehouseFilter,
  } = useInventoryLogic({ products, setProducts, settings });

  // Khi search/danh mục/kho thay đổi thì list remount để chạy animation chuyển cảnh.
  const inventoryTransition = useFilterTransition([searchTerm, activeCategories, warehouseFilter]);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Dùng prop open để modal quét mã có thể chạy animation đóng. */}
      <BarcodeScanner open={showScanner} onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />

      {/* Tách phần header & tab danh mục để Inventory gọn hơn */}
      <InventoryHeader
        searchTerm={searchTerm}
        onSearchChange={e => setSearchTerm(e.target.value)}
        onClearSearch={() => setSearchTerm('')}
        onShowScanner={() => setShowScanner(true)}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        warehouseFilter={warehouseFilter}
        onWarehouseChange={setWarehouseFilter}
        categories={settings.categories}
      />

      {/* Nút thêm hàng mới nổi theo cùng vị trí với màn tạo đơn để đồng bộ UX. */}
      <FloatingAddButton onClick={() => openModal()} ariaLabel="Thêm hàng mới" />

      {/* Tách danh sách sản phẩm thành component riêng */}
      <div key={`inventory-filter-${inventoryTransition.animationKey}`} className={inventoryTransition.animationClass}>
        <ProductList
          products={filteredProducts}
          onDelete={handleDelete}
          onOpenDetail={setDetailProduct}
        />
      </div>

      {/* Tách form modal và bổ sung nút chụp ảnh từ camera */}
      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        editingLotId={editingLotId}
        formData={formData}
        setFormData={setFormData}
        settings={settings}
        nameSuggestions={nameSuggestions}
        onSelectExistingProduct={handleSelectExistingProduct}
        categories={settings.categories}
        onClose={handleCancelModal}
        onSave={handleSave}
        onShowScanner={() => setShowScanner(true)}
        onImageSelect={handleImageSelect}
        onMoneyChange={handleMoneyChange}
        onDecimalChange={handleDecimalChange}
        onCurrencyChange={handleCurrencyChange}
        onShippingMethodChange={handleShippingMethodChange}
      />

      {/* Modal chi tiết sản phẩm khi chạm vào item */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEditLot={(lot) => {
          openEditLot(detailProduct, lot);
          setDetailProduct(null);
        }}
      />

      {/* Modal xác nhận xoá để thay thế popup mặc định */}
      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

      {/* Modal báo lỗi riêng cho form tạo/sửa sản phẩm */}
      <ErrorModal
        open={Boolean(errorModal)}
        title={errorModal?.title}
        message={errorModal?.message}
        onClose={() => setErrorModal(null)}
      />
    </div>
  );
};

export default Inventory;
