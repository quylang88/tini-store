/* eslint-disable no-unused-vars */
import React, { useState, useRef } from "react";
import BarcodeScanner from "../../components/BarcodeScanner";
import { WAREHOUSES } from "../../utils/warehouseUtils";
import { motion, AnimatePresence } from "framer-motion";

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
  // State scroll animation
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
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
        setIsHeaderVisible(false); // Hide entire header
        setIsFooterVisible(false);
        if (setTabBarVisible) setTabBarVisible(false);
      } else if (!isNearBottom) {
        setIsHeaderVisible(true); // Show header
        setIsHeaderExpanded(false); // Collapsed (Search only)
        setIsFooterVisible(true);

        // Expand header only at top
        if (currentScrollTop < 10) {
           setIsHeaderExpanded(true);
           if (setTabBarVisible) setTabBarVisible(true);
        }
      }
      lastScrollTop.current = currentScrollTop;
    } else {
        if (currentScrollTop < 10) {
            setIsHeaderVisible(true);
            setIsHeaderExpanded(true);
            setIsFooterVisible(true);
            if (setTabBarVisible) setTabBarVisible(true);
        }
    }
  };

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

      {/* Header Cố định */}
      <AnimatePresence>
        {isHeaderVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
          >
            <OrderCreateHeader
              orderBeingEdited={orderBeingEdited}
              setShowScanner={setShowScanner}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isHeaderExpanded={isHeaderExpanded}
              selectedWarehouse={selectedWarehouse}
              setSelectedWarehouse={setSelectedWarehouse}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
