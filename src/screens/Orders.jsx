import React, { useLayoutEffect } from 'react';
// Tách giao diện tạo đơn/danh sách đơn để file Orders.jsx gọn hơn
import OrderCreateView from '../components/orders/OrderCreateView';
import OrderListView from '../components/orders/OrderListView';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import ConfirmModalHost from '../components/modals/ConfirmModalHost';
import ErrorModal from '../components/modals/ErrorModal';
import ScreenTransition from '../components/common/ScreenTransition';
import useOrdersLogic from '../hooks/useOrdersLogic';

const Orders = ({ products, setProducts, orders, setOrders, settings }) => {
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

  useLayoutEffect(() => {
    // Khi vào màn tạo/sửa đơn thì ẩn tabbar bằng class, giúp tabbar biến mất mượt.
    if (isCreateView) {
      document.body.classList.add('tabbar-hidden');
    } else {
      document.body.classList.remove('tabbar-hidden');
    }

    return () => document.body.classList.remove('tabbar-hidden');
  }, [isCreateView]);

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
            if (orderBeingEdited) {
              handleUpdateOrder();
            } else {
              handleCreateOrder();
            }
            setIsReviewOpen(false);
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
        {shouldShowDetailModal && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            getOrderStatusInfo={getOrderStatusInfo}
          />
        )}
      </>
    );
  };

  return (
    <>
      {/* Bọc 2 trạng thái tạo đơn/danh sách để chuyển cảnh mượt khi đổi view. */}
      <ScreenTransition key={isCreateView ? 'orders-create' : 'orders-list'} className="h-full">
        {renderContent()}
      </ScreenTransition>
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
