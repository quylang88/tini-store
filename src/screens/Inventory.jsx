import React, { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BarcodeScanner from "../components/BarcodeScanner";
import InventoryHeader from "./inventory/InventoryHeader";
import ProductList from "./inventory/ProductList";
import ProductDetailModal from "./inventory/ProductDetailModal";
import ProductModal from "./inventory/ProductModal";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import FloatingAddButton from "../components/common/FloatingAddButton";
import useInventoryLogic from "../hooks/useInventoryLogic";

const Inventory = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  setTabBarVisible,
}) => {
  const [detailProduct, setDetailProduct] = useState(null);

  // States for scroll animation
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);
  const lastScrollTop = useRef(0);

  const handleScroll = useCallback(
    (e) => {
      const currentScrollTop = e.target.scrollTop;
      const direction =
        currentScrollTop > lastScrollTop.current ? "down" : "up";

      // Threshold to avoid jitter
      if (Math.abs(currentScrollTop - lastScrollTop.current) > 10) {
        if (direction === "down") {
          setIsHeaderExpanded(false);
          setIsAddButtonVisible(false);
          if (setTabBarVisible) setTabBarVisible(false);
        } else {
          setIsAddButtonVisible(true);
          // Only show full header and tab bar when near top
          if (currentScrollTop < 50) {
            setIsHeaderExpanded(true);
            if (setTabBarVisible) setTabBarVisible(true);
          }
        }
        lastScrollTop.current = currentScrollTop;
      }
    },
    [setTabBarVisible]
  );

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
    handleCancelModal,
    handleDelete,
    filteredProducts,
    nameSuggestions,
    handleSelectExistingProduct,
    toggleCategory,
    setWarehouseFilter,
  } = useInventoryLogic({ products, setProducts, orders, setOrders, settings });

  // Đã loại bỏ useFilterTransition để tránh remount list gây khựng.

  return (
    <div className="flex flex-col h-full bg-transparent">
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Tách phần header & tab danh mục để Inventory gọn hơn */}
      <InventoryHeader
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        onClearSearch={() => setSearchTerm("")}
        onShowScanner={() => setShowScanner(true)}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        warehouseFilter={warehouseFilter}
        onWarehouseChange={setWarehouseFilter}
        categories={settings.categories}
        isExpanded={isHeaderExpanded}
      />

      {/* Nút thêm hàng mới nổi theo cùng vị trí với màn tạo đơn để đồng bộ UX. */}
      <AnimatePresence>
        {isAddButtonVisible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-5 bottom-24 z-30"
          >
            <FloatingAddButton
              onClick={() => openModal()}
              ariaLabel="Thêm hàng mới"
              className="!static" // Override absolute positioning if needed by wrapper
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tách danh sách sản phẩm thành component riêng */}
      {/* Loại bỏ key={...} để React tự diff và giữ DOM, tránh nháy hình */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ProductList
          products={filteredProducts}
          onDelete={handleDelete}
          onOpenDetail={setDetailProduct}
          handleScroll={handleScroll}
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
        onSave={() => {
          if (handleSave()) {
            setDetailProduct(null);
          }
        }}
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
