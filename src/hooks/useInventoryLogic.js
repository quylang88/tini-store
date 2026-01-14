import { useRef, useState } from 'react';
import {
  createFormDataForLot,
  createFormDataForNewProduct,
  createFormDataForProduct,
} from '../utils/inventoryForm';
import useInventoryFormState from './inventory/useInventoryFormState';
import useInventoryFilters from './inventory/useInventoryFilters';
import { buildNextProductFromForm, getInventoryValidationError } from './inventory/inventorySaveUtils';

const useInventoryLogic = ({ products, setProducts, orders, setOrders, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingLotId, setEditingLotId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Modal xác nhận xoá sản phẩm để giao diện đồng bộ
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal báo lỗi riêng cho form tạo/sửa sản phẩm
  const [errorModal, setErrorModal] = useState(null);
  // Lưu lại snapshot form khi mở modal để so sánh thay đổi khi bấm huỷ.
  const initialFormDataRef = useRef(null);

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
      // Cảnh báo khi mã vạch đã tồn tại để user biết dùng sản phẩm cũ.
      setErrorModal({
        title: 'Sản phẩm đã tồn tại',
        message: `Sản phẩm này đã có: ${existingProduct.name}.`,
      });
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

      // Cập nhật tên sản phẩm trong các đơn hàng cũ (nếu có thay đổi tên)
      if (orders && setOrders && editingProduct.name !== nextProduct.name) {
        setOrders(orders.map(order => ({
          ...order,
          items: order.items.map(item => {
            if (item.productId === editingProduct.id) {
              return { ...item, name: nextProduct.name };
            }
            return item;
          }),
        })));
      }
    } else {
      setProducts([...products, nextProduct]);
    }
    closeModal();
  };

  const buildComparableFormData = (data) => {
    if (!data) return data;
    // Khi nhập theo Yên, cost được tự tính nên cần chuẩn hoá trước khi so sánh.
    if (data.costCurrency === 'JPY') {
      const jpyValue = Number(data.costJPY || 0);
      const exchangeValue = Number(data.exchangeRate || 0);
      return {
        ...data,
        cost: jpyValue > 0 && exchangeValue > 0 ? Math.round(jpyValue * exchangeValue) : '',
      };
    }
    return data;
  };

  const hasFormChanges = () => {
    if (!initialFormDataRef.current) return false;
    const initialSnapshot = JSON.stringify(buildComparableFormData(initialFormDataRef.current));
    const currentSnapshot = JSON.stringify(buildComparableFormData(formData));
    return initialSnapshot !== currentSnapshot;
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setEditingLotId(null);
      const nextFormData = createFormDataForProduct({ product, settings });
      setFormData(nextFormData);
      initialFormDataRef.current = nextFormData;
    } else {
      setEditingProduct(null);
      setEditingLotId(null);
      const nextFormData = createFormDataForNewProduct({ settings, activeCategories });
      setFormData(nextFormData);
      initialFormDataRef.current = nextFormData;
    }
    setIsModalOpen(true);
  };

  const openEditLot = (product, lot) => {
    if (!product || !lot) return;
    setEditingProduct(product);
    setEditingLotId(lot.id);
    const nextFormData = createFormDataForLot({ product, lot, settings });
    setFormData(nextFormData);
    initialFormDataRef.current = nextFormData;
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setEditingLotId(null);
    initialFormDataRef.current = null;
  };

  const handleCancelModal = () => {
    // Nếu không có thay đổi thì đóng luôn, tránh hỏi user.
    if (!hasFormChanges()) {
      closeModal();
      return;
    }
    // Có chỉnh sửa thì hiện cảnh báo để tránh mất dữ liệu.
    setConfirmModal({
      title: 'Huỷ chỉnh sửa?',
      message: 'Bạn đang có thay đổi chưa lưu. Bạn có chắc muốn huỷ không?',
      confirmLabel: 'Huỷ thay đổi',
      cancelLabel: 'Tiếp tục sửa',
      tone: 'danger',
      onConfirm: () => closeModal(),
    });
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
    handleCancelModal,
    handleDelete,
    filteredProducts,
    nameSuggestions,
    handleSelectExistingProduct,
  };
};

export default useInventoryLogic;
