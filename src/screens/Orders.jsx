import React, { useState } from 'react';
import { ChevronRight, ScanBarcode, Image as ImageIcon, Plus, Minus, Trash2, ShoppingCart, Search } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import { formatNumber } from '../utils/helpers';

const Orders = ({ products, setProducts, orders, setOrders, settings }) => {
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [cart, setCart] = useState({});
  const [showScanner, setShowScanner] = useState(false);

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
  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const handleCreateOrder = () => {
    if (totalAmount === 0) return;
    if (!window.confirm(`Xác nhận tạo đơn: ${formatNumber(totalAmount)}đ?`)) return;

    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: Object.entries(cart).map(([id, qty]) => {
        const p = products.find(prod => prod.id === id);
        return {
          productId: id,
          quantity: qty,
          name: p ? p.name : 'SP đã xóa',
          price: p ? p.price : 0
        };
      }),
      total: totalAmount,
      shippingFee: 0,
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
        status: 'exported'
      };
    });

    setOrders(nextOrders);
  };

  // --- 3.2. THANH TOÁN ĐƠN ---
  const handleMarkPaid = (orderId) => {
    const order = orders.find(item => item.id === orderId);
    if (!order) return;

    if (!window.confirm(`Xác nhận đã thanh toán cho đơn #${order.id.slice(-4)}?`)) return;

    const nextOrders = orders.map(item => {
      if (item.id !== orderId) return item;
      return {
        ...item,
        status: 'paid'
      };
    });

    setOrders(nextOrders);
  };

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'exported':
        return 'Đã xuất VN';
      default:
        return 'Chờ gom';
    }
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

  // --- GIAO DIỆN TẠO ĐƠN ---
  if (view === 'create') {
    const hasItems = Object.keys(cart).length > 0;
    const categories = settings?.categories || ['Chung'];

    return (
      <div className="flex flex-col h-full bg-gray-50 pb-safe-area relative">
        {showScanner && <BarcodeScanner onScanSuccess={handleScanForSale} onClose={() => setShowScanner(false)} />}

        {/* Header Cố định */}
        <div className="bg-white sticky top-0 z-10 shadow-sm">
          {/* Hàng 1: Tiêu đề & Nút chức năng */}
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full transition">
                <ChevronRight className="rotate-180 text-gray-600" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">Tạo Đơn</h2>
            </div>

            <div className="flex items-center gap-2">
              {hasItems && (
                <button onClick={handleClearCart} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 active:scale-95 transition">
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={() => setShowScanner(true)} className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg text-sm font-bold active:scale-95 transition">
                <ScanBarcode size={18} /> <span className="hidden sm:inline">Quét</span>
              </button>
            </div>
          </div>

          {/* Hàng 2: Thanh Tìm kiếm */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã sản phẩm..."
                className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Hàng 3: Thanh Tab Danh mục */}
          <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-gray-100">
            <button
              onClick={() => setActiveCategory('Tất cả')}
              className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === 'Tất cả' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === cat ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List Sản Phẩm (Đã Lọc) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-40">
          {filteredProducts.map(p => {
            const qty = cart[p.id] || 0;
            const isOutOfStock = p.stock <= 0;

            return (
              <div key={p.id} className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                  {p.image ? (
                    <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-gray-300" /></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-sm text-gray-800 truncate pr-1">{p.name}</div>
                    {/* Badge danh mục */}
                    {activeCategory === 'Tất cả' && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    <span className="font-semibold text-indigo-600">{formatNumber(p.price)}đ</span>
                    <span className="mx-1">|</span>
                    <span>Kho: {p.stock}</span>
                  </div>
                </div>

                {/* Bộ điều khiển số lượng */}
                {qty > 0 ? (
                  <div className="flex items-center bg-indigo-50 rounded-lg h-9 border border-indigo-100 overflow-hidden shadow-sm">
                    <button onClick={() => adjustQuantity(p.id, -1, p.stock)} className="w-9 h-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200">
                      <Minus size={16} strokeWidth={2.5} />
                    </button>
                    <input
                      type="number"
                      className="w-12 h-full text-center bg-transparent border-x border-indigo-100 outline-none text-indigo-900 font-bold text-sm m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={qty}
                      onChange={(e) => handleQuantityChange(p.id, e.target.value, p.stock)}
                      onFocus={(e) => e.target.select()}
                    />
                    <button onClick={() => adjustQuantity(p.id, 1, p.stock)} disabled={qty >= p.stock} className="w-9 h-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200 disabled:opacity-30">
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => adjustQuantity(p.id, 1, p.stock)} disabled={isOutOfStock} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 active:scale-95 transition">
                    {isOutOfStock ? 'Hết' : 'Thêm'}
                  </button>
                )}
              </div>
            )
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
              <div className="flex justify-center mb-2"><Search size={32} className="opacity-20" /></div>
              <p>Không tìm thấy sản phẩm</p>
            </div>
          )}
        </div>

        {/* Tạo Đơn */}
        {totalAmount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe-area z-[60] shadow-[0_-4px_15px_rgba(0,0,0,0.1)] animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 font-medium text-sm">Tổng đơn hàng:</span>
              <span className="text-2xl font-bold text-indigo-600">{formatNumber(totalAmount)}đ</span>
            </div>
            <button onClick={handleCreateOrder} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition flex items-center justify-center gap-2 text-lg">
              <ShoppingCart size={20} /> Lên đơn
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- GIAO DIỆN DANH SÁCH ĐƠN ---
  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Lịch sử đơn</h2>
        <button onClick={() => setView('create')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 active:scale-95 transition flex items-center gap-2">
          <Plus size={18} /> Đơn mới
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-100 transition">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-800 text-lg">#{order.id.slice(-4)}</span>
              <span className="text-indigo-600 font-bold text-lg bg-indigo-50 px-2 py-0.5 rounded">{formatNumber(order.total)}đ</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                {getOrderStatusLabel(order.status)}
              </span>
              <span className="text-gray-400">
                Phí gửi: {formatNumber(order.shippingFee || 0)}đ
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              {new Date(order.date).toLocaleString()}
            </div>
            <div className="border-t border-dashed border-gray-200 pt-2 space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600">
                  <span>{item.name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                  <span className="font-medium text-gray-500">{formatNumber(item.price * item.quantity)}đ</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => handleMarkPaid(order.id)}
                className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
              >
                {order.status === 'paid' ? 'Đã thanh toán' : 'Thanh toán'}
              </button>
              <button
                onClick={() => handleExportToVietnam(order.id)}
                className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition"
              >
                {order.status === 'exported' ? 'Cập nhật phí gửi' : 'Xuất về VN'}
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <ShoppingCart size={48} className="mb-2 opacity-20" />
            <p>Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
