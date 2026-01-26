import { useState, useCallback } from "react";
import useOrderListLogic from "./useOrderListLogic";
import useOrderCreateLogic from "./useOrderCreateLogic";

const useOrdersLogic = ({
  products,
  setProducts,
  orders,
  setOrders,
  setTabBarVisible,
}) => {
  const [view, setView] = useState("list");

  // Các modal dùng chung (global level cho màn hình Orders)
  const [confirmModal, setConfirmModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);

  // Hàm helper để đồng bộ hiển thị TabBar với trạng thái View
  const updateView = useCallback(
    (newView) => {
      setView(newView);
      if (setTabBarVisible) {
        setTabBarVisible(newView === "list");
      }
    },
    [setTabBarVisible],
  );

  const listLogic = useOrderListLogic({
    orders,
    setOrders,
    products,
    setProducts,
    setConfirmModal,
  });

  const createLogic = useOrderCreateLogic({
    products,
    setProducts,
    orders,
    setOrders,
    setConfirmModal,
    setErrorModal,
    onExit: () => updateView("list"),
    onFinish: () => updateView("list"),
  });

  const { setSelectedOrder } = listLogic;
  const { setupEditOrder, setupNewOrder } = createLogic;

  const handleStartCreate = useCallback(() => {
    setSelectedOrder(null);
    setupNewOrder();
    updateView("create");
  }, [setupNewOrder, updateView, setSelectedOrder]);

  const handleEditOrder = useCallback(
    (order) => {
      setSelectedOrder(null);
      setupEditOrder(order);
      updateView("create");
    },
    [setupEditOrder, updateView, setSelectedOrder],
  );

  return {
    // Shared / Top level state
    confirmModal,
    setConfirmModal,
    errorModal,
    setErrorModal,
    isCreateView: view === "create",
    shouldShowDetailModal: view === "list" && Boolean(listLogic.selectedOrder),

    // List Logic Exposure
    selectedOrder: listLogic.selectedOrder,
    setSelectedOrder: listLogic.setSelectedOrder,
    handleTogglePaid: listLogic.handleTogglePaid,
    handleCancelOrder: listLogic.handleCancelOrder,
    getOrderStatusInfo: listLogic.getOrderStatusInfo,

    // Create Logic Exposure
    cart: createLogic.cart,
    showScanner: createLogic.showScanner,
    setShowScanner: createLogic.setShowScanner,
    isReviewOpen: createLogic.isReviewOpen,
    setIsReviewOpen: createLogic.setIsReviewOpen,
    orderComment: createLogic.orderComment,
    setOrderComment: createLogic.setOrderComment,
    orderType: createLogic.orderType,
    setOrderType: createLogic.setOrderType,
    customerName: createLogic.customerName,
    setCustomerName: createLogic.setCustomerName,
    customerAddress: createLogic.customerAddress,
    setCustomerAddress: createLogic.setCustomerAddress,
    shippingFee: createLogic.shippingFee,
    setShippingFee: createLogic.setShippingFee,
    activeCategory: createLogic.activeCategory,
    setActiveCategory: createLogic.setActiveCategory,
    searchTerm: createLogic.searchTerm,
    setSearchTerm: createLogic.setSearchTerm,
    orderBeingEdited: createLogic.orderBeingEdited,
    totalAmount: createLogic.totalAmount,
    reviewItems: createLogic.reviewItems,
    filteredProducts: createLogic.filteredProducts,
    handleQuantityChange: createLogic.handleQuantityChange,
    adjustQuantity: createLogic.adjustQuantity,
    handleScanForSale: createLogic.handleScanForSale,
    handleCreateOrder: createLogic.handleCreateOrder,
    handleUpdateOrder: createLogic.handleUpdateOrder,
    handleExitCreate: createLogic.handleExitCreate,
    finishCreateOrder: createLogic.finishCreateOrder,
    handleCancelDraft: createLogic.handleCancelDraft,
    selectedWarehouse: createLogic.selectedWarehouse,
    setSelectedWarehouse: createLogic.setSelectedWarehouse,
    sortConfig: createLogic.sortConfig,
    setSortConfig: createLogic.setSortConfig,
    priceOverrides: createLogic.priceOverrides,
    setPriceOverrides: createLogic.setPriceOverrides,
    customers: createLogic.customers,
    isCustomerNameTaken: createLogic.isCustomerNameTaken,
    EXCLUDED_CUSTOMERS: createLogic.EXCLUDED_CUSTOMERS,

    // Bridge functions
    handleStartCreate,
    handleEditOrder,
  };
};

export default useOrdersLogic;
