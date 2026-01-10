import React, { useState, useEffect } from 'react';
// Tách giao diện tạo đơn/danh sách đơn để file Orders.jsx gọn hơn
import OrderCreateView from './orders/OrderCreateView';
import OrderListView from './orders/OrderListView';
import { formatNumber } from '../utils/helpers';

const Orders = ({ products, setProducts, orders, setOrders, settings }) => {
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [cart, setCart] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // State cho bộ lọc
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. LOGIC GIỎ HÀNG ---
  const handleClearCart = () => {
    if (Object.keys(cart).length === 0) return;
    if (window.confirm("Bạn chắc chắn muốn xóa hết các sản phẩm đã chọn?")) {
      setCart({});
    }
  };

  const handleQuantityChange = (productId, value, stock) => {
    if (value === '') {
      setCart(prev => { const next = { ...prev }; delete next[productId]; return next; });
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

  // --- 2. LOGIC QUÉT MÃ ---
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

  // --- 3. TẠO ĐƠN ---
  const orderBeingEdited = editingOrderId ? orders.find(item => item.id === editingOrderId) : null;

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

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

  const handleCreateOrder = () => {
    if (totalAmount === 0) return;
    if (!window.confirm(`Xác nhận tạo đơn: ${formatNumber(totalAmount)}đ?`)) return;

    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: buildOrderItems(),
      total: totalAmount,
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
    setView('list');
  };

  const handleUpdateOrder = () => {
    if (!orderBeingEdited) return;
    if (totalAmount === 0) return;
    if (!window.confirm(`Cập nhật đơn #${orderBeingEdited.id.slice(-4)}: ${formatNumber(totalAmount)}đ?`)) return;

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
      shippingUpdated: orderBeingEdited.shippingUpdated || false,
      status: shouldResetPaid ? 'pending' : orderBeingEdited.status
    };

    const nextOrders = orders.map(item => (item.id === editingOrderId ? updatedOrder : item));

    setProducts(updatedProducts);
    setOrders(nextOrders);
    setCart({});
    setEditingOrderId(null);
    setView('list');
  };

  const handleEditOrder = (order) => {
    const nextCart = {};
    order.items.forEach(item => {
      const productExists = products.some(p => p.id === item.productId);
      if (productExists) nextCart[item.productId] = item.quantity;
    });
    setCart(nextCart);
    setEditingOrderId(order.id);
    setView('create');
  };

  const handleExitCreate = () => {
    setView('list');
    if (editingOrderId) {
      setCart({});
      setEditingOrderId(null);
    }
  };

  // --- 3.1. XUẤT VỀ VN & NHẬP PHÍ GỬI ---
  const handleExportToVietnam = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;

    const currentFee = order.shippingFee || 0;
    const feeInput = window.prompt('Nhập phí gửi về VN (đ)', currentFee || '');
    if (feeInput === null) return;

    const feeValue = Number(feeInput);
    if (Number.isNaN(feeValue) || feeValue < 0) {
      alert('Phí gửi không hợp lệ.');
      return;
    }

    const nextOrders = orders.map(item => {
      if (item.id !== orderId) return item;
      return {
        ...item,
        shippingFee: feeValue,
        shippingUpdated: true,
        // Chỉ cập nhật phí gửi, không đổi trạng thái thanh toán
        status: item.status
      };
    });

    setOrders(nextOrders);
  };

  // --- 3.2. THANH TOÁN / HUỶ THANH TOÁN ---
  const handleTogglePaid = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;

    if (order.status === 'paid') {
      if (!window.confirm(`Huỷ trạng thái đã thanh toán cho đơn #${order.id.slice(-4)}?`)) return;
    } else {
      if (!window.confirm(`Xác nhận đã thanh toán cho đơn #${order.id.slice(-4)}?`)) return;
    }

    const nextOrders = orders.map(item => {
      if (item.id !== orderId) return item;
      return {
        ...item,
        status: item.status === 'paid' ? 'pending' : 'paid'
      };
    });

    setOrders(nextOrders);
  };

  // Thêm logic huỷ đơn: hoàn kho và xoá đơn để có thể tạo đơn mới
  const handleCancelOrder = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;

    if (!window.confirm(`Xác nhận huỷ đơn #${order.id.slice(-4)}?`)) return;

    const restoredProducts = products.map(p => {
      const qty = order.items.find(item => item.productId === p.id)?.quantity || 0;
      return qty ? { ...p, stock: p.stock + qty } : p;
    });

    setProducts(restoredProducts);
    setOrders(orders.filter(item => item.id !== orderId));
  };

  // Trả về nhãn + màu sắc để trạng thái nhìn rõ ràng, dễ phân biệt
  const getOrderStatusInfo = (order) => {
    const hasShipping = order.shippingUpdated || order.shippingFee > 0;
    if (order.status === 'paid') {
      return { label: 'Đã thanh toán', dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    }
    if (hasShipping) {
      return { label: 'Đã xuất VN', dotClass: 'bg-indigo-500', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
    }
    return { label: 'Chờ gom', dotClass: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-100' };
  };

  // --- 4. BỘ LỌC SẢN PHẨM (Kết hợp Tìm kiếm + Danh mục) ---
  const filteredProducts = products.filter(p => {
    // Lọc theo danh mục
    const matchCategory = activeCategory === 'Tất cả' || p.category === activeCategory;

    // Lọc theo từ khóa (Tên hoặc Mã vạch)
    const lowerTerm = searchTerm.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(lowerTerm) ||
      (p.barcode && p.barcode.includes(lowerTerm));

    return matchCategory && matchSearch;
  });

  if (view === 'create') {
    return (
      <OrderCreateView
        products={products}
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
        handleExitCreate={handleExitCreate}
        handleClearCart={handleClearCart}
        handleScanForSale={handleScanForSale}
        handleQuantityChange={handleQuantityChange}
        adjustQuantity={adjustQuantity}
        handleSubmitOrder={orderBeingEdited ? handleUpdateOrder : handleCreateOrder}
      />
    );
  }

  return (
    <OrderListView
      orders={orders}
      setView={setView}
      getOrderStatusInfo={getOrderStatusInfo}
      handleTogglePaid={handleTogglePaid}
      handleExportToVietnam={handleExportToVietnam}
      handleEditOrder={handleEditOrder}
      handleCancelOrder={handleCancelOrder}
    />
  );
};

export default Orders;
