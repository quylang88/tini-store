/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import BarcodeScanner from "../../components/BarcodeScanner";
import { WAREHOUSES } from "../../utils/warehouseUtils";

import OrderCreateHeader from "./components/OrderCreateHeader";
import OrderCreateProductList from "./components/OrderCreateProductList";
import OrderCreateFooter from "./components/OrderCreateFooter";
import OrderCreateReviewModal from "./components/OrderCreateReviewModal";
import useScrollHandling from "../../hooks/useScrollHandling";

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
  // State scroll animation using the new hook
  const {
    isSearchVisible,
    isAddButtonVisible: isFooterVisible, // Reuse logic for footer (behaves like Add Button/TabBar)
    handleScroll,
  } = useScrollHandling({ mode: "staged", setTabBarVisible });

  const categories = settings?.categories || ["Chung"];
  const warehouseTabs = WAREHOUSES.map((w) => ({ key: w.key, label: w.label }));

  return (
    <div className="flex flex-col h-full bg-transparent pb-safe-area relative">
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanForSale}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Header Cố định (Title + Search) */}
      <motion.div
        className="z-10 bg-amber-50/90 shadow-sm backdrop-blur absolute top-0 left-0 right-0"
        initial={{ y: 0 }}
        animate={{ y: isSearchVisible ? 0 : -130 }} // Assuming header height is around 130px
        transition={{ duration: 0.3 }}
      >
        <OrderCreateHeader
          orderBeingEdited={orderBeingEdited}
          setShowScanner={setShowScanner}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isHeaderExpanded={true} // Always expanded internally, container handles visibility
          enableFilters={false} // Disable filters in header
          selectedWarehouse={selectedWarehouse}
          setSelectedWarehouse={setSelectedWarehouse}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </motion.div>

      {/* List Sản Phẩm (Đã Lọc) */}
      <div className="flex-1 overflow-hidden flex flex-col pt-[130px]">
        <OrderCreateProductList
          filteredProducts={filteredProducts}
          handleScroll={handleScroll}
          cart={cart}
          selectedWarehouse={selectedWarehouse}
          orderBeingEdited={orderBeingEdited}
          priceOverrides={priceOverrides}
          handlePriceChange={handlePriceChange}
          adjustQuantity={adjustQuantity}
          handleQuantityChange={handleQuantityChange}
          activeCategory={activeCategory}
          // Filter Props passed down for In-Flow rendering
          setActiveCategory={setActiveCategory}
          setSelectedWarehouse={setSelectedWarehouse}
          categories={categories}
          warehouseTabs={warehouseTabs}
        />
      </div>

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
