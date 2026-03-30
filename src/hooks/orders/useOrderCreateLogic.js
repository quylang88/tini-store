import { useState, useCallback } from "react";
import useOrderCatalog from "./useOrderCatalog";
import { buildCartFromItems } from "../../utils/orders/orderDraftUtils";
import useCartLogic from "./useCartLogic";
import useOrderFormLogic from "./useOrderFormLogic";
import useOrderSubmitLogic from "../../utils/orders/useOrderSubmitLogic";
import {
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";
import useCustomerLogic from "../customer/useCustomerLogic";
import useDebounce from "../core/useDebounce";

const DEFAULT_ORDER_TYPE = "delivery";

const useOrderCreateLogic = ({
  products,
  setProducts,
  orders,
  setOrders,
  setConfirmModal,
  setErrorModal,
  onExit,
  onFinish,
  customers: customersProp, // Receive prop
  setCustomers, // Receive prop
}) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    getDefaultWarehouse().key,
  );
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [orderBeingEdited, setOrderBeingEdited] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [priceOverrides, setPriceOverrides] = useState({});

  // Các hook con
  const {
    customers,
    processOrderForCustomer,
    isCustomerNameTaken,
    EXCLUDED_CUSTOMERS,
  } = useCustomerLogic({
    customers: customersProp,
    setCustomers,
  });

  const { cart, setCart, handleQuantityChange, adjustQuantity, clearCart } =
    useCartLogic();

  const {
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    customerAddress,
    setCustomerAddress,
    shippingFee,
    setShippingFee,
    orderComment,
    setOrderComment,
    clearOrderForm,
    setOrderTypeRaw,
    setShippingFeeRaw,
  } = useOrderFormLogic();

  const { filteredProducts, reviewItems, totalAmount, getAvailableStock } =
    useOrderCatalog({
      products,
      cart,
      priceOverrides,
      searchTerm: debouncedSearchTerm,
      activeCategory,
      selectedWarehouse,
      orderBeingEdited,
      sortConfig,
    });

  const resetDraft = useCallback(() => {
    clearCart();
    setPriceOverrides({});
    clearOrderForm();
    setOrderBeingEdited(null);
    setSearchTerm("");
    setActiveCategory("Tất cả");
    setIsReviewOpen(false);
    setSelectedWarehouse(getDefaultWarehouse().key);
    setSortConfig({ key: "date", direction: "desc" });
  }, [clearCart, clearOrderForm]);

  // Adapter for useOrderSubmitLogic to handle view switching
  const handleViewChange = useCallback(
    (view) => {
      if (view === "list" && onFinish) {
        onFinish();
      }
    },
    [onFinish],
  );

  const { handleCreateOrder, handleUpdateOrder, finishCreateOrder } =
    useOrderSubmitLogic({
      products,
      setProducts,
      orders,
      setOrders,
      cart,
      orderType,
      customerName,
      customerAddress,
      shippingFee,
      orderComment,
      selectedWarehouse,
      reviewItems,
      totalAmount,
      orderBeingEdited,
      clearDraft: resetDraft,
      setView: handleViewChange,
      setConfirmModal,
      setErrorModal,
      processOrderForCustomer,
    });

  const hasDraftChanges = () => {
    if (!orderBeingEdited) {
      return Object.keys(cart).length > 0 || orderComment.trim().length > 0;
    }

    const originalCart = buildCartFromItems(orderBeingEdited.items);
    const currentKeys = Object.keys(cart);
    const originalKeys = Object.keys(originalCart);
    const isSameCart =
      currentKeys.length === originalKeys.length &&
      currentKeys.every((key) => cart[key] === originalCart[key]);
    const isSameComment =
      orderComment.trim() === (orderBeingEdited.comment || "").trim();
    const isSameOrderType =
      (orderBeingEdited.orderType || DEFAULT_ORDER_TYPE) === orderType;
    const isSameCustomerName =
      (orderBeingEdited.customerName || "").trim() === customerName.trim();
    const isSameCustomerAddress =
      (orderBeingEdited.customerAddress || "").trim() ===
      customerAddress.trim();
    const isSameShippingFee =
      Number(orderBeingEdited.shippingFee || 0) === Number(shippingFee || 0);

    return !(
      isSameCart &&
      isSameComment &&
      isSameOrderType &&
      isSameCustomerName &&
      isSameCustomerAddress &&
      isSameShippingFee
    );
  };

  const handleExitCreate = () => {
    if (hasDraftChanges()) {
      setConfirmModal({
        title: orderBeingEdited ? "Thoát sửa đơn?" : "Thoát tạo đơn hàng?",
        message: orderBeingEdited
          ? "Bạn có chắc muốn thoát? Các chỉnh sửa sẽ bị huỷ."
          : "Bạn có chắc muốn thoát? Các sản phẩm trong đơn hàng sẽ bị xoá.",
        confirmLabel: "Thoát",
        tone: "danger",
        onConfirm: () => {
          resetDraft();
          if (onExit) onExit();
        },
      });
      return;
    }
    resetDraft();
    if (onExit) onExit();
  };

  const handleCancelDraft = () => {
    if (!hasDraftChanges()) {
      handleExitCreate();
      return;
    }
    setConfirmModal({
      title: orderBeingEdited ? "Huỷ chỉnh sửa?" : "Huỷ đơn?",
      message: "Bạn có chắc muốn huỷ thao tác hiện tại không?",
      confirmLabel: "Huỷ",
      tone: "danger",
      onConfirm: () => {
        resetDraft();
        if (onExit) onExit();
      },
    });
  };

  const setupEditOrder = useCallback(
    (order) => {
      setCart(buildCartFromItems(order.items));

      const overrides = {};
      if (order.items) {
        order.items.forEach((item) => {
          overrides[item.productId || item.id] = item.price;
        });
      }
      setPriceOverrides(overrides);

      setOrderBeingEdited(order);
      setOrderComment(order.comment || "");
      setSelectedWarehouse(
        resolveWarehouseKey(order.warehouse) || getDefaultWarehouse().key,
      );

      const inferredOrderType =
        order.orderType ||
        (order.customerName || order.customerAddress || order.shippingFee
          ? "delivery"
          : "warehouse");
      setOrderTypeRaw(inferredOrderType);
      setCustomerName(order.customerName || "");
      setCustomerAddress(order.customerAddress || "");
      setShippingFeeRaw(order.shippingFee ? String(order.shippingFee) : "");

      setSearchTerm("");
      setActiveCategory("Tất cả");
      setIsReviewOpen(false);
    },
    [
      setCart,
      setOrderBeingEdited,
      setOrderComment,
      setSelectedWarehouse,
      setOrderTypeRaw,
      setCustomerName,
      setCustomerAddress,
      setShippingFeeRaw,
      setPriceOverrides,
    ],
  );

  const setupNewOrder = useCallback(() => {
    resetDraft();
  }, [resetDraft]);

  return {
    cart,
    isReviewOpen,
    setIsReviewOpen,
    orderComment,
    setOrderComment,
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
    getAvailableStock,
    filteredProducts,
    handleQuantityChange,
    adjustQuantity,
    handleCreateOrder,
    handleUpdateOrder,
    handleExitCreate,
    finishCreateOrder,
    handleCancelDraft,
    selectedWarehouse,
    setSelectedWarehouse,
    sortConfig,
    setSortConfig,
    priceOverrides,
    setPriceOverrides,
    customers,
    isCustomerNameTaken,
    EXCLUDED_CUSTOMERS,
    setupEditOrder,
    setupNewOrder,
    resetDraft,
  };
};

export default useOrderCreateLogic;
