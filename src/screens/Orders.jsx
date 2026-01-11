import React, { useState, useEffect } from 'react';
// Tách giao diện tạo đơn/danh sách đơn để file Orders.jsx gọn hơn
import OrderCreateView from '../components/orders/OrderCreateView';
import OrderListView from '../components/orders/OrderListView';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import InputModal from '../components/modals/InputModal';
import { formatInputNumber, sanitizeNumberInput } from '../utils/helpers';

const Orders = ({ products, setProducts, orders, setOrders, settings }) => {
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [cart, setCart] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [orderComment, setOrderComment] = useState('');
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

  // --- 1. LOGIC GIỎ HÀNG ---
  // Chuẩn hoá giỏ hàng chỉnh sửa để so sánh thay đổi khi sửa đơn
  const getEditableOrderCart = (order) => {
    const nextCart = {};
    if (!order) return nextCart;
    order.items.forEach(item => {
      const productExists = products.some(p => p.id === item.productId);
      if (productExists) nextCart[item.productId] = item.quantity;
    });
    return nextCart;
  };

  // Kiểm tra xem người dùng đã thay đổi gì khi sửa đơn hay chưa
  const hasOrderChanges = () => {
    if (!orderBeingEdited) return Object.keys(cart).length > 0 || orderComment.trim() !== '';
    const originalCart = getEditableOrderCart(orderBeingEdited);
    const allKeys = new Set([...Object.keys(originalCart), ...Object.keys(cart)]);
    for (const key of allKeys) {
      if ((originalCart[key] || 0) !== (cart[key] || 0)) return true;
    }
    return (orderComment || '').trim() !== (orderBeingEdited.comment || '').trim();
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
      shippingFee: 0,
      shippingUpdated: false,
      status: 'pending',
      // Ghi chú để gợi nhớ đơn hàng khi xem lại
      comment: orderComment.trim()
    };

    const updatedProducts = products.map(p => {
      if (cart[p.id]) return { ...p, stock: p.stock - cart[p.id] };
      return p;
    });

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);
    setCart({});
    setOrderComment('');
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
      shippingUpdated: orderBeingEdited.shippingUpdated || false,
      status: shouldResetPaid ? 'pending' : orderBeingEdited.status,
      comment: orderComment.trim()
    };

    const nextOrders = orders.map(item => (item.id === editingOrderId ? updatedOrder : item));

    setProducts(updatedProducts);
    setOrders(nextOrders);
    setCart({});
    setEditingOrderId(null);
    setOrderComment('');
    setView('list');
  };

  const handleEditOrder = (order) => {
    const nextCart = getEditableOrderCart(order);
    setCart(nextCart);
    setEditingOrderId(order.id);
    setOrderComment(order.comment || '');
    setView('create');
  };

  const handleStartCreate = () => {
    setCart({});
    setEditingOrderId(null);
    setOrderComment('');
    setView('create');
  };

  const handleExitCreate = () => {
    setView('list');
    if (editingOrderId) {
      setCart({});
      setEditingOrderId(null);
    }
    setOrderComment('');
  };

  const handleCancelCreate = () => {
    if (orderBeingEdited) {
      if (!hasOrderChanges()) {
        handleExitCreate();
        return;
      }
      setConfirmModal({
        title: 'Huỷ cập nhật đơn?',
        message: `Các thay đổi của đơn ${getOrderLabel(orderBeingEdited)} sẽ không được lưu.`,
        confirmLabel: 'Huỷ cập nhật',
        tone: 'danger',
        onConfirm: () => {
          setCart({});
          setEditingOrderId(null);
          setOrderComment('');
          setView('list');
        }
      });
      return;
    }

    setConfirmModal({
      title: 'Huỷ tạo đơn?',
      message: 'Đơn đang tạo sẽ bị huỷ và quay lại danh sách.',
      confirmLabel: 'Huỷ tạo',
      tone: 'danger',
      onConfirm: () => {
        setCart({});
        setOrderComment('');
        setView('list');
      }
    });
  };

  // --- 3.1. XUẤT VỀ VN & NHẬP PHÍ GỬI ---
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

  // --- 3.2. THANH TOÁN / HUỶ THANH TOÁN ---
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

  // Trả về nhãn + màu sắc để trạng thái nhìn rõ ràng, dễ phân biệt
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

  const renderContent = () => {
    if (view === 'create') {
      const reviewItems = Object.entries(cart).map(([id, qty]) => {
        const product = products.find(item => item.id === id);
        return {
          id,
          name: product?.name || 'SP đã xóa',
          price: product?.price || 0,
          quantity: qty
        };
      });

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
          handleExitCreate={handleExitCreate}
          handleScanForSale={handleScanForSale}
          handleQuantityChange={handleQuantityChange}
          adjustQuantity={adjustQuantity}
          handleOpenReview={() => setIsReviewOpen(true)}
          handleCloseReview={() => setIsReviewOpen(false)}
          handleCancelCreate={handleCancelCreate}
          handleConfirmOrder={() => {
            if (orderBeingEdited) {
              handleUpdateOrder();
            } else {
              handleCreateOrder();
            }
            setIsReviewOpen(false);
          }}
          orderComment={orderComment}
          setOrderComment={setOrderComment}
          isCommentValid={orderComment.trim().length > 0}
        />
      );
    }

    return (
      <>
        <OrderListView
          orders={orders}
          onCreateNew={handleStartCreate}
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
        onChange={(value) => setShippingModal(prev => ({
          ...prev,
          fee: sanitizeNumberInput(value),
          error: ''
        }))}
        onCancel={() => setShippingModal({ open: false, orderId: null, fee: '', error: '' })}
        onConfirm={() => {
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
        }}
      />
    </>
  );
};

export default Orders;
