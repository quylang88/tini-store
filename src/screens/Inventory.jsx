import React, { useState, useEffect } from 'react';
import { compressImage, sanitizeNumberInput } from '../utils/helpers';
import BarcodeScanner from '../components/BarcodeScanner';
import InventoryHeader from '../components/inventory/InventoryHeader';
import ProductList from '../components/inventory/ProductList';
import ProductModal from '../components/inventory/ProductModal';

const Inventory = ({ products, setProducts, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State quản lý danh mục đang xem
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  // Form data có thêm các trường mới: category, costJPY, exchangeRate
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Chung',
    costCurrency: 'JPY',
    costJPY: '', // Giá vốn tiền Yên
    exchangeRate: String(settings.exchangeRate), // Lấy tỷ giá mặc định từ Settings
    cost: '', // Giá vốn VNĐ
    price: '', // Giá bán VNĐ
    stock: '',
    image: ''
  });

  // Tự động tính giá vốn VNĐ khi nhập Yên hoặc thay đổi Tỷ giá
  useEffect(() => {
    if (formData.costCurrency !== 'JPY') {
      return;
    }
    const costJPYValue = Number(formData.costJPY || 0);
    const exchangeRateValue = Number(formData.exchangeRate || 0);
    if (costJPYValue > 0 && exchangeRateValue > 0) {
      const calculatedCost = Math.round(costJPYValue * exchangeRateValue);
      setFormData(prev => ({ ...prev, cost: calculatedCost }));
    } else {
      setFormData(prev => ({ ...prev, cost: 0 }));
    }
  }, [formData.costCurrency, formData.costJPY, formData.exchangeRate]);

  const handleMoneyChange = (field) => (event) => {
    const rawValue = sanitizeNumberInput(event.target.value);
    setFormData(prev => ({ ...prev, [field]: rawValue }));
  };

  const handleCurrencyChange = (event) => {
    const nextCurrency = event.target.value;
    setFormData(prev => ({
      ...prev,
      costCurrency: nextCurrency,
      cost: nextCurrency === 'JPY' ? '' : prev.cost,
      costJPY: nextCurrency === 'VND' ? '' : prev.costJPY,
      exchangeRate: String(settings.exchangeRate)
    }));
  };

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

  const handleImageSelect = async (file) => {
    if (!file) {
      return;
    }
    // Cho phép dùng chung xử lý nén ảnh cho cả tải file và chụp camera
    const compressed = await compressImage(file);
    setFormData(prev => ({ ...prev, image: compressed }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      alert("Vui lòng nhập Tên và Giá bán!");
      return;
    }

    const costValue = Number(formData.cost) || 0;
    const priceValue = Number(formData.price) || 0;
    if (costValue > 0 && priceValue <= costValue) {
      alert("Giá bán phải cao hơn giá vốn!");
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
      costCurrency: formData.costCurrency,
      costJPY: Number(formData.costJPY) || 0,
      exchangeRate: Number(formData.exchangeRate) || settings.exchangeRate,
      cost: Number(formData.cost) || 0, // Giá vốn VNĐ
      price: Number(formData.price), // Giá bán VNĐ
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
        costCurrency: product.costCurrency || (product.costJPY > 0 ? 'JPY' : 'VND'),
        costJPY: product.costJPY || '',
        exchangeRate: String(product.exchangeRate || settings.exchangeRate),
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
        costCurrency: 'JPY',
        costJPY: '',
        exchangeRate: String(settings.exchangeRate), // Load tỷ giá mặc định
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

      {/* Tách phần header & tab danh mục để Inventory gọn hơn */}
      <InventoryHeader
        searchTerm={searchTerm}
        onSearchChange={e => setSearchTerm(e.target.value)}
        onOpenModal={() => openModal()}
        onShowScanner={() => setShowScanner(true)}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={settings.categories}
      />

      {/* Tách danh sách sản phẩm thành component riêng */}
      <ProductList
        products={filtered}
        onEdit={openModal}
        onDelete={handleDelete}
      />

      {/* Tách form modal và bổ sung nút chụp ảnh từ camera */}
      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        categories={settings.categories}
        onClose={closeModal}
        onSave={handleSave}
        onShowScanner={() => setShowScanner(true)}
        onImageSelect={handleImageSelect}
        onCurrencyChange={handleCurrencyChange}
        onMoneyChange={handleMoneyChange}
      />
    </div>
  );
};

export default Inventory;
