import React from "react";
import { AnimatePresence } from "framer-motion";
// Tách giao diện tạo đơn/danh sách đơn để file Orders.jsx gọn hơn
import OrderCreateView from "./orders/OrderCreateView";
import OrderListView from "./orders/OrderListView";
import OrderDetailModal from "./orders/OrderDetailModal";
import ConfirmModalHost from "../components/modals/ConfirmModalHost";
import ErrorModal from "../components/modals/ErrorModal";
import ScreenTransition from "../components/common/ScreenTransition";
import useOrdersLogic from "../hooks/useOrdersLogic";

const Orders = ({
  products,
  setProducts,
  orders,
  setOrders,
  settings,
  setTabBarVisible,
}) => {
  const {
    cart,
    showScanner,
    setShowScanner,
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
    orderBeingEdited,
    totalAmount,
    reviewItems,
    filteredProducts,
    selectedWarehouse,
    setSelectedWarehouse,
    handleQuantityChange,
    adjustQuantity,
    handleScanForSale,
    handleCreateOrder,
    handleUpdateOrder,
    handleStartCreate,
    handleEditOrder,
    handleExitCreate,
    handleCancelDraft,
    handleTogglePaid,
    handleCancelOrder,
    getOrderStatusInfo,
    isCreateView,
    shouldShowDetailModal,
  } = useOrdersLogic({ products, setProducts, orders, setOrders });

  // Khi vào màn hình Tạo đơn (isCreateView = true), ẩn TabBar để mở rộng không gian
  React.useEffect(() => {
    if (setTabBarVisible) {
      setTabBarVisible(!isCreateView);
    }
  }, [isCreateView, setTabBarVisible]);

  const renderContent = () => {
    if (isCreateView) {
      return (
        <OrderCreateView
          settings={settings}
          cart={cart}
          showScanner={showScanner}
          setShowScanner={setShowScanner}
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
          filteredProducts={filteredProducts}
          totalAmount={totalAmount}
          reviewItems={reviewItems}
          isReviewOpen={isReviewOpen}
          hideBackButton={Boolean(confirmModal)}
          orderComment={orderComment}
          setOrderComment={setOrderComment}
          handleExitCreate={handleExitCreate}
          handleCancelDraft={handleCancelDraft}
          handleScanForSale={handleScanForSale}
          handleQuantityChange={handleQuantityChange}
          adjustQuantity={adjustQuantity}
          handleOpenReview={() => setIsReviewOpen(true)}
          handleCloseReview={() => setIsReviewOpen(false)}
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
                handleExitCreate();
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
        />
        <OrderDetailModal
          order={selectedOrder}
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
