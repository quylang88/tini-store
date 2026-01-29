import React, { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
// Tách giao diện tạo đơn/danh sách đơn để file Orders.jsx gọn hơn
import OrderCreateView from "./orders/OrderCreateView";
import OrderListView from "./orders/OrderListView";
import OrderDetailModal from "../components/orders/OrderDetailModal";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import ScreenTransition from "../components/common/ScreenTransition";
import useOrdersLogic from "../hooks/orders/useOrdersLogic";

const Orders = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  setTabBarVisible,
  customers, // New prop
  setCustomers, // New prop
  updateFab,
  isActive,
}) => {
  const {
    cart,
    selectedOrder,
    setSelectedOrder,
    isReviewOpen,
    setIsReviewOpen,
    orderComment,
    setOrderComment,
    confirmModal,
    setConfirmModal,
    errorModal,
    setErrorModal,
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
    orderBeingEdited,
    totalAmount,
    reviewItems,
    filteredProducts,
    selectedWarehouse,
    setSelectedWarehouse,
    handleQuantityChange,
    adjustQuantity,
    handleCreateOrder,
    handleUpdateOrder,
    handleStartCreate,
    handleEditOrder,
    handleExitCreate,
    finishCreateOrder,
    handleCancelDraft,
    handleTogglePaid,
    handleCancelOrder,
    getOrderStatusInfo,
    isCreateView,
    sortConfig,
    setSortConfig,
    // customers, <-- Removed because it's now a prop, not returned by useOrdersLogic (actually useOrdersLogic passes it through, so checking below)
    isCustomerNameTaken,
    setPriceOverrides,
  } = useOrdersLogic({
    products,
    setProducts,
    orders,
    setOrders,
    setTabBarVisible,
    customers, // Pass down
    setCustomers, // Pass down
  });

  useEffect(() => {
    if (isCreateView) {
      updateFab({ isVisible: false });
    }
  }, [isCreateView, updateFab]);

  const renderContent = () => {
    if (isCreateView) {
      return (
        <OrderCreateView
          setTabBarVisible={setTabBarVisible} // Pass TabBar control to Create View
          settings={settings}
          cart={cart}
          orderBeingEdited={orderBeingEdited}
          selectedWarehouse={selectedWarehouse}
          setSelectedWarehouse={setSelectedWarehouse}
          orderType={orderType}
          setOrderType={setOrderType}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerAddress={customerAddress}
          setCustomerAddress={setCustomerAddress}
          shippingFee={shippingFee}
          setShippingFee={setShippingFee}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          debouncedSearchTerm={debouncedSearchTerm}
          filteredProducts={filteredProducts}
          totalAmount={totalAmount}
          reviewItems={reviewItems}
          isReviewOpen={isReviewOpen}
          hideBackButton={Boolean(confirmModal)}
          orderComment={orderComment}
          setOrderComment={setOrderComment}
          handleExitCreate={handleExitCreate}
          handleCancelDraft={handleCancelDraft}
          handleQuantityChange={handleQuantityChange}
          adjustQuantity={adjustQuantity}
          handleOpenReview={() => setIsReviewOpen(true)}
          handleCloseReview={() => setIsReviewOpen(false)}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          customers={customers}
          isCustomerNameTaken={isCustomerNameTaken}
          setPriceOverrides={setPriceOverrides}
          handleConfirmOrder={() => {
            let success = false;
            if (orderBeingEdited) {
              success = handleUpdateOrder();
            } else {
              success = handleCreateOrder();
            }
            // Chỉ đóng modal review nếu thao tác thành công (trả về true)
            // Nếu validation thất bại (trả về false), giữ modal để user sửa.
            if (success) {
              setIsReviewOpen(false);
              // Wait for modal exit animation before switching view
              setTimeout(() => {
                finishCreateOrder();
              }, 300);
            }
          }}
        />
      );
    }

    return (
      <>
        <OrderListView
          orders={orders}
          onCreateOrder={handleStartCreate}
          getOrderStatusInfo={getOrderStatusInfo}
          handleTogglePaid={handleTogglePaid}
          handleEditOrder={handleEditOrder}
          handleCancelOrder={handleCancelOrder}
          onSelectOrder={setSelectedOrder}
          setTabBarVisible={setTabBarVisible}
          updateFab={updateFab}
          isActive={isActive}
        />
        <OrderDetailModal
          order={selectedOrder}
          products={products}
          onClose={() => setSelectedOrder(null)}
          getOrderStatusInfo={getOrderStatusInfo}
        />
      </>
    );
  };

  const direction = isCreateView ? 1 : -1;

  return (
    <>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <ScreenTransition
          key={isCreateView ? "orders-create" : "orders-list"}
          className="h-full"
          custom={direction}
          onSwipeBack={isCreateView ? handleExitCreate : undefined}
        >
          {renderContent()}
        </ScreenTransition>
      </AnimatePresence>

      {/* Modal chung cho các hành động xác nhận/nhập phí gửi */}
      <ConfirmModalHost
        modal={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

      {/* Modal cảnh báo khi thiếu thông tin đầu vào */}
      <ErrorModal
        open={Boolean(errorModal)}
        title={errorModal?.title}
        message={errorModal?.message}
        onClose={() => setErrorModal(null)}
      />
    </>
  );
};

export default Orders;
