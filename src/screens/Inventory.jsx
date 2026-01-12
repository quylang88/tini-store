import React from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import InventoryHeader from '../components/inventory/InventoryHeader';
import ProductList from '../components/inventory/ProductList';
import ProductModal from '../components/inventory/ProductModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import useInventoryLogic from '../hooks/useInventoryLogic';

const Inventory = ({ products, setProducts, settings }) => {
  const {
    isModalOpen,
    showScanner,
    setShowScanner,
    editingProduct,
    searchTerm,
    setSearchTerm,
    confirmModal,
    setConfirmModal,
    activeCategory,
    setActiveCategory,
    formData,
    setFormData,
    handleMoneyChange,
    handleCurrencyChange,
    handleScanSuccess,
    handleImageSelect,
    handleSave,
    openModal,
    closeModal,
    handleDelete,
    filteredProducts,
  } = useInventoryLogic({ products, setProducts, settings });

  return (
    <div className="flex flex-col h-full bg-transparent">
      {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}

      {/* Tách phần header & tab danh mục để Inventory gọn hơn */}
      <InventoryHeader
        searchTerm={searchTerm}
        onSearchChange={e => setSearchTerm(e.target.value)}
        onClearSearch={() => setSearchTerm('')}
        onOpenModal={() => openModal()}
        onShowScanner={() => setShowScanner(true)}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={settings.categories}
      />

      {/* Tách danh sách sản phẩm thành component riêng */}
      <ProductList
        products={filteredProducts}
        onEdit={openModal}
        onDelete={handleDelete}
      />

      {/* Tách form modal và bổ sung nút chụp ảnh từ camera */}
      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        categories={settings.categories}
        onClose={closeModal}
        onSave={handleSave}
        onShowScanner={() => setShowScanner(true)}
        onImageSelect={handleImageSelect}
        onCurrencyChange={handleCurrencyChange}
        onMoneyChange={handleMoneyChange}
      />

      {/* Modal xác nhận xoá để thay thế popup mặc định */}
      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        tone={confirmModal?.tone}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          confirmModal?.onConfirm?.();
          setConfirmModal(null);
        }}
      />
    </div>
  );
};

export default Inventory;
