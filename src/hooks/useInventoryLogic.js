import { useState } from 'react';
import { compressImage, sanitizeNumberInput } from '../utils/helpers';
import { normalizeWarehouseStock } from '../utils/warehouseUtils';
import { normalizePurchaseLots } from '../utils/purchaseUtils';

const useInventoryLogic = ({ products, setProducts, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Modal xác nhận xoá sản phẩm để giao diện đồng bộ
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal báo lỗi riêng cho form tạo/sửa sản phẩm
  const [errorModal, setErrorModal] = useState(null);

  // State quản lý danh mục đang xem
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  // Form data chỉ giữ thông tin cơ bản để chỉnh sửa nhanh sản phẩm.
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Chung',
    price: '', // Giá bán VNĐ
    image: ''
  });

  const handleMoneyChange = (field) => (event) => {
    const rawValue = sanitizeNumberInput(event.target.value);
    setFormData(prev => ({ ...prev, [field]: rawValue }));
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
      setErrorModal({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập Tên sản phẩm và Giá bán trước khi lưu.'
      });
      return;
    }
    const priceValue = Number(formData.price) || 0;

    // Check trùng Barcode
    if (formData.barcode) {
      const duplicateBarcode = products.find(p =>
        p.barcode === formData.barcode && p.id !== (editingProduct ? editingProduct.id : null)
      );
      if (duplicateBarcode) {
        setErrorModal({
          title: 'Mã vạch bị trùng',
          message: `Mã vạch này đã được dùng cho "${duplicateBarcode.name}". Vui lòng kiểm tra lại.`
        });
        return;
      }
    }

    const existingStock = editingProduct ? normalizeWarehouseStock(editingProduct) : { daLat: 0, vinhPhuc: 0 };
    const existingLots = editingProduct ? normalizePurchaseLots(editingProduct) : [];
    const newProduct = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      name: formData.name.trim(),
      barcode: formData.barcode ? formData.barcode.trim() : '',
      category: formData.category,
      price: Number(formData.price), // Giá bán VNĐ
      purchaseLots: existingLots,
      stockByWarehouse: existingStock,
      stock: existingStock.daLat + existingStock.vinhPhuc,
      image: formData.image,
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
      const warehouseStock = normalizeWarehouseStock(product);
      setEditingProduct(product);
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        category: product.category || 'Chung',
        price: product.price,
        image: product.image || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        category: activeCategory === 'Tất cả' ? 'Chung' : activeCategory,
        price: '',
        image: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id) => {
    const product = products.find(p => p.id === id);
    setConfirmModal({
      title: 'Xoá sản phẩm?',
      message: product ? `Bạn có chắc muốn xoá "${product.name}" khỏi kho?` : 'Bạn có chắc muốn xoá sản phẩm này?',
      confirmLabel: 'Xoá sản phẩm',
      tone: 'danger',
      onConfirm: () => setProducts(products.filter(p => p.id !== id))
    });
  };

  // LỌC SẢN PHẨM: Theo Tìm kiếm + Theo Danh mục
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchCategory = activeCategory === 'Tất cả' || p.category === activeCategory;

    return matchSearch && matchCategory;
  });

  return {
    isModalOpen,
    showScanner,
    setShowScanner,
    editingProduct,
    searchTerm,
    setSearchTerm,
    confirmModal,
    setConfirmModal,
    errorModal,
    setErrorModal,
    activeCategory,
    setActiveCategory,
    formData,
    setFormData,
    handleMoneyChange,
    handleScanSuccess,
    handleImageSelect,
    handleSave,
    openModal,
    closeModal,
    handleDelete,
    filteredProducts,
  };
};

export default useInventoryLogic;
