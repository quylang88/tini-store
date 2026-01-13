import { useState } from 'react';
import {
  createFormDataForLot,
  createFormDataForNewProduct,
  createFormDataForProduct,
} from '../utils/inventoryForm';
import useInventoryFormState from './inventory/useInventoryFormState';
import useInventoryFilters from './inventory/useInventoryFilters';
import { buildNextProductFromForm, getInventoryValidationError } from './inventory/inventorySaveUtils';

const useInventoryLogic = ({ products, setProducts, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingLotId, setEditingLotId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Modal xác nhận xoá sản phẩm để giao diện đồng bộ
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal báo lỗi riêng cho form tạo/sửa sản phẩm
  const [errorModal, setErrorModal] = useState(null);

  // State quản lý danh mục đang xem (cho phép chọn nhiều danh mục).
  const [activeCategories, setActiveCategories] = useState([]);
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  // Form data phục vụ nhập kho: nhập giá, tồn kho, phí gửi theo từng kho.
  const {
    formData,
    setFormData,
    handleMoneyChange,
    handleCurrencyChange,
    handleShippingMethodChange,
    handleDecimalChange,
    handleImageSelect,
  } = useInventoryFormState({ settings, activeCategories });

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

  const handleSave = () => {
    const validationError = getInventoryValidationError({
      formData,
      products,
      editingProduct,
      editingLotId,
    });
    if (validationError) {
      setErrorModal(validationError);
      return;
    }

    const nextProduct = buildNextProductFromForm({
      formData,
      editingProduct,
      editingLotId,
      settings,
    });

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? nextProduct : p));
    } else {
      setProducts([...products, nextProduct]);
    }
    closeModal();
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setEditingLotId(null);
      setFormData(createFormDataForProduct({ product, settings }));
    } else {
      setEditingProduct(null);
      setEditingLotId(null);
      setFormData(createFormDataForNewProduct({ settings, activeCategories }));
    }
    setIsModalOpen(true);
  };

  const openEditLot = (product, lot) => {
    if (!product || !lot) return;
    setEditingProduct(product);
    setEditingLotId(lot.id);
    setFormData(createFormDataForLot({ product, lot, settings }));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setEditingLotId(null);
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

  const { filteredProducts, nameSuggestions } = useInventoryFilters({
    products,
    searchTerm,
    activeCategories,
    warehouseFilter,
    editingProduct,
    formDataName: formData.name,
  });

  const toggleCategory = (category) => {
    setActiveCategories((prev) => {
      if (category === 'Tất cả') {
        return [];
      }
      if (prev.includes(category)) {
        return prev.filter(item => item !== category);
      }
      return [...prev, category];
    });
  };

  const handleSelectExistingProduct = (product) => {
    setEditingProduct(product);
    setEditingLotId(null);
    setFormData(createFormDataForProduct({ product, settings }));
  };

  return {
    isModalOpen,
    showScanner,
    setShowScanner,
    editingProduct,
    editingLotId,
    searchTerm,
    setSearchTerm,
    confirmModal,
    setConfirmModal,
    errorModal,
    setErrorModal,
    activeCategories,
    warehouseFilter,
    setWarehouseFilter,
    toggleCategory,
    handleCurrencyChange,
    handleShippingMethodChange,
    formData,
    setFormData,
    handleMoneyChange,
    handleDecimalChange,
    handleScanSuccess,
    handleImageSelect,
    handleSave,
    openModal,
    openEditLot,
    closeModal,
    handleDelete,
    filteredProducts,
    nameSuggestions,
    handleSelectExistingProduct,
  };
};

export default useInventoryLogic;
