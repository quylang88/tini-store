import { useState } from "react";
import { sanitizeNumberInput } from "../utils/helpers";
import { syncProductsStock } from "../utils/orderStock";
import useOrderCatalog from "./orders/useOrderCatalog";
import { buildCartFromItems } from "./orders/orderDraftUtils";

const DEFAULT_STATUS = "shipping";
const DEFAULT_WAREHOUSE = "daLat";
const DEFAULT_ORDER_TYPE = "delivery";

const useOrdersLogic = ({ products, setProducts, orders, setOrders }) => {
  const [view, setView] = useState("list");
  const [cart, setCart] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [orderComment, setOrderComment] = useState("");
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal cảnh báo khi thiếu thông tin hoặc thao tác chưa hợp lệ.
  const [errorModal, setErrorModal] = useState(null);
  const [orderType, setOrderType] = useState(DEFAULT_ORDER_TYPE);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [shippingFee, setShippingFee] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState(DEFAULT_WAREHOUSE);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceOverrides, setPriceOverrides] = useState({});
  const [orderBeingEdited, setOrderBeingEdited] = useState(null);
  // Trạng thái hiển thị màn hình tạo đơn và modal chi tiết đơn
  const isCreateView = view === "create";
  const shouldShowDetailModal = view === "list" && Boolean(selectedOrder);

  // Hàm kẹp số lượng trong khoảng hợp lệ để không vượt tồn kho.
  const clampQuantity = (value, availableStock) =>
    Math.max(0, Math.min(availableStock, value));

  // Cập nhật giỏ hàng theo công thức tính số lượng tiếp theo để tránh lặp code.
  const updateCartItem = (productId, computeNextQuantity) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const nextValue = computeNextQuantity(current);
      if (!nextValue) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: nextValue };
    });
  };

  const { getAvailableStock, filteredProducts, reviewItems, totalAmount } =
    useOrderCatalog({
      products,
      cart,
      searchTerm,
      activeCategory,
      selectedWarehouse,
      orderBeingEdited,
      priceOverrides,
    });

  const clearDraft = () => {
    setCart({});
    setOrderComment("");
    setOrderBeingEdited(null);
    setSearchTerm("");
    setPriceOverrides({});
    setActiveCategory("Tất cả");
    setIsReviewOpen(false);
    setSelectedWarehouse(DEFAULT_WAREHOUSE);
    // Reset thông tin gửi khách khi tạo đơn mới để tránh sót dữ liệu cũ.
    setOrderType(DEFAULT_ORDER_TYPE);
    setCustomerName("");
    setCustomerAddress("");
    setShippingFee("");
  };

  const handleQuantityChange = (productId, value, availableStock) => {
    // Khi nhập trực tiếp, chỉ nhận số hợp lệ và không vượt tồn kho.
    updateCartItem(productId, () =>
      clampQuantity(Number(value) || 0, availableStock)
    );
  };

  const adjustQuantity = (productId, delta, availableStock) => {
    // Khi bấm +/- thì cộng dồn rồi kẹp lại theo tồn kho.
    updateCartItem(productId, (current) =>
      clampQuantity(current + delta, availableStock)
    );
  };

  const handlePriceChange = (productId, value) => {
    const sanitized = sanitizeNumberInput(value);
    setPriceOverrides((prev) => ({ ...prev, [productId]: sanitized }));
  };

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
    updateCartItem(product.id, (current) =>
      clampQuantity(current + 1, availableStock)
    );
  };

  const handleStartCreate = () => {
    clearDraft();
    setSelectedOrder(null);
    setView("create");
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
          setView("list");
        },
      });
      return;
    }
    clearDraft();
    setView("list");
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
        setView("list");
      },
    });
  };

  const getNextOrderNumber = () => {
    // Tạo số đơn 4 chữ số ngẫu nhiên để thay thế STT tuần tự.
    const usedNumbers = new Set(
      orders.map((order) => String(order.orderNumber)).filter(Boolean)
    );
    const generateNumber = () =>
      String(Math.floor(1000 + Math.random() * 9000));
    let nextNumber = generateNumber();
    let attempts = 0;
    while (usedNumbers.has(nextNumber) && attempts < 20) {
      nextNumber = generateNumber();
      attempts += 1;
    }
    // Nếu trùng quá nhiều thì fallback về 4 số cuối của timestamp.
    if (usedNumbers.has(nextNumber)) {
      nextNumber = String(Date.now()).slice(-4);
    }
    return nextNumber;
  };

  const normalizeShippingFee = () => {
    // Chỉ tính phí gửi khi đơn là gửi khách, còn bán tại kho thì 0.
    return orderType === "delivery" ? Number(shippingFee || 0) : 0;
  };

  // Kiểm tra điều kiện tối thiểu trước khi tạo/cập nhật đơn.
  const ensureOrderReady = (actionLabel) => {
    if (reviewItems.length === 0) {
      // Cảnh báo khi chưa chọn sản phẩm nào.
      setErrorModal({
        title: "Thiếu sản phẩm",
        message: "Vui lòng chọn ít nhất 1 sản phẩm trước khi thao tác.",
      });
      return false;
    }
    if (
      orderType === "delivery" &&
      (!customerName.trim() || !customerAddress.trim())
    ) {
      // Mở modal cảnh báo khi thiếu thông tin gửi khách.
      setErrorModal({
        title: "Thiếu thông tin khách hàng",
        message: `Vui lòng nhập tên và địa chỉ khách hàng trước khi ${actionLabel}.`,
      });
      return false;
    }
    return true;
  };

  const buildOrderPayload = () => {
    // Chuẩn hoá dữ liệu đơn để dùng chung cho tạo mới và cập nhật.
    const orderItems = reviewItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      cost: item.cost,
    }));

    return {
      items: orderItems,
      total: totalAmount,
      warehouse: selectedWarehouse,
      orderType,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      shippingFee: normalizeShippingFee(),
    };
  };

  // Hàm dùng chung để lưu đơn (tạo mới hoặc cập nhật)
  const saveOrder = ({ isUpdate }) => {
    if (!ensureOrderReady(isUpdate ? "cập nhật đơn" : "tạo đơn")) return false;

    const payload = buildOrderPayload();
    const { items, warehouse } = payload;

    // Cập nhật giá sản phẩm toàn cục nếu có thay đổi trong đơn hàng
    setProducts((prevProducts) => {
      const productsWithUpdatedPrices = prevProducts.map((p) => {
        const item = items.find((i) => i.productId === p.id);
        if (item && item.price !== p.price) {
          return { ...p, price: item.price };
        }
        return p;
      });

      // Lấy danh sách sản phẩm cũ nếu đang sửa đơn để sync stock
      const previousItems = isUpdate ? orderBeingEdited.items : [];
      const previousWarehouse = isUpdate
        ? orderBeingEdited.warehouse || DEFAULT_WAREHOUSE
        : null;

      return syncProductsStock(
        productsWithUpdatedPrices,
        items,
        previousItems,
        warehouse,
        previousWarehouse
      );
    });

    if (isUpdate) {
      const updatedOrder = {
        ...orderBeingEdited,
        ...payload,
        comment: orderComment.trim(),
      };
      setOrders(
        orders.map((order) =>
          order.id === orderBeingEdited.id ? updatedOrder : order
        )
      );
    } else {
      const newOrder = {
        id: Date.now().toString(),
        orderNumber: getNextOrderNumber(),
        status: DEFAULT_STATUS,
        date: new Date().toISOString(),
        ...payload,
        comment: orderComment.trim(),
      };
      setOrders([...orders, newOrder]);
    }

    clearDraft();
    // setView("list"); // Removed: Let the UI handle the transition timing
    return true;
  };

  const handleCreateOrder = () => saveOrder({ isUpdate: false });
  const handleUpdateOrder = () => saveOrder({ isUpdate: true });

  const handleEditOrder = (order) => {
    setCart(buildCartFromItems(order.items));
    setOrderBeingEdited(order);
    setOrderComment(order.comment || "");
    setSelectedWarehouse(order.warehouse || DEFAULT_WAREHOUSE);
    // Ưu tiên orderType đã lưu, nếu thiếu thì đoán theo thông tin giao hàng.
    const inferredOrderType =
      order.orderType ||
      (order.customerName || order.customerAddress || order.shippingFee
        ? "delivery"
        : "warehouse");
    setOrderType(inferredOrderType);
    setCustomerName(order.customerName || "");
    setCustomerAddress(order.customerAddress || "");
    setShippingFee(order.shippingFee ? String(order.shippingFee) : "");
    setSelectedOrder(null);
    setSearchTerm("");
    setActiveCategory("Tất cả");
    setIsReviewOpen(false);
    setView("create");
  };

  const handleTogglePaid = (orderId) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
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
            if (item.id !== orderId) return item;
            const nextStatus = item.status === "paid" ? DEFAULT_STATUS : "paid";
            return { ...item, status: nextStatus };
          })
        );
      },
    });
  };

  const handleOrderTypeChange = (value) => {
    setOrderType(value);
    if (value === "warehouse") {
      // Chuyển sang bán tại kho thì xoá thông tin gửi khách và phí gửi.
      setCustomerName("");
      setCustomerAddress("");
      setShippingFee("");
    }
  };

  const handleShippingFeeChange = (value) => {
    // Chỉ cho phép nhập số để đảm bảo phí gửi hợp lệ.
    const sanitized = sanitizeNumberInput(value);
    setShippingFee(sanitized);
  };

  const handleCancelOrder = (orderId) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
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
            DEFAULT_WAREHOUSE,
            order.warehouse || DEFAULT_WAREHOUSE
          )
        );
        setOrders(orders.filter((item) => item.id !== orderId));
      },
    });
  };

  const getOrderStatusInfo = (order) => {
    if (order.status === "paid") {
      return {
        label: "Đã thanh toán",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-600",
        dotClass: "bg-emerald-500",
      };
    }
    return {
      // Trạng thái mặc định là đang giao hàng theo yêu cầu mới.
      label: "Đang giao hàng",
      badgeClass: "border-sky-200 bg-sky-50 text-sky-600",
      dotClass: "bg-sky-500",
    };
  };

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
    setOrderType: handleOrderTypeChange,
    customerName,
    setCustomerName,
    customerAddress,
    setCustomerAddress,
    shippingFee,
    setShippingFee: handleShippingFeeChange,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    orderBeingEdited,
    totalAmount,
    reviewItems,
    filteredProducts,
    priceOverrides,
    handlePriceChange,
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
    selectedWarehouse,
    setSelectedWarehouse,
    isCreateView,
    shouldShowDetailModal,
  };
};

export default useOrdersLogic;
