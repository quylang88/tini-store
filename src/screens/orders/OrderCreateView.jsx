/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import BarcodeScanner from "../../components/BarcodeScanner";
import { WAREHOUSES } from "../../utils/warehouseUtils";

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
}) => {
  // State scroll animation
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const lastScrollTop = useRef(0);

  const handleScroll = (e) => {
    const target = e.target;
    const currentScrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const direction = currentScrollTop > lastScrollTop.current ? "down" : "up";
    const isNearBottom = currentScrollTop + clientHeight > scrollHeight - 50;

    // Threshold
    if (Math.abs(currentScrollTop - lastScrollTop.current) > 10) {
      if (direction === "down") {
        setIsHeaderExpanded(false);
        setIsFooterVisible(false);
      } else if (!isNearBottom) {
        setIsFooterVisible(true);
        setIsHeaderExpanded(true);
      }
      lastScrollTop.current = currentScrollTop;
    }
  };

  const categories = settings?.categories || ["Chung"];

  const warehouseTabs = WAREHOUSES.map((w) => ({ key: w.key, label: w.label }));

  // Tab danh mục dạng cuộn ngang
  const categoryTabs = [
    { key: "Tất cả", label: "Tất cả" },
    ...categories.map((c) => ({ key: c, label: c })),
  ];

  return (
    <div className="flex flex-col h-full bg-transparent pb-safe-area relative">
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleScanForSale}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Header Cố định */}
      <OrderCreateHeader
        orderBeingEdited={orderBeingEdited}
        setShowScanner={setShowScanner}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isHeaderExpanded={isHeaderExpanded}
        warehouseTabs={warehouseTabs}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
        categoryTabs={categoryTabs}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* List Sản Phẩm (Đã Lọc) */}
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
      />

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
