/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BarcodeScanner from "../../components/BarcodeScanner";
import { WAREHOUSES } from "../../utils/warehouseUtils";

import OrderCreateHeader from "./components/OrderCreateHeader";
import OrderCreateProductList from "./components/OrderCreateProductList";
import OrderCreateFooter from "./components/OrderCreateFooter";
import OrderCreateReviewModal from "./components/OrderCreateReviewModal";
import useScrollHandling from "../../hooks/useScrollHandling";
import ProductFilterHeader from "../../components/common/ProductFilterHeader";

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
  handleExitCreate,
  handleCancelDraft,
  handleScanForSale,
  handleQuantityChange,
  adjustQuantity,
  handleOpenReview,
  handleCloseReview,
  handleConfirmOrder,
  setTabBarVisible,
  sortConfig,
  setSortConfig,
}) => {
  // Bug 3: Hide TabBar immediately on mount
  useEffect(() => {
    if (setTabBarVisible) {
      setTabBarVisible(false);
    }
  }, [setTabBarVisible]);

  // State scroll animation
  const { isSearchVisible, handleScroll } = useScrollHandling({
    mode: "staged",
    searchHideThreshold: 140,
  });

  const categories = settings?.categories || ["Chung"];
  const warehouseTabs = WAREHOUSES.map((w) => ({
    key: w.key,
    label: w.label,
  })).sort((a, b) => {
    // Reorder to match "Vĩnh Phúc Lâm đồng" (Vĩnh Phúc first)
    if (a.key === "vinhPhuc") return -1;
    if (b.key === "vinhPhuc") return 1;
    return 0;
  });

  // Heights for Layout
  // Title Header: ~45px (compact)
  // When editing, Title Header is taller (~74px) due to extra status text
  // Search Header: ~56px
  // We calculate dynamic top/padding based on orderBeingEdited

  const headerHeight = orderBeingEdited ? 68 : 53;
  const searchBarHeight = 60; // Slightly more than 56 to avoid overlap
  const listPaddingTop = headerHeight + searchBarHeight;

  return (
    <div className="flex flex-col h-full bg-rose-50 pb-safe-area relative">
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanForSale}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* 1. Header Tiêu Đề (Fixed, Z-20) - Luôn hiển thị */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <OrderCreateHeader orderBeingEdited={orderBeingEdited} />
      </div>

      {/* 2. Search Header (Animated, Z-10) - Ẩn khi scroll */}
      {/* Nó nằm ngay dưới Header Tiêu đề (top ~ 53px hoặc ~78px). 
          Khi ẩn, nó trượt lên trên (Y negative) để chui xuống dưới Header Tiêu đề. */}
      <motion.div
        className="absolute left-0 right-0 z-10"
        initial={{ top: headerHeight }}
        animate={{
          top: headerHeight,
          y: isSearchVisible ? 0 : -searchBarHeight, // Slide up by height of search bar
        }}
        transition={{ duration: 0.3 }}
      >
        <ProductFilterHeader
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onClearSearch={() => setSearchTerm("")}
          onShowScanner={() => setShowScanner(true)}
          enableFilters={false} // Chỉ hiện Search Bar
          // Props thừa nhưng cần để component không lỗi nếu nó check
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          warehouseFilter={selectedWarehouse}
          onWarehouseChange={setSelectedWarehouse}
          categories={categories}
          namespace="order-create-search"
          className="!bg-rose-50/90 !backdrop-blur"
        />
      </motion.div>

      {/* 3. List Sản Phẩm */}
      {/* Container chiếm full chiều cao. Padding nằm ở component con (OrderCreateProductList) */}
      <div className="flex-1 overflow-hidden flex flex-col pt-0">
        <OrderCreateProductList
          filteredProducts={filteredProducts}
          handleScroll={handleScroll}
          style={{ paddingTop: listPaddingTop }} // Pass dynamic style for padding
          cart={cart}
          selectedWarehouse={selectedWarehouse}
          orderBeingEdited={orderBeingEdited}
          adjustQuantity={adjustQuantity}
          handleQuantityChange={handleQuantityChange}
          activeCategory={activeCategory}
          // Filter Props passed down for In-Flow rendering
          setActiveCategory={setActiveCategory}
          setSelectedWarehouse={setSelectedWarehouse}
          categories={categories}
          warehouseTabs={warehouseTabs}
          warehouseLabel="Kho xuất: "
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
        />
      </div>

      {/* Tạo đơn hàng - Footer */}
      <OrderCreateFooter
        totalAmount={totalAmount}
        isFooterVisible={true}
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
