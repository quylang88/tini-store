import { useState, useCallback } from "react";
import { syncProductsStock } from "../../utils/orders/orderStock";
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

const DEFAULT_STATUS = "shipping";
const DEFAULT_ORDER_TYPE = "delivery";

const getOrderStatusInfo = (order) => {
  if (order.status === "paid") {
    return {
      label: "Đã thanh toán",
      badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-600",
      dotClass: "bg-emerald-500",
    };
  }
  if (order.status === "pending") {
    return {
      label: "Đang chờ thanh toán",
      badgeClass: "border-orange-300 bg-orange-50 text-orange-600",
      dotClass: "bg-orange-500",
    };
  }
  return {
    // Trạng thái mặc định là đang giao hàng theo yêu cầu mới.
    label: "Đang giao hàng",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-600",
    dotClass: "bg-sky-500",
  };
};

const useOrdersLogic = ({
  products,
  setProducts,
  orders,
  setOrders,
  setTabBarVisible,
}) => {
  const [view, setView] = useState("list");
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
  const [showScanner, setShowScanner] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal cảnh báo khi thiếu thông tin hoặc thao tác chưa hợp lệ.
  const [errorModal, setErrorModal] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(
    getDefaultWarehouse().key,
  );
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBeingEdited, setOrderBeingEdited] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const [priceOverrides, setPriceOverrides] = useState({});

  // Sub-hooks
  const {
    customers,
    processOrderForCustomer,
    isCustomerNameTaken,
    EXCLUDED_CUSTOMERS,
  } = useCustomerLogic();
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

  // Trạng thái hiển thị màn hình tạo đơn và modal chi tiết đơn
  const isCreateView = view === "create";
  const shouldShowDetailModal = view === "list" && Boolean(selectedOrder);

  const { getAvailableStock, filteredProducts, reviewItems, totalAmount } =
    useOrderCatalog({
      products,
      cart,
      priceOverrides,
      searchTerm,
      activeCategory,
      selectedWarehouse,
      orderBeingEdited,
      sortConfig,
    });

  const clearDraft = () => {
    clearCart();
    setPriceOverrides({});
    clearOrderForm();
    setOrderBeingEdited(null);
    setSearchTerm("");
    setActiveCategory("Tất cả");
    setIsReviewOpen(false);
    setSelectedWarehouse(getDefaultWarehouse().key);
    setSortConfig({ key: "date", direction: "desc" });
  };

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
      clearDraft,
      setView: updateView,
      setConfirmModal,
      setErrorModal,
      processOrderForCustomer,
    });

  const handleScanForSale = (decodedText) => {
    setShowScanner(false);
    const product = products.find((item) => item.barcode === decodedText);
    if (!product) {
      // Cảnh báo khi không tìm thấy sản phẩm theo mã vạch.
      setErrorModal({
        title: "Không tìm thấy sản phẩm",
        message: "Không tìm thấy sản phẩm với mã vạch này.",
      });
      return;
    }
    const availableStock = getAvailableStock(product, selectedWarehouse);
    if (availableStock <= 0) {
      // Cảnh báo khi sản phẩm đã hết hàng trong kho đang chọn.
      setErrorModal({
        title: "Hết hàng",
        message: "Sản phẩm này đã hết hàng.",
      });
      return;
    }
    // Quét mã vạch thì tự cộng 1 sản phẩm nếu còn hàng.
    // Dùng hàm updateCartItem từ useCartLogic.
    // Lưu ý adjustQuantity của useCartLogic sẽ call updateCartItem.
    // Ở đây ta muốn logic giống adjustQuantity(id, 1, stock)
    adjustQuantity(product.id, 1, availableStock);
  };

  const handleStartCreate = () => {
    clearDraft();
    setSelectedOrder(null);
    updateView("create");
  };

  // So sánh giỏ hiện tại với đơn gốc để biết user đã chỉnh sửa gì chưa.
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
          clearDraft();
          updateView("list");
        },
      });
      return;
    }
    clearDraft();
    updateView("list");
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
        clearDraft();
        updateView("list");
      },
    });
  };

  const handleEditOrder = useCallback(
    (order) => {
      setCart(buildCartFromItems(order.items));

      // Restore price overrides from order items
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
      // Ưu tiên orderType đã lưu, nếu thiếu thì đoán theo thông tin giao hàng.
      const inferredOrderType =
        order.orderType ||
        (order.customerName || order.customerAddress || order.shippingFee
          ? "delivery"
          : "warehouse");
      setOrderTypeRaw(inferredOrderType);
      setCustomerName(order.customerName || "");
      setCustomerAddress(order.customerAddress || "");
      setShippingFeeRaw(order.shippingFee ? String(order.shippingFee) : "");
      setSelectedOrder(null);
      setSearchTerm("");
      setActiveCategory("Tất cả");
      setIsReviewOpen(false);
      updateView("create");
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
      setSelectedOrder,
      setSearchTerm,
      setActiveCategory,
      setIsReviewOpen,
      updateView,
    ],
  );

  const handleTogglePaid = useCallback(
    (order) => {
      // LƯU Ý: order được truyền trực tiếp, không cần tìm lại trong mảng orders
      const isPaid = order.status === "paid";

      // Hiển thị popup xác nhận trước khi đổi trạng thái thanh toán.
      setConfirmModal({
        title: isPaid ? "Huỷ thanh toán?" : "Xác nhận thanh toán?",
        message: isPaid
          ? "Bạn có chắc muốn huỷ trạng thái đã thanh toán cho đơn hàng này không?"
          : "Bạn có chắc đơn hàng này đã được thanh toán đầy đủ chưa?",
        confirmLabel: isPaid ? "Huỷ thanh toán" : "Đã thanh toán",
        tone: isPaid ? "danger" : "rose",
        onConfirm: () => {
          setOrders((prev) =>
            prev.map((item) => {
              if (item.id !== order.id) return item;
              let nextStatus = "paid";
              if (item.status === "paid") {
                // Khi huỷ thanh toán, trả về trạng thái ban đầu dựa trên loại đơn
                nextStatus =
                  item.orderType === "warehouse" ? "pending" : DEFAULT_STATUS;
              }
              return { ...item, status: nextStatus };
            }),
          );
        },
      });
    },
    [setConfirmModal, setOrders],
  );

  const handleCancelOrder = useCallback(
    (order) => {
      setConfirmModal({
        title: "Huỷ đơn?",
        message: `Bạn có chắc muốn huỷ đơn ${
          order.orderNumber ? `#${order.orderNumber}` : ""
        }?`,
        confirmLabel: "Huỷ đơn",
        tone: "danger",
        onConfirm: () => {
          setProducts((prevProducts) =>
            syncProductsStock(
              prevProducts,
              [],
              order.items,
              getDefaultWarehouse().key,
              resolveWarehouseKey(order.warehouse) || getDefaultWarehouse().key,
            ),
          );
          setOrders((prev) => prev.filter((item) => item.id !== order.id));
        },
      });
    },
    [setConfirmModal, setProducts, setOrders],
  );

  return {
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
    handleQuantityChange,
    adjustQuantity,
    handleScanForSale,
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
    selectedWarehouse,
    setSelectedWarehouse,
    isCreateView,
    shouldShowDetailModal,
    sortConfig,
    setSortConfig,
    priceOverrides,
    setPriceOverrides,
    customers,
    isCustomerNameTaken,
    EXCLUDED_CUSTOMERS,
  };
};

export default useOrdersLogic;
