import React from 'react';
// Tách giao diện tạo đơn/danh sách đơn để file Orders.jsx gọn hơn
import OrderCreateView from '../components/orders/OrderCreateView';
import OrderListView from '../components/orders/OrderListView';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import ConfirmModalHost from '../components/modals/ConfirmModalHost';
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
    </>
  );
};

export default Orders;
