import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import ProductFilterHeader from "../components/common/ProductFilterHeader";
import ProductFilterSection from "../components/common/ProductFilterSection";
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

  // States for scroll animation reused via hook
  const {
    isHeaderVisible,
    isAddButtonVisible,
    isScrolled,
    handleScroll,
  } = useScrollHandling({
    setTabBarVisible,
    scrollThreshold: 200,
    dataDependency: filteredProducts.length, // Updated to use filteredProducts correctly
  });

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
      <div className="flex flex-col h-full pt-[72px] relative">
        {/* InventoryHeader (Sticky/Fixed - Chỉ chứa Search Bar) */}
        <AnimatePresence>
          {isHeaderVisible && (
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 z-10 shadow-sm"
            >
              <ProductFilterHeader
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                onClearSearch={() => setSearchTerm("")}
                onShowScanner={() => setShowScanner(true)}
                enableFilters={false} // Tắt render filter ở header cố định
                namespace="inventory"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product List cuộn bên dưới */}
        <motion.div
          layout
          className="flex-1 overflow-y-auto min-h-0 pt-[60px]" // Padding top để tránh search bar che mất filter
          onScroll={handleScroll}
        >
          {/* Filter Section nằm trong dòng chảy cuộn (để scroll tự nhiên) */}
          <ProductFilterSection
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            warehouseFilter={warehouseFilter}
            onWarehouseChange={setWarehouseFilter}
            categories={settings.categories}
            namespace="inventory"
          />

          <ProductList
            products={filteredProducts}
            onDelete={handleDelete}
            onOpenDetail={setDetailProduct}
            activeCategory={activeCategory}
            activeWarehouse={warehouseFilter}
          />
        </motion.div>
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
