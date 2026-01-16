/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import BarcodeScanner from "../../components/BarcodeScanner";
import { WAREHOUSES } from "../../utils/warehouseUtils";
import { motion, AnimatePresence } from "framer-motion";

import useScrollHandling from "../../hooks/useScrollHandling";
import ProductFilterSection from "../../components/common/ProductFilterSection";
import OrderCreateHeader from "./components/OrderCreateHeader";
import OrderCreateProductList from "./components/OrderCreateProductList";
import OrderCreateFooter from "./components/OrderCreateFooter";
import OrderCreateReviewModal from "./components/OrderCreateReviewModal";

// Giao diện tạo/sửa đơn được tách riêng để Orders.jsx gọn hơn
const OrderCreateView = ({
  settings,
  cart,
  showScanner,
  setShowScanner,
  orderBeingEdited,
  selectedWarehouse,
  setSelectedWarehouse,
  orderType,
  setOrderType,
  customerName,
  setCustomerName,
  customerAddress,
  setCustomerAddress,
  shippingFee,
  setShippingFee,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm,
  filteredProducts,
  totalAmount,
  reviewItems,
  isReviewOpen,
  hideBackButton,
  orderComment,
  setOrderComment,
  priceOverrides,
  handlePriceChange,
  handleExitCreate,
  handleCancelDraft,
  handleScanForSale,
  handleQuantityChange,
  adjustQuantity,
  handleOpenReview,
  handleCloseReview,
  handleConfirmOrder,
  setTabBarVisible,
}) => {
  // Reuse scroll logic
  const {
    isHeaderVisible,
    isAddButtonVisible: isFooterVisible, // Map add button visibility to footer
    handleScroll,
  } = useScrollHandling({
    setTabBarVisible,
    scrollThreshold: 200,
    dataDependency: filteredProducts.length,
  });

  const categories = settings?.categories || ["Chung"];

  const warehouseTabs = WAREHOUSES.map((w) => ({ key: w.key, label: w.label }));

  // Tab danh mục dạng cuộn ngang
  // (Removed categoryTabs as ProductFilterHeader handles it via categories list)

  return (
    <div className="flex flex-col h-full bg-transparent pb-safe-area relative">
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanForSale}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Header Cố định (Search Only) */}
      <AnimatePresence>
        {isHeaderVisible && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 right-0 z-10 shadow-sm"
          >
            <OrderCreateHeader
              orderBeingEdited={orderBeingEdited}
              setShowScanner={setShowScanner}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedWarehouse={selectedWarehouse}
              setSelectedWarehouse={setSelectedWarehouse}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Sản Phẩm (Đã Lọc) + In-flow Filters */}
      <motion.div
        layout
        className="flex-1 overflow-y-auto min-h-0 pt-[60px]" // Padding for sticky header
        onScroll={handleScroll}
      >
        <ProductFilterSection
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          warehouseFilter={selectedWarehouse}
          onWarehouseChange={setSelectedWarehouse}
          categories={categories}
          warehouseLabel="Kho xuất:"
          namespace="order"
        />

        <OrderCreateProductList
          filteredProducts={filteredProducts}
          cart={cart}
          selectedWarehouse={selectedWarehouse}
          orderBeingEdited={orderBeingEdited}
          priceOverrides={priceOverrides}
          handlePriceChange={handlePriceChange}
          adjustQuantity={adjustQuantity}
          handleQuantityChange={handleQuantityChange}
          activeCategory={activeCategory}
        />
      </motion.div>

      {/* Tạo đơn hàng - Footer */}
      <OrderCreateFooter
        totalAmount={totalAmount}
        isFooterVisible={isFooterVisible}
        handleCancelDraft={handleCancelDraft}
        handleOpenReview={handleOpenReview}
        orderBeingEdited={orderBeingEdited}
      />

      {/* Modal Review */}
      <OrderCreateReviewModal
        isReviewOpen={isReviewOpen}
        handleCloseReview={handleCloseReview}
        orderBeingEdited={orderBeingEdited}
        totalAmount={totalAmount}
        handleConfirmOrder={handleConfirmOrder}
        reviewItems={reviewItems}
        orderType={orderType}
        setOrderType={setOrderType}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerAddress={customerAddress}
        setCustomerAddress={setCustomerAddress}
        shippingFee={shippingFee}
        setShippingFee={setShippingFee}
        orderComment={orderComment}
        setOrderComment={setOrderComment}
      />
    </div>
  );
};

export default OrderCreateView;
