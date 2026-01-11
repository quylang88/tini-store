import React from 'react';
// Tách giao diện tạo đơn/danh sách đơn để file Orders.jsx gọn hơn
import OrderCreateView from '../components/orders/OrderCreateView';
import OrderListView from '../components/orders/OrderListView';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import InputModal from '../components/modals/InputModal';
import useOrderActions from '../hooks/useOrderActions';
import { formatInputNumber } from '../utils/helpers';

const Orders = ({ products, setProducts, orders, setOrders, settings }) => {
  const {
    view,
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
    shippingModal,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    orderBeingEdited,
    totalAmount,
    reviewItems,
    filteredProducts,
    handleQuantityChange,
    adjustQuantity,
    handleScanForSale,
    handleCreateOrder,
    handleUpdateOrder,
    handleStartCreate,
    handleEditOrder,
    handleExitCreate,
    handleCancelDraft,
    handleExportToVietnam,
    handleTogglePaid,
    handleCancelOrder,
    getOrderStatusInfo,
    handleShippingChange,
    handleShippingCancel,
    handleShippingConfirm
  } = useOrderActions({ products, setProducts, orders, setOrders });

  const renderContent = () => {
    if (view === 'create') {
      return (
        <OrderCreateView
          settings={settings}
          cart={cart}
          showScanner={showScanner}
          setShowScanner={setShowScanner}
          orderBeingEdited={orderBeingEdited}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredProducts={filteredProducts}
          totalAmount={totalAmount}
          reviewItems={reviewItems}
          isReviewOpen={isReviewOpen}
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
          handleExportToVietnam={handleExportToVietnam}
          handleEditOrder={handleEditOrder}
          handleCancelOrder={handleCancelOrder}
          onSelectOrder={setSelectedOrder}
        />
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </>
    );
  };

  return (
    <>
      {renderContent()}
      {/* Modal chung cho các hành động xác nhận/nhập phí gửi */}
      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        tone={confirmModal?.tone}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          confirmModal?.onConfirm?.();
          setConfirmModal(null);
        }}
      />
      <InputModal
        open={shippingModal.open}
        title="Nhập phí gửi về VN"
        message="Vui lòng nhập số tiền phí gửi cho đơn hàng."
        error={shippingModal.error}
        value={formatInputNumber(shippingModal.fee)}
        inputProps={{ inputMode: 'numeric', placeholder: 'Ví dụ: 25,000' }}
        confirmLabel="Lưu phí gửi"
        onChange={handleShippingChange}
        onCancel={handleShippingCancel}
        onConfirm={handleShippingConfirm}
      />
    </>
  );
};

export default Orders;
