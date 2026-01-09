import React, { useState, useRef, useEffect } from 'react';
import { Search, ScanBarcode, Plus, Image as ImageIcon, Edit, Trash2, Upload, X } from 'lucide-react';
import { compressImage } from '../utils/helpers';
import BarcodeScanner from '../components/BarcodeScanner';

const Inventory = ({ products, setProducts, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State quản lý danh mục đang xem
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  const fileInputRef = useRef(null);

  // Form data có thêm các trường mới: category, costJPY, exchangeRate
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Chung',
    costJPY: '',       // Giá vốn tiền Yên
    exchangeRate: settings.exchangeRate, // Lấy tỷ giá mặc định từ Settings
    cost: '',          // Giá vốn VNĐ
    price: '',         // Giá bán VNĐ
    stock: '',
    image: ''
  });

  // Tự động tính giá vốn VNĐ khi nhập Yên hoặc thay đổi Tỷ giá
  useEffect(() => {
    if (formData.costJPY && formData.exchangeRate) {
      const calculatedCost = Math.round(formData.costJPY * formData.exchangeRate);
      setFormData(prev => ({ ...prev, cost: calculatedCost }));
    }
  }, [formData.costJPY, formData.exchangeRate]);

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    const existingProduct = products.find(p => p.barcode === decodedText);

    if (existingProduct) {
      alert(`Sản phẩm này đã có: ${existingProduct.name}`);
      openModal(existingProduct);
    } else {
      if (isModalOpen) {
        setFormData(prev => ({ ...prev, barcode: decodedText }));
      } else {
        openModal();
        setTimeout(() => setFormData(prev => ({ ...prev, barcode: decodedText })), 100);
      }
    }
  };

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setFormData(prev => ({ ...prev, image: compressed }));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      alert("Vui lòng nhập Tên và Giá bán!");
      return;
    }

    // Check trùng Barcode
    if (formData.barcode) {
      const duplicateBarcode = products.find(p =>
        p.barcode === formData.barcode && p.id !== (editingProduct ? editingProduct.id : null)
      );
      if (duplicateBarcode) {
        alert(`LỖI: Mã vạch này trùng với SP "${duplicateBarcode.name}"`);
        return;
      }
    }

    const newProduct = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.name.trim(),
      barcode: formData.barcode ? formData.barcode.trim() : '',
      category: formData.category,
      costJPY: Number(formData.costJPY) || 0,
      exchangeRate: Number(formData.exchangeRate) || settings.exchangeRate,
      cost: Number(formData.cost) || 0, // Giá vốn VNĐ
      price: Number(formData.price),    // Giá bán VNĐ
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
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        category: product.category || 'Chung',
        costJPY: product.costJPY || '',
        exchangeRate: product.exchangeRate || settings.exchangeRate,
        cost: product.cost || '',
        price: product.price,
        stock: product.stock,
        image: product.image || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        category: activeCategory === 'Tất cả' ? 'Chung' : activeCategory,
        costJPY: '',
        exchangeRate: settings.exchangeRate, // Load tỷ giá mặc định
        cost: '',
        price: '',
        stock: '',
        image: ''
      });
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

  // LỌC SẢN PHẨM: Theo Tìm kiếm + Theo Danh mục
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchCategory = activeCategory === 'Tất cả' || p.category === activeCategory;

    return matchSearch && matchCategory;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}

      <div className="bg-white sticky top-0 z-10 shadow-sm">
        {/* Header & Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">Kho Hàng</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowScanner(true)} className="bg-gray-100 text-gray-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-200">
                <ScanBarcode size={20} />
              </button>
              <button onClick={() => openModal()} className="bg-indigo-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95">
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm tên hoặc quét mã..."
              className="w-full bg-gray-100 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Thanh Tab Danh mục */}
        <div className="px-3 pb-0 overflow-x-auto flex gap-2 no-scrollbar border-b border-gray-100">
          <button
            onClick={() => setActiveCategory('Tất cả')}
            className={`whitespace-nowrap py-3 px-2 border-b-2 text-sm font-medium transition-colors ${activeCategory === 'Tất cả' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
          >
            Tất cả
          </button>
          {settings.categories.map(cat => (
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

      {/* Danh sách sản phẩm */}
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
              <div className="flex justify-between items-start">
                <div className="font-bold text-gray-800 truncate">{p.name}</div>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{p.category}</span>
              </div>

              <div className="text-xs text-gray-400 font-mono mb-0.5">{p.barcode || '---'}</div>

              <div className="flex justify-between items-end mt-1">
                <div>
                  <div className="text-indigo-600 font-bold text-sm">{p.price.toLocaleString()}đ</div>
                  {p.costJPY > 0 && (
                    <div className="text-[10px] text-gray-400">
                      Vốn: ¥{p.costJPY} ({p.cost.toLocaleString()}đ)
                    </div>
                  )}
                </div>
                <div className={`text-xs font-medium ${p.stock < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                  Kho: {p.stock}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pl-2 border-l border-gray-50">
              <button onClick={() => openModal(p)} className="text-gray-400 hover:text-indigo-600"><Edit size={18} /></button>
              <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 mt-10 text-sm">Không có sản phẩm nào</div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg">{editingProduct ? 'Sửa Sản Phẩm' : 'Thêm Mới'}</h3>
              <button onClick={closeModal} className="bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {/* Image */}
              <div className="flex justify-center">
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition cursor-pointer overflow-hidden relative"
                >
                  {formData.image ? (
                    <img src={formData.image} className="w-full h-full object-contain absolute inset-0" alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload size={24} className="mb-2" />
                      <span className="text-xs">Chạm để tải ảnh</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* Barcode & Category */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                    Mã Vạch <ScanBarcode size={14} className="text-indigo-600 cursor-pointer" onClick={() => setShowScanner(true)} />
                  </label>
                  <input
                    className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-mono text-sm"
                    value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Quét/Nhập..."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Danh mục</label>
                  <select
                    className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 text-sm bg-transparent"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {settings.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Tên sản phẩm</label>
                <input
                  className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-medium"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên..."
                />
              </div>

              {/* Khu vực tính giá Yên */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="text-[10px] font-bold text-blue-800 uppercase">Giá nhập (Yên)</label>
                    <div className="relative">
                      <span className="absolute left-0 top-2 text-blue-500">¥</span>
                      <input
                        type="number"
                        className="w-full bg-transparent border-b border-blue-200 py-2 pl-4 focus:border-blue-500 outline-none text-blue-900 font-bold"
                        value={formData.costJPY} onChange={e => setFormData({ ...formData, costJPY: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-blue-800 uppercase">Tỷ giá</label>
                    <input
                      type="number"
                      className="w-full bg-transparent border-b border-blue-200 py-2 focus:border-blue-500 outline-none text-blue-900 text-right"
                      value={formData.exchangeRate} onChange={e => setFormData({ ...formData, exchangeRate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="text-right text-xs text-blue-600 font-medium">
                  = {Number(formData.cost).toLocaleString()} VNĐ (Vốn)
                </div>
              </div>

              {/* VND Pricing & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-bold text-lg"
                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tồn kho</label>
                  <input
                    type="number"
                    className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-bold text-lg"
                    value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-indigo-200 active:scale-95 transition">
                Lưu Sản Phẩm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;