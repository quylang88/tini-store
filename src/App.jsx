import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ChevronRight,
  Search,
  TrendingUp,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Download,
  Settings as SettingsIcon // <-- Đã đổi tên Icon để không trùng
} from 'lucide-react';

// --- TIỆN ÍCH NÉN ẢNH ---
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 300 / Math.max(img.width, img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
};

// --- COMPONENTS ---

const TabBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'orders', icon: ShoppingCart, label: 'Đơn hàng' },
    { id: 'inventory', icon: Package, label: 'Kho hàng' },
    { id: 'settings', icon: SettingsIcon, label: 'Cài đặt' }, // <-- Dùng tên Icon mới
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-area z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-gray-400'
                }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = ({ products, orders }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;

  const topProducts = products.map(p => {
    const sold = orders.reduce((acc, order) => {
      const item = order.items.find(i => i.productId === p.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    return { ...p, sold };
  }).sort((a, b) => b.sold - a.sold).slice(0, 3);

  return (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Tổng Quan Shop</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <DollarSign size={18} />
            <span className="text-xs font-bold uppercase">Doanh thu</span>
          </div>
          <div className="text-xl font-bold">{totalRevenue.toLocaleString()}đ</div>
        </div>

        <div className="bg-white text-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <ShoppingCart size={18} />
            <span className="text-xs font-bold uppercase">Đơn hàng</span>
          </div>
          <div className="text-xl font-bold">{totalOrders}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Top bán chạy</h3>
        <div className="space-y-3">
          {topProducts.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="font-bold text-gray-300 w-4">#{idx + 1}</div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={16} /></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500">Đã bán: {p.sold}</div>
              </div>
            </div>
          ))}
          {topProducts.length === 0 && <div className="text-center text-gray-400 text-sm">Chưa có dữ liệu bán hàng</div>}
        </div>
      </div>
    </div>
  );
};

const Inventory = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', price: '', stock: '', image: '' });

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setFormData(prev => ({ ...prev, image: compressed }));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return;

    const newProduct = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.name,
      price: Number(formData.price),
      stock: Number(formData.stock),
      image: formData.image
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      setProducts([...products, newProduct]);
    }
    closeModal();
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, price: product.price, stock: product.stock, image: product.image || '' });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', stock: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Xóa sản phẩm này?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-3 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-800">Kho Hàng</h2>
          <button onClick={() => openModal()} className="bg-indigo-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95">
            <Plus size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-24">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 relative">
              {p.image ? (
                <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-800 truncate">{p.name}</div>
              <div className="text-indigo-600 font-bold text-sm">{p.price.toLocaleString()}đ</div>
              <div className={`text-xs mt-1 ${p.stock < 5 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>Kho: {p.stock}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => openModal(p)} className="text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
              <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg">{editingProduct ? 'Sửa SP' : 'Thêm Mới'}</h3>
              <button onClick={closeModal} className="bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition cursor-pointer overflow-hidden relative"
                >
                  {formData.image ? (
                    <img src={formData.image} className="w-full h-full object-cover absolute inset-0" alt="Preview" />
                  ) : (
                    <>
                      <Upload size={24} className="mb-1" />
                      <span className="text-[10px]">Ảnh</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tên sản phẩm</label>
                <input
                  className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Giá bán</label>
                  <input
                    type="number"
                    className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800"
                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tồn kho</label>
                  <input
                    type="number"
                    className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800"
                    value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-indigo-200 active:scale-95 transition">
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Orders = ({ products, setProducts, orders, setOrders }) => {
  const [view, setView] = useState('list');
  const [cart, setCart] = useState({});

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
        <div className="bg-white p-3 border-b flex items-center gap-2 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="rotate-180 text-gray-600" /></button>
          <h2 className="text-xl font-bold text-gray-800">Tạo Đơn</h2>
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

const Settings = ({ products, orders, setProducts, setOrders }) => {
  // Backup Data
  const exportData = () => {
    const data = JSON.stringify({ products, orders });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_shop_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Restore Data
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products && data.orders) {
          if (window.confirm('Hành động này sẽ ghi đè dữ liệu hiện tại. Bạn có chắc không?')) {
            setProducts(data.products);
            setOrders(data.orders);
            alert('Khôi phục dữ liệu thành công!');
          }
        }
      } catch (err) {
        alert('File lỗi, không đọc được!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cài đặt & Dữ liệu</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 font-bold text-gray-700">Sao lưu & Khôi phục</div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">Vì dùng bản Offline, hãy thường xuyên tải file Backup về để tránh mất dữ liệu khi hỏng điện thoại.</p>

          <button onClick={exportData} className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-100 transition">
            <Download size={18} /> Tải Dữ Liệu Về Máy (Backup)
          </button>

          <div className="relative">
            <input type="file" onChange={importData} className="absolute inset-0 opacity-0 cursor-pointer" accept=".json" />
            <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
              <Upload size={18} /> Khôi Phục Dữ Liệu (Restore)
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400">
        Phiên bản Offline v1.0 <br />
        Dữ liệu lưu tại LocalStorage
      </div>
    </div>
  )
}

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load data from LocalStorage
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('shop_products_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('shop_orders_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Save data automatically
  useEffect(() => {
    try {
      localStorage.setItem('shop_products_v2', JSON.stringify(products));
    } catch (e) {
      alert("Bộ nhớ đầy! Hãy xóa bớt ảnh hoặc sản phẩm cũ.");
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shop_orders_v2', JSON.stringify(orders));
  }, [orders]);

  return (
    <div className="h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'dashboard' && <Dashboard products={products} orders={orders} />}
        {activeTab === 'orders' && <Orders products={products} setProducts={setProducts} orders={orders} setOrders={setOrders} />}
        {activeTab === 'inventory' && <Inventory products={products} setProducts={setProducts} />}
        {activeTab === 'settings' && <Settings products={products} orders={orders} setProducts={setProducts} setOrders={setOrders} />}
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <style>{`
        .pb-safe-area { padding-bottom: env(safe-area-inset-bottom); }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;