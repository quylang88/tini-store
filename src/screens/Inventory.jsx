import React, { useState, useRef } from 'react';
import { Search, ScanBarcode, Plus, Image as ImageIcon, Edit, Trash2, Upload, X } from 'lucide-react';

import { compressImage } from '../utils/helpers';
import BarcodeScanner from '../components/BarcodeScanner';

const Inventory = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({ name: '', barcode: '', price: '', stock: '', image: '' });

  // Xử lý khi quét mã vạch thành công
  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);

    // Kiểm tra xem mã này đã có trong kho chưa
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
      alert("Vui lòng nhập Tên và Giá!");
      return;
    }

    // Check trùng Barcode
    if (formData.barcode) {
      const duplicateBarcode = products.find(p =>
        p.barcode === formData.barcode && p.id !== (editingProduct ? editingProduct.id : null)
      );
      if (duplicateBarcode) {
        alert(`LỖI: Mã vạch này đang thuộc về sản phẩm "${duplicateBarcode.name}"`);
        return;
      }
    }

    // Check trùng Tên
    const duplicateName = products.find(p =>
      p.name.toLowerCase() === formData.name.trim().toLowerCase() && p.id !== (editingProduct ? editingProduct.id : null)
    );
    if (duplicateName) {
      if (!window.confirm(`Cảnh báo: Tên "${duplicateName.name}" đã tồn tại. Bạn có chắc muốn tạo thêm không?`)) {
        return;
      }
    }

    const newProduct = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.name.trim(),
      barcode: formData.barcode ? formData.barcode.trim() : '',
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
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        price: product.price,
        stock: product.stock,
        image: product.image || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', barcode: '', price: '', stock: '', image: '' });
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

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* SCANNER OVERLAY */}
      {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}

      <div className="bg-white p-3 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-800">Kho Hàng</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="bg-gray-100 text-gray-700 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-200"
            >
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
              <div className="text-xs text-gray-400 font-mono mb-0.5">{p.barcode || 'Chưa có mã'}</div>
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
          <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg">{editingProduct ? 'Sửa SP' : 'Thêm Mới'}</h3>
              <button onClick={closeModal} className="bg-gray-100 p-1.5 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {/* Image Upload Area */}
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
                <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                  Mã Vạch (Barcode)
                  <button onClick={() => setShowScanner(true)} className="text-indigo-600 flex items-center gap-1">
                    <ScanBarcode size={14} /> Quét ngay
                  </button>
                </label>
                <input
                  className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-800 font-mono"
                  value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Quét hoặc nhập tay..."
                />
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

export default Inventory;