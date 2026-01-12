import { useEffect, useMemo, useState } from 'react';
import { compressImage, sanitizeDecimalInput, sanitizeNumberInput } from '../utils/helpers';
import { normalizeWarehouseStock } from '../utils/warehouseUtils';
import {
  addPurchaseLot,
  getLatestCost,
  normalizePurchaseLots,
} from '../utils/purchaseUtils';

const useInventoryLogic = ({ products, setProducts, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Modal xác nhận xoá sản phẩm để giao diện đồng bộ
  const [confirmModal, setConfirmModal] = useState(null);
  // Modal báo lỗi riêng cho form tạo/sửa sản phẩm
  const [errorModal, setErrorModal] = useState(null);

  // State quản lý danh mục đang xem (cho phép chọn nhiều danh mục).
  const [activeCategories, setActiveCategories] = useState([]);
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  // Form data phục vụ nhập kho: nhập giá, tồn kho, phí gửi theo từng kho.
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'Chung',
    costCurrency: 'JPY',
    costJPY: '',
    exchangeRate: String(settings.exchangeRate),
    cost: '', // Giá nhập VNĐ
    price: '', // Giá bán VNĐ
    quantity: '',
    warehouse: 'vinhPhuc',
    shippingMethod: 'jp',
    shippingWeightKg: '',
    shippingFeeVnd: '',
    image: '',
  });

  // Tự động tính giá nhập VNĐ khi chọn nhập theo Yên.
  useEffect(() => {
    if (formData.costCurrency !== 'JPY') {
      return;
    }
    const costJPYValue = Number(formData.costJPY || 0);
    const exchangeRateValue = Number(formData.exchangeRate || 0);
    const calculatedCost = costJPYValue > 0 && exchangeRateValue > 0
      ? Math.round(costJPYValue * exchangeRateValue)
      : 0;
    setFormData(prev => ({ ...prev, cost: calculatedCost }));
  }, [formData.costCurrency, formData.costJPY, formData.exchangeRate]);

  const handleMoneyChange = (field) => (event) => {
    const rawValue = sanitizeNumberInput(event.target.value);
    setFormData(prev => ({ ...prev, [field]: rawValue }));
  };

  const handleCurrencyChange = (nextCurrency) => {
    setFormData(prev => ({
      ...prev,
      costCurrency: nextCurrency,
      cost: nextCurrency === 'JPY' ? prev.cost : prev.cost,
      costJPY: nextCurrency === 'VND' ? '' : prev.costJPY,
      exchangeRate: String(settings.exchangeRate),
    }));
  };

  const handleDecimalChange = (field) => (event) => {
    const rawValue = sanitizeDecimalInput(event.target.value);
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

    if (!editingProduct) {
      const duplicateName = products.find(
        (product) => product.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (duplicateName) {
        setErrorModal({
          title: 'Sản phẩm đã tồn tại',
          message: 'Vui lòng chọn sản phẩm trong gợi ý để nhập thêm hàng.'
        });
        return;
      }
    }

    const costValue = Number(formData.cost) || 0;
    const priceValue = Number(formData.price) || 0;
    if (costValue > 0 && priceValue <= costValue) {
      setErrorModal({
        title: 'Giá bán chưa hợp lệ',
        message: 'Giá bán phải cao hơn giá vốn để đảm bảo có lợi nhuận.'
      });
      return;
    }

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

    const quantityValue = Number(formData.quantity) || 0;
    const warehouseKey = formData.warehouse || 'daLat';

    if (!editingProduct && quantityValue <= 0) {
      setErrorModal({
        title: 'Thiếu số lượng nhập',
        message: 'Sản phẩm mới cần có số lượng nhập kho ban đầu.'
      });
      return;
    }

    if (quantityValue > 0 && costValue <= 0) {
      setErrorModal({
        title: 'Thiếu giá nhập',
        message: 'Vui lòng nhập giá nhập khi có số lượng nhập kho.'
      });
      return;
    }

    const shippingWeight = Number(formData.shippingWeightKg) || 0;
    if (quantityValue > 0 && formData.shippingMethod === 'jp' && shippingWeight <= 0) {
      setErrorModal({
        title: 'Thiếu cân nặng',
        message: 'Vui lòng nhập cân nặng nếu mua tại Nhật.'
      });
      return;
    }

    const exchangeRateValue = Number(formData.exchangeRate || settings.exchangeRate) || 0;
    const feeJpy = formData.shippingMethod === 'jp'
      ? Math.round(shippingWeight * 900)
      : 0;
    const feeVnd = formData.shippingMethod === 'jp'
      ? Math.round(feeJpy * exchangeRateValue)
      : Number(formData.shippingFeeVnd) || 0;

    const baseProduct = editingProduct
      ? normalizePurchaseLots(editingProduct)
      : {
        id: Date.now().toString(),
        purchaseLots: [],
        stockByWarehouse: { daLat: 0, vinhPhuc: 0 },
        stock: 0,
      };

    const existingStock = normalizeWarehouseStock(baseProduct);
    const nextStockByWarehouse = {
      ...existingStock,
      [warehouseKey]: existingStock[warehouseKey] + quantityValue,
    };

    let nextProduct = {
      ...baseProduct,
      name: formData.name.trim(),
      barcode: formData.barcode ? formData.barcode.trim() : '',
      category: formData.category,
      price: Number(formData.price),
      cost: costValue || getLatestCost(baseProduct),
      image: formData.image,
      stockByWarehouse: nextStockByWarehouse,
      stock: nextStockByWarehouse.daLat + nextStockByWarehouse.vinhPhuc,
    };

    // Lưu lại từng lần nhập hàng thành "lô giá nhập" để quản lý tồn kho theo giá.
    if (quantityValue > 0) {
      const shippingInfo = {
        method: formData.shippingMethod,
        weightKg: formData.shippingMethod === 'jp' ? shippingWeight : 0,
        feeJpy,
        feeVnd,
        exchangeRate: exchangeRateValue,
      };
      nextProduct = addPurchaseLot(nextProduct, {
        cost: costValue,
        quantity: quantityValue,
        warehouse: warehouseKey,
        shipping: shippingInfo,
      });
    }

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
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        category: product.category || 'Chung',
        costCurrency: 'VND',
        costJPY: '',
        exchangeRate: String(settings.exchangeRate),
        cost: getLatestCost(product) || '',
        price: product.price,
        quantity: '',
        warehouse: 'vinhPhuc',
        shippingMethod: 'jp',
        shippingWeightKg: '',
        shippingFeeVnd: '',
        image: product.image || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        category: activeCategories.length === 1 ? activeCategories[0] : 'Chung',
        costCurrency: 'JPY',
        costJPY: '',
        exchangeRate: String(settings.exchangeRate),
        cost: '',
        price: '',
        quantity: '',
        warehouse: 'vinhPhuc',
        shippingMethod: 'jp',
        shippingWeightKg: '',
        shippingFeeVnd: '',
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
    const matchCategory = activeCategories.length === 0 || activeCategories.includes(p.category);
    const stockByWarehouse = normalizeWarehouseStock(p);
    const matchWarehouse = warehouseFilter === 'all'
      || (warehouseFilter === 'daLat' && stockByWarehouse.daLat > 0)
      || (warehouseFilter === 'vinhPhuc' && stockByWarehouse.vinhPhuc > 0);

    return matchSearch && matchCategory && matchWarehouse;
  });

  const nameSuggestions = useMemo(() => {
    if (editingProduct) return [];
    const keyword = formData.name.trim().toLowerCase();
    if (!keyword) return [];
    return products
      .filter(product => product.name.toLowerCase().includes(keyword))
      .slice(0, 5);
  }, [products, formData.name, editingProduct]);

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
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category || 'Chung',
      costCurrency: 'VND',
      costJPY: '',
      exchangeRate: String(settings.exchangeRate),
      cost: getLatestCost(product) || '',
      price: product.price,
      quantity: '',
      warehouse: 'vinhPhuc',
      shippingMethod: 'jp',
      shippingWeightKg: '',
      shippingFeeVnd: '',
      image: product.image || '',
    });
  };

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
    activeCategories,
    setActiveCategories,
    warehouseFilter,
    setWarehouseFilter,
    toggleCategory,
    handleCurrencyChange,
    formData,
    setFormData,
    handleMoneyChange,
    handleDecimalChange,
    handleScanSuccess,
    handleImageSelect,
    handleSave,
    openModal,
    closeModal,
    handleDelete,
    filteredProducts,
    nameSuggestions,
    handleSelectExistingProduct,
  };
};

export default useInventoryLogic;
