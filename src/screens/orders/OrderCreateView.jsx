import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { getWarehouses } from "../../utils/inventory/warehouseUtils";

import OrderCreateHeader from "../../components/orders/OrderCreateHeader";
import OrderCreateProductList from "../../components/orders/OrderCreateProductList";
import OrderCreateFooter from "../../components/orders/OrderCreateFooter";
import OrderCreateReviewModal from "../../components/orders/OrderCreateReviewModal";
import useScrollHandling from "../../hooks/ui/useScrollHandling";
import ProductFilterHeader from "../../components/common/ProductFilterHeader";
import usePagination from "../../hooks/ui/usePagination";
import { isScrollNearBottom } from "../../utils/ui/scrollUtils";

// Giao diện tạo/sửa đơn được tách riêng để Orders.jsx gọn hơn
const OrderCreateView = ({
  settings,
  cart,
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
  debouncedSearchTerm,
  filteredProducts,
  getAvailableStock,
  totalAmount,
  reviewItems,
  isReviewOpen,
  orderComment,
  setOrderComment,
  handleCancelDraft,
  handleQuantityChange,
  adjustQuantity,
  handleOpenReview,
  handleCloseReview,
  handleConfirmOrder,
  sortConfig,
  setSortConfig,
  customers,
  isCustomerNameTaken,
  setPriceOverrides,
}) => {
  // State quản lý hiệu ứng cuộn
  const { isSearchVisible, handleScroll } = useScrollHandling({
    mode: "staged",
    searchHideThreshold: 140,
  });

  const {
    visibleData: visibleProducts,
    loadMore,
    hasMore,
  } = usePagination(filteredProducts, {
    pageSize: 20,
    resetDeps: [
      debouncedSearchTerm,
      activeCategory,
      selectedWarehouse,
      sortConfig,
    ],
  });

  // Tối ưu hóa: Memoize handleScrollCombined để tránh re-render list
  const handleScrollCombined = useCallback(
    (e) => {
      handleScroll(e);
      if (isScrollNearBottom(e.target) && hasMore) {
        loadMore();
      }
    },
    [handleScroll, hasMore, loadMore],
  );

  const categories = React.useMemo(
    () => settings?.categories || ["Chung"],
    [settings?.categories],
  );
  const warehouseTabs = React.useMemo(
    () =>
      getWarehouses().map((w) => ({
        key: w.key,
        label: w.label,
      })),
    [],
  );

  // Chiều cao cho Layout
  // Header tiêu đề: ~45px (compact)
  // Khi chỉnh sửa, Header tiêu đề cao hơn (~74px) do có thêm văn bản trạng thái
  // Header tìm kiếm: ~56px
  // Chúng ta tính toán top/padding động dựa trên orderBeingEdited

  // Tối ưu hóa: Memoize các tính toán chiều cao
  const headerHeight = useMemo(
    () => (orderBeingEdited ? 68 : 52),
    [orderBeingEdited],
  );
  const searchBarHeight = 60; // Hơi nhiều hơn 56 để tránh chồng chéo
  const listPaddingTop = useMemo(
    () => headerHeight + searchBarHeight,
    [headerHeight],
  );

  // Tối ưu hóa: Memoize style object để tránh re-render không cần thiết
  const listStyle = useMemo(
    () => ({
      paddingTop: `calc(${listPaddingTop}px + env(safe-area-inset-top))`,
    }),
    [listPaddingTop],
  );

  // Tối ưu hóa: Memoize handlers tìm kiếm để tránh re-render ProductFilterHeader
  const handleSearchChange = useCallback(
    (e) => setSearchTerm(e.target.value),
    [setSearchTerm],
  );

  const handleClearSearch = useCallback(
    () => setSearchTerm(""),
    [setSearchTerm],
  );

  return (
    <div className="flex flex-col h-full bg-rose-50 pb-safe-area relative">
      {/* 1. Header Tiêu Đề (Fixed, Z-20) - Luôn hiển thị */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <OrderCreateHeader orderBeingEdited={orderBeingEdited} />
      </div>

      {/* 2. Header Tìm Kiếm (Animated, Z-10) - Ẩn khi scroll */}
      {/* Nó nằm ngay dưới Header Tiêu đề (top ~ 53px hoặc ~78px). 
          Khi ẩn, nó trượt lên trên (Y negative) để chui xuống dưới Header Tiêu đề. */}
      <motion.div
        className="absolute left-0 right-0 z-10"
        initial={{ top: headerHeight }}
        animate={{
          top: headerHeight,
          y: isSearchVisible ? 0 : -searchBarHeight, // Trượt lên bằng chiều cao thanh tìm kiếm
        }}
        transition={{ duration: 0.3 }}
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <ProductFilterHeader
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
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
          filteredProducts={visibleProducts}
          getAvailableStock={getAvailableStock}
          handleScroll={handleScrollCombined}
          style={listStyle} // Sử dụng style đã được memoized
          cart={cart}
          selectedWarehouse={selectedWarehouse}
          orderBeingEdited={orderBeingEdited}
          adjustQuantity={adjustQuantity}
          handleQuantityChange={handleQuantityChange}
          activeCategory={activeCategory}
          // Filter Props truyền xuống để render trong luồng
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
        customers={customers}
        isCustomerNameTaken={isCustomerNameTaken}
        setPriceOverrides={setPriceOverrides}
      />
    </div>
  );
};

export default OrderCreateView;
