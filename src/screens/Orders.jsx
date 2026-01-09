import React, { useState } from 'react';
import { ChevronRight, ScanBarcode, Image as ImageIcon } from 'lucide-react';

import BarcodeScanner from '../components/BarcodeScanner';

const Orders = ({ products, setProducts, orders, setOrders }) => {
  const [view, setView] = useState('list');
  const [cart, setCart] = useState({});
  const [showScanner, setShowScanner] = useState(false);

  // Xử lý quét mã khi bán hàng
  const handleScanForSale = (decodedText) => {
    const product = products.find(p => p.barcode === decodedText);
    if (product) {
      if (product.stock > 0) {
        addToCart(product.id);
        alert(`Đã thêm: ${product.name}`);
        setShowScanner(false);
      } else {
        alert(`Sản phẩm ${product.name} đã hết hàng!`);
        setShowScanner(false);
      }
    } else {
      alert("Không tìm thấy sản phẩm với mã này!");
      setShowScanner(false);
    }
  };

  const addToCart = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id) => {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[id] > 1) copy[id]--;
      else delete copy[id];
      return copy;
    });
  };

  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const handleCheckout = () => {
    if (total === 0) return;
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: Object.entries(cart).map(([id, qty]) => ({ productId: id, quantity: qty })),
      total
    };

    // Trừ kho
    const updatedProducts = products.map(p => {
      if (cart[p.id]) return { ...p, stock: p.stock - cart[p.id] };
      return p;
    });

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);
    setCart({});
    setView('list');
  };

  if (view === 'create') {
    return (
      <div className="flex flex-col h-full bg-gray-50 pb-safe-area">
        {showScanner && <BarcodeScanner onScanSuccess={handleScanForSale} onClose={() => setShowScanner(false)} />}

        <div className="bg-white p-3 border-b flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="rotate-180 text-gray-600" /></button>
            <h2 className="text-xl font-bold text-gray-800">Tạo Đơn</h2>
          </div>
          <button onClick={() => setShowScanner(true)} className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold">
            <ScanBarcode size={18} /> Quét
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32">
          {products.map(p => {
            const qty = cart[p.id] || 0;
            return (
              <div key={p.id} className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center ${p.stock <= 0 ? 'opacity-50 grayscale' : ''}`}>
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-gray-300" /></div>}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.price.toLocaleString()}đ | Kho: {p.stock}</div>
                </div>
                {qty > 0 ? (
                  <div className="flex items-center bg-indigo-50 rounded-lg h-8">
                    <button onClick={() => removeFromCart(p.id)} className="w-8 h-full text-indigo-600 font-bold">-</button>
                    <span className="text-indigo-800 text-sm font-bold px-1">{qty}</span>
                    <button onClick={() => addToCart(p.id)} disabled={qty >= p.stock} className="w-8 h-full text-indigo-600 font-bold disabled:opacity-30">+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(p.id)} disabled={p.stock <= 0} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold">Thêm</button>
                )}
              </div>
            )
          })}
        </div>

        {total > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-safe-area z-20 shadow-up animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 font-medium">Tổng tiền:</span>
              <span className="text-xl font-bold text-indigo-600">{total.toLocaleString()}đ</span>
            </div>
            <button onClick={handleCheckout} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition">
              Thanh toán ngay
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-800">Lịch sử đơn</h2>
        <button onClick={() => setView('create')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 active:scale-95 transition">
          + Đơn mới
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-800">#{order.id.slice(-4)}</span>
              <span className="text-indigo-600 font-bold">{order.total.toLocaleString()}đ</span>
            </div>
            <div className="text-xs text-gray-400 mb-2">{new Date(order.date).toLocaleString()}</div>
            <div className="border-t pt-2">
              {order.items.map((item, i) => {
                const p = products.find(prod => prod.id === item.productId);
                return (
                  <div key={i} className="flex justify-between text-sm text-gray-600 py-0.5">
                    <span>{p ? p.name : 'SP đã xóa'} <span className="text-gray-400">x{item.quantity}</span></span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="text-center text-gray-400 mt-20">Chưa có đơn hàng</div>}
      </div>
    </div>
  );
};

export default Orders;