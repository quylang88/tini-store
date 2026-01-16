import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import ProductFilterHeader from "../components/common/ProductFilterHeader";
import ProductList from "./inventory/ProductList";
import ProductDetailModal from "./inventory/ProductDetailModal";
import ProductModal from "./inventory/ProductModal";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import FloatingActionButton from "../components/common/FloatingActionButton";
import useInventoryLogic from "../hooks/useInventoryLogic";
import useScrollHandling from "../hooks/useScrollHandling";
import AppHeader from "../components/common/AppHeader";

const Inventory = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  setTabBarVisible,
}) => {
  const [detailProduct, setDetailProduct] = useState(null);

  // States for scroll animation reused via hook
  const {
    isHeaderExpanded,
    isHeaderVisible,
    isAddButtonVisible,
    isScrolled,
    handleScroll,
  } = useScrollHandling({
    setTabBarVisible,
    scrollThreshold: 200,
    dataDependency: products.length, // Updated to use products directly or filtered
  });

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
    activeCategory,
    setActiveCategory,
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
    setWarehouseFilter,
  } = useInventoryLogic({ products, setProducts, orders, setOrders, settings });

  // Đã loại bỏ useFilterTransition để tránh remount list gây khựng.

  return (
    <div className="relative h-full bg-transparent flex flex-col">
      <AppHeader className="z-20" isScrolled={isScrolled} />

      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Container cho nội dung chính, bắt đầu từ dưới AppHeader */}
      <div className="flex flex-col h-full pt-[72px]">
        {/* InventoryHeader cố định phía trên danh sách */}
        <AnimatePresence>
          {isHeaderVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="z-10 bg-amber-50 shadow-sm shrink-0 overflow-hidden"
            >
              <ProductFilterHeader
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onClearSearch={() => setSearchTerm("")}
                onShowScanner={() => setShowScanner(true)}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                warehouseFilter={warehouseFilter}
                onWarehouseChange={setWarehouseFilter}
                categories={settings.categories}
                isExpanded={isHeaderExpanded}
                namespace="inventory"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product List cuộn bên dưới InventoryHeader */}
        <div className="flex-1 overflow-y-auto min-h-0" onScroll={handleScroll}>
          <ProductList
            products={filteredProducts}
            onDelete={handleDelete}
            onOpenDetail={setDetailProduct}
            activeCategory={activeCategory}
            activeWarehouse={warehouseFilter}
          />
        </div>
      </div>

      {/* Nút thêm hàng mới nổi theo cùng vị trí với màn tạo đơn để đồng bộ UX. */}
      <AnimatePresence>
        {isAddButtonVisible && (
          <motion.div
            layout
            layoutId="floating-action-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+90px)] z-30"
          >
            <FloatingActionButton
              onClick={() => openModal()}
              ariaLabel="Thêm hàng mới"
              icon={Plus}
              color="rose"
              className="!static" // Override absolute positioning if needed by wrapper
            />
          </motion.div>
        )}
      </AnimatePresence>

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
