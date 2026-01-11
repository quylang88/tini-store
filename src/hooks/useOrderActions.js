import { useEffect, useMemo, useState } from 'react';
import { sanitizeNumberInput } from '../utils/helpers';

// Tách toàn bộ logic quản lý đơn hàng ra khỏi Orders.jsx để dễ bảo trì.
const useOrderActions = ({ products, setProducts, orders, setOrders }) => {
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [cart, setCart] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [orderComment, setOrderComment] = useState('');
  const [initialCart, setInitialCart] = useState({});
  const [initialComment, setInitialComment] = useState('');
  // Dùng modal riêng để đồng bộ giao diện xác nhận/nhập phí gửi
  const [confirmModal, setConfirmModal] = useState(null);
  const [shippingModal, setShippingModal] = useState({
    open: false,
    orderId: null,
    fee: '',
    error: ''
  });

  // State cho bộ lọc
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

  const orderBeingEdited = editingOrderId ? orders.find(item => item.id === editingOrderId) : null;

  const totalAmount = useMemo(() => Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0), [cart, products]);

  const reviewItems = useMemo(() => Object.entries(cart).map(([id, qty]) => {
    const product = products.find(item => item.id === id);
    return {
      id,
      name: product?.name || 'SP đã xóa',
      price: product?.price || 0,
      quantity: qty
    };
  }), [cart, products]);

  // Lưu giá vốn ngay trong item để lợi nhuận không bị sai khi giá vốn thay đổi về sau
  const buildOrderItems = () => Object.entries(cart).map(([id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return {
      productId: id,
      quantity: qty,
      name: p ? p.name : 'SP đã xóa',
      price: p ? p.price : 0,
      cost: p ? p.cost || 0 : 0
    };
  });

  // Tự động chuyển dữ liệu cũ: trạng thái "exported" -> lưu cờ phí gửi, trả về pending
  useEffect(() => {
    const hasLegacyExported = orders.some(order => order.status === 'exported' && !order.shippingUpdated);
    if (!hasLegacyExported) return;
    const nextOrders = orders.map(order => {
      if (order.status !== 'exported') return order;
      return { ...order, status: 'pending', shippingUpdated: true };
    });
    setOrders(nextOrders);
  }, [orders, setOrders]);

  useEffect(() => {
    const hasMissingOrderNumber = orders.some(order => order.orderNumber == null);
    if (!hasMissingOrderNumber) return;
    const sortedByDate = [...orders].sort((a, b) => new Date(a.date) - new Date(b.date));
    const orderNumberById = new Map(sortedByDate.map((order, index) => [order.id, index + 1]));
    const nextOrders = orders.map(order => ({
      ...order,
      orderNumber: order.orderNumber ?? orderNumberById.get(order.id)
    }));
    setOrders(nextOrders);
  }, [orders, setOrders]);

  const hasCartChanged = (baseCart, nextCart) => {
    const baseKeys = Object.keys(baseCart);
    const nextKeys = Object.keys(nextCart);
    if (baseKeys.length !== nextKeys.length) return true;
    return baseKeys.some((key) => Number(baseCart[key]) !== Number(nextCart[key]));
  };

  const handleQuantityChange = (productId, value, stock) => {
    if (value === '') {
      setCart(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }
    let qty = parseInt(value);
    if (isNaN(qty) || qty < 0) qty = 0;
    if (qty > stock) { alert(`Chỉ còn ${stock} sản phẩm trong kho!`); qty = stock; }
    setCart(prev => {
      const next = { ...prev };
      if (qty === 0) delete next[productId]; else next[productId] = qty;
      return next;
    });
  };

  const adjustQuantity = (productId, delta, stock) => {
    const currentQty = cart[productId] || 0;
    const newQty = currentQty + delta;
    if (newQty > stock) { alert(`Hết hàng trong kho!`); return; }
    setCart(prev => {
      const next = { ...prev };
      if (newQty <= 0) delete next[productId]; else next[productId] = newQty;
      return next;
    });
  };

  const handleScanForSale = (decodedText) => {
    const product = products.find(p => p.barcode === decodedText);
    if (product) {
      if (product.stock > 0) {
        adjustQuantity(product.id, 1, product.stock);
        alert(`Đã thêm: ${product.name}`);
        setShowScanner(false);
      } else {
        alert(`Sản phẩm ${product.name} đã hết hàng!`);
        setShowScanner(false);
      }
    } else {
      alert("Không tìm thấy sản phẩm!");
      setShowScanner(false);
    }
  };

  const getOrderLabel = (order) => (order?.orderNumber ? `#${order.orderNumber}` : `#${order?.id?.slice(-4)}`);

  const handleCreateOrder = () => {
    if (totalAmount === 0) return;
    const nextOrderNumber = orders.reduce((max, order) => Math.max(max, order.orderNumber || 0), 0) + 1;

    const newOrder = {
      id: Date.now().toString(),
      orderNumber: nextOrderNumber,
      date: new Date().toISOString(),
      items: buildOrderItems(),
      total: totalAmount,
      comment: orderComment.trim(),
      shippingFee: 0,
      shippingUpdated: false,
      status: 'pending'
    };

    const updatedProducts = products.map(p => {
      if (cart[p.id]) return { ...p, stock: p.stock - cart[p.id] };
      return p;
    });

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);
    setCart({});
    setOrderComment('');
    setInitialCart({});
    setInitialComment('');
    setView('list');
  };

  const handleUpdateOrder = () => {
    if (!orderBeingEdited) return;
    if (totalAmount === 0) return;

    const restoredProducts = products.map(p => {
      const previousQty = orderBeingEdited.items.find(item => item.productId === p.id)?.quantity || 0;
      return { ...p, stock: p.stock + previousQty };
    });

    const updatedProducts = restoredProducts.map(p => {
      const newQty = cart[p.id] || 0;
      if (newQty) return { ...p, stock: p.stock - newQty };
      return p;
    });

    // Khi sửa đơn đã thanh toán, đưa trạng thái về chờ gom để doanh thu/lợi nhuận tính lại cho chuẩn
    const shouldResetPaid = orderBeingEdited.status === 'paid';

    const updatedOrder = {
      ...orderBeingEdited,
      items: buildOrderItems(),
      total: totalAmount,
      comment: orderComment.trim(),
      shippingUpdated: orderBeingEdited.shippingUpdated || false,
      status: shouldResetPaid ? 'pending' : orderBeingEdited.status
    };

    const nextOrders = orders.map(item => (item.id === editingOrderId ? updatedOrder : item));

    setProducts(updatedProducts);
    setOrders(nextOrders);
    setCart({});
    setOrderComment('');
    setInitialCart({});
    setInitialComment('');
    setEditingOrderId(null);
    setView('list');
  };

  const handleStartCreate = () => {
    setCart({});
    setEditingOrderId(null);
    setOrderComment('');
    setInitialCart({});
    setInitialComment('');
    setView('create');
  };

  const handleEditOrder = (order) => {
    const nextCart = {};
    order.items.forEach(item => {
      const productExists = products.some(p => p.id === item.productId);
      if (productExists) nextCart[item.productId] = item.quantity;
    });
    setCart(nextCart);
    setOrderComment(order.comment || '');
    setInitialCart(nextCart);
    setInitialComment(order.comment || '');
    setEditingOrderId(order.id);
    setView('create');
  };

  const handleExitCreate = () => {
    setView('list');
    if (editingOrderId) {
      setCart({});
      setEditingOrderId(null);
    }
    setOrderComment('');
    setInitialCart({});
    setInitialComment('');
  };

  const handleCancelDraft = () => {
    const hasItems = Object.keys(cart).length > 0;
    if (!hasItems && !editingOrderId) {
      setView('list');
      return;
    }

    if (editingOrderId) {
      const hasChanges = hasCartChanged(initialCart, cart) || orderComment !== initialComment;
      if (!hasChanges) {
        setCart({});
        setEditingOrderId(null);
        setOrderComment('');
        setInitialCart({});
        setInitialComment('');
        setView('list');
        return;
      }
    }

    // Hiển thị modal xác nhận huỷ tạo/sửa đơn theo yêu cầu.
    setConfirmModal({
      title: editingOrderId ? 'Huỷ cập nhật đơn?' : 'Huỷ tạo đơn?',
      message: editingOrderId
        ? 'Các thay đổi trong đơn sẽ không được lưu.'
        : 'Bạn chắc chắn muốn huỷ tạo đơn này chứ?',
      confirmLabel: 'Huỷ đơn',
      tone: 'danger',
      onConfirm: () => {
        setCart({});
        setEditingOrderId(null);
        setOrderComment('');
        setInitialCart({});
        setInitialComment('');
        setView('list');
      }
    });
  };

  const handleExportToVietnam = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;

    const currentFee = order.shippingFee || 0;
    setShippingModal({
      open: true,
      orderId,
      fee: currentFee ? String(currentFee) : '',
      error: ''
    });
  };

  const handleTogglePaid = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;

    const isPaid = order.status === 'paid';
    setConfirmModal({
      title: isPaid ? 'Huỷ thanh toán đơn hàng?' : 'Xác nhận thanh toán?',
      message: `Đơn ${getOrderLabel(order)} sẽ được ${isPaid ? 'đưa về trạng thái chờ gom' : 'đánh dấu đã thanh toán'}.`,
      confirmLabel: isPaid ? 'Huỷ thanh toán' : 'Xác nhận',
      tone: isPaid ? 'danger' : 'rose',
      onConfirm: () => {
        const nextOrders = orders.map(item => {
          if (item.id !== orderId) return item;
          return {
            ...item,
            status: item.status === 'paid' ? 'pending' : 'paid'
          };
        });
        setOrders(nextOrders);
      }
    });
  };

  // Thêm logic huỷ đơn: hoàn kho và xoá đơn để có thể tạo đơn mới
  const handleCancelOrder = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;

    setConfirmModal({
      title: 'Huỷ đơn hàng?',
      message: `Đơn ${getOrderLabel(order)} sẽ bị huỷ và hoàn kho lại sản phẩm.`,
      confirmLabel: 'Huỷ đơn',
      tone: 'danger',
      onConfirm: () => {
        const restoredProducts = products.map(p => {
          const qty = order.items.find(item => item.productId === p.id)?.quantity || 0;
          return qty ? { ...p, stock: p.stock + qty } : p;
        });

        setProducts(restoredProducts);
        setOrders(orders.filter(item => item.id !== orderId));
      }
    });
  };

  const getOrderStatusInfo = (order) => {
    const hasShipping = order.shippingUpdated || order.shippingFee > 0;
    if (order.status === 'paid') {
      return { label: 'Đã thanh toán', dotClass: 'bg-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
    if (hasShipping) {
      return { label: 'Đã xuất VN', dotClass: 'bg-sky-400', badgeClass: 'bg-sky-50 text-sky-700 border-sky-100' };
    }
    return { label: 'Chờ gom', dotClass: 'bg-slate-400', badgeClass: 'bg-slate-50 text-slate-600 border-slate-100' };
  };

  const handleShippingChange = (value) => setShippingModal(prev => ({
    ...prev,
    fee: sanitizeNumberInput(value),
    error: ''
  }));

  const handleShippingCancel = () => setShippingModal({ open: false, orderId: null, fee: '', error: '' });

  const handleShippingConfirm = () => {
    const feeValue = Number(shippingModal.fee || 0);
    if (Number.isNaN(feeValue) || feeValue < 0) {
      setShippingModal(prev => ({ ...prev, error: 'Phí gửi không hợp lệ. Vui lòng nhập số >= 0.' }));
      return;
    }

    const nextOrders = orders.map(item => {
      if (item.id !== shippingModal.orderId) return item;
      return {
        ...item,
        shippingFee: feeValue,
        shippingUpdated: true,
        // Chỉ cập nhật phí gửi, không đổi trạng thái thanh toán
        status: item.status
      };
    });

    setOrders(nextOrders);
    setShippingModal({ open: false, orderId: null, fee: '', error: '' });
  };

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchCategory = activeCategory === 'Tất cả' || p.category === activeCategory;
    const lowerTerm = searchTerm.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(lowerTerm) ||
      (p.barcode && p.barcode.includes(lowerTerm));

    return matchCategory && matchSearch;
  }), [products, activeCategory, searchTerm]);

  return {
    view,
    setView,
    cart,
    setCart,
    showScanner,
    setShowScanner,
    editingOrderId,
    setEditingOrderId,
    selectedOrder,
    setSelectedOrder,
    isReviewOpen,
    setIsReviewOpen,
    orderComment,
    setOrderComment,
    confirmModal,
    setConfirmModal,
    shippingModal,
    setShippingModal,
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
  };
};

export default useOrderActions;
