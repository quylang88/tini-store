import { useState } from 'react';
import { sanitizeNumberInput } from '../utils/helpers';
import { syncProductsStock } from '../utils/orderStock';
import useOrderCatalog from './orders/useOrderCatalog';
import { buildCartFromItems } from './orders/orderDraftUtils';

const DEFAULT_STATUS = 'pending';
const DEFAULT_WAREHOUSE = 'daLat';

const useOrdersLogic = ({ products, setProducts, orders, setOrders }) => {
  const [view, setView] = useState('list');
  const [cart, setCart] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [orderComment, setOrderComment] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [shippingModal, setShippingModal] = useState({
    open: false,
    fee: '',
    orderId: null,
    error: '',
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState(DEFAULT_WAREHOUSE);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBeingEdited, setOrderBeingEdited] = useState(null);
  // Trạng thái hiển thị màn hình tạo đơn và modal chi tiết đơn
  const isCreateView = view === 'create';
  const shouldShowDetailModal = view === 'list' && Boolean(selectedOrder);

  const {
    getAvailableStock,
    filteredProducts,
    reviewItems,
    totalAmount,
  } = useOrderCatalog({
    products,
    cart,
    searchTerm,
    activeCategory,
    selectedWarehouse,
    orderBeingEdited,
  });

  const clearDraft = () => {
    setCart({});
    setOrderComment('');
    setOrderBeingEdited(null);
    setSearchTerm('');
    setActiveCategory('Tất cả');
    setIsReviewOpen(false);
    setSelectedWarehouse(DEFAULT_WAREHOUSE);
  };

  const handleQuantityChange = (productId, value, availableStock) => {
    const nextValue = Math.max(0, Math.min(availableStock, Number(value) || 0));
    setCart((prev) => {
      if (!nextValue) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: nextValue };
    });
  };

  const adjustQuantity = (productId, delta, availableStock) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const nextValue = Math.max(0, Math.min(availableStock, current + delta));
      if (!nextValue) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: nextValue };
    });
  };

  const handleScanForSale = (decodedText) => {
    setShowScanner(false);
    const product = products.find((item) => item.barcode === decodedText);
    if (!product) {
      alert('Không tìm thấy sản phẩm với mã vạch này.');
      return;
    }
    const availableStock = getAvailableStock(product, selectedWarehouse);
    if (availableStock <= 0) {
      alert('Sản phẩm này đã hết hàng.');
      return;
    }
    setCart((prev) => {
      const current = prev[product.id] || 0;
      const nextValue = Math.min(availableStock, current + 1);
      return { ...prev, [product.id]: nextValue };
    });
  };

  const handleStartCreate = () => {
    clearDraft();
    setSelectedOrder(null);
    setView('create');
  };

  // So sánh giỏ hiện tại với đơn gốc để biết user đã chỉnh sửa gì chưa.
  const hasDraftChanges = () => {
    if (!orderBeingEdited) {
      return Object.keys(cart).length > 0 || orderComment.trim().length > 0;
    }

    const originalCart = buildCartFromItems(orderBeingEdited.items);

    const currentKeys = Object.keys(cart);
    const originalKeys = Object.keys(originalCart);
    const isSameCart = currentKeys.length === originalKeys.length
      && currentKeys.every((key) => cart[key] === originalCart[key]);
    const isSameComment = orderComment.trim() === (orderBeingEdited.comment || '').trim();

    return !(isSameCart && isSameComment);
  };

  const handleExitCreate = () => {
    if (hasDraftChanges()) {
      setConfirmModal({
        title: orderBeingEdited ? 'Thoát sửa đơn?' : 'Thoát tạo đơn hàng?',
        message: orderBeingEdited
          ? 'Bạn có chắc muốn thoát? Các chỉnh sửa sẽ bị huỷ.'
          : 'Bạn có chắc muốn thoát? Các sản phẩm trong đơn hàng sẽ bị xoá.',
        confirmLabel: 'Thoát',
        tone: 'danger',
        onConfirm: () => {
          clearDraft();
          setView('list');
        },
      });
      return;
    }
    clearDraft();
    setView('list');
  };

  const handleCancelDraft = () => {
    if (!hasDraftChanges()) {
      handleExitCreate();
      return;
    }
    setConfirmModal({
      title: orderBeingEdited ? 'Huỷ chỉnh sửa?' : 'Huỷ đơn?',
      message: 'Bạn có chắc muốn huỷ thao tác hiện tại không?',
      confirmLabel: 'Huỷ',
      tone: 'danger',
      onConfirm: () => {
        clearDraft();
        setView('list');
      },
    });
  };

  const getNextOrderNumber = () => {
    const numbers = orders.map((order) => Number(order.orderNumber)).filter(Number.isFinite);
    if (numbers.length === 0) {
      return orders.length + 1;
    }
    return Math.max(...numbers) + 1;
  };


  const buildOrderPayload = () => {
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
    };
  };

  const handleCreateOrder = () => {
    if (reviewItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm.');
      return;
    }
    const { items, total, warehouse } = buildOrderPayload();
    const orderId = Date.now().toString();
    const newOrder = {
      id: orderId,
      orderNumber: getNextOrderNumber(),
      items,
      total,
      warehouse,
      status: DEFAULT_STATUS,
      date: new Date().toISOString(),
      shippingFee: 0,
      shippingUpdated: false,
      comment: orderComment.trim(),
    };

    setProducts((prevProducts) => syncProductsStock(
      prevProducts,
      items,
      [],
      warehouse,
    ));
    setOrders([...orders, newOrder]);
    clearDraft();
    setView('list');
  };

  const handleUpdateOrder = () => {
    if (!orderBeingEdited) return;
    if (reviewItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm.');
      return;
    }

    const { items, total, warehouse } = buildOrderPayload();
    const updatedOrder = {
      ...orderBeingEdited,
      items,
      total,
      warehouse,
      comment: orderComment.trim(),
    };

    setProducts((prevProducts) => syncProductsStock(
      prevProducts,
      items,
      orderBeingEdited.items,
      warehouse,
      orderBeingEdited.warehouse || DEFAULT_WAREHOUSE,
    ));
    setOrders(orders.map(order => (order.id === orderBeingEdited.id ? updatedOrder : order)));
    clearDraft();
    setView('list');
  };

  const handleEditOrder = (order) => {
    setCart(buildCartFromItems(order.items));
    setOrderBeingEdited(order);
    setOrderComment(order.comment || '');
    setSelectedWarehouse(order.warehouse || DEFAULT_WAREHOUSE);
    setSelectedOrder(null);
    setSearchTerm('');
    setActiveCategory('Tất cả');
    setIsReviewOpen(false);
    setView('create');
  };

  const handleTogglePaid = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;
    const isPaid = order.status === 'paid';

    // Hiển thị popup xác nhận trước khi đổi trạng thái thanh toán.
    setConfirmModal({
      title: isPaid ? 'Huỷ thanh toán?' : 'Xác nhận thanh toán?',
      message: isPaid
        ? 'Bạn có chắc muốn huỷ trạng thái đã thanh toán cho đơn hàng này không?'
        : 'Bạn có chắc đơn hàng này đã được thanh toán đầy đủ chưa?',
      confirmLabel: isPaid ? 'Huỷ thanh toán' : 'Đã thanh toán',
      tone: isPaid ? 'danger' : 'rose',
      onConfirm: () => {
        setOrders((prev) => prev.map((item) => {
          if (item.id !== orderId) return item;
          const nextStatus = item.status === 'paid' ? DEFAULT_STATUS : 'paid';
          return { ...item, status: nextStatus };
        }));
      },
    });
  };

  const handleCustomerShipping = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;
    setShippingModal({
      open: true,
      fee: order.shippingFee ? String(order.shippingFee) : '',
      orderId,
      error: '',
    });
  };

  const handleShippingChange = (value) => {
    const sanitized = sanitizeNumberInput(value);
    setShippingModal((prev) => ({
      ...prev,
      fee: sanitized,
      error: '',
    }));
  };

  const handleShippingCancel = () => {
    setShippingModal({ open: false, fee: '', orderId: null, error: '' });
  };

  const handleShippingConfirm = () => {
    if (!shippingModal.orderId) return;
    const shippingFee = Number(shippingModal.fee || 0);
    setOrders((prev) => prev.map((order) => {
      if (order.id !== shippingModal.orderId) return order;
      return {
        ...order,
        shippingFee,
        shippingUpdated: true,
      };
    }));
    handleShippingCancel();
  };

  const handleCancelOrder = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;
    setConfirmModal({
      title: 'Huỷ đơn?',
      message: `Bạn có chắc muốn huỷ đơn ${order.orderNumber ? `#${order.orderNumber}` : ''}?`,
      confirmLabel: 'Huỷ đơn',
      tone: 'danger',
      onConfirm: () => {
        setProducts((prevProducts) => syncProductsStock(
          prevProducts,
          [],
          order.items,
          DEFAULT_WAREHOUSE,
          order.warehouse || DEFAULT_WAREHOUSE,
        ));
        setOrders(orders.filter(item => item.id !== orderId));
      },
    });
  };

  const getOrderStatusInfo = (order) => {
    if (order.status === 'paid') {
      return {
        label: 'Đã thanh toán',
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-600',
        dotClass: 'bg-emerald-500',
      };
    }
    if (order.shippingUpdated || order.shippingFee > 0) {
      return {
        label: 'Đã gửi khách',
        badgeClass: 'border-sky-200 bg-sky-50 text-sky-600',
        dotClass: 'bg-sky-500',
      };
    }
    return {
      label: 'Chờ lên đơn',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-600',
      dotClass: 'bg-amber-500',
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
    handleCustomerShipping,
    handleTogglePaid,
    handleCancelOrder,
    getOrderStatusInfo,
    handleShippingChange,
    handleShippingCancel,
    handleShippingConfirm,
    selectedWarehouse,
    setSelectedWarehouse,
    isCreateView,
    shouldShowDetailModal,
  };
};

export default useOrdersLogic;
