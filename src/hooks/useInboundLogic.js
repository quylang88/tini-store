import { useMemo, useState } from 'react';
import { sanitizeDecimalInput, sanitizeNumberInput } from '../utils/helpers';
import { getWarehouseLabel, normalizeWarehouseStock } from '../utils/warehouseUtils';

const DEFAULT_WAREHOUSE = 'daLat';

const useInboundLogic = ({
  products,
  setProducts,
  inboundShipments,
  setInboundShipments,
  settings,
}) => {
  // Màn hình nhập kho tách 2 trạng thái: danh sách kiện và tạo kiện mới.
  const [view, setView] = useState('list');
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  // Đồng bộ trạng thái tìm kiếm/danh mục để layout tạo kiện giống tạo đơn hàng.
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [shipmentDraft, setShipmentDraft] = useState({
    warehouse: DEFAULT_WAREHOUSE,
    method: 'vn',
    weightKg: '',
    feeVnd: '',
    comment: '',
    items: {},
    error: '',
  });

  const pendingPurchases = useMemo(
    () => products
      .filter(item => (Number(item.purchasePending) || 0) > 0)
      .map(item => ({
        productId: item.id,
        name: item.name,
        quantity: Number(item.purchasePending) || 0,
        image: item.image || '',
        price: item.price || 0,
        barcode: item.barcode || '',
        category: item.category || 'Chung',
      })),
    [products],
  );

  const filteredProducts = useMemo(() => pendingPurchases.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchTerm));
    const matchCategory = activeCategory === 'Tất cả' || item.category === activeCategory;
    return matchSearch && matchCategory;
  }), [pendingPurchases, searchTerm, activeCategory]);

  const resetShipmentDraft = () => {
    setShipmentDraft({
      warehouse: DEFAULT_WAREHOUSE,
      method: 'vn',
      weightKg: '',
      feeVnd: '',
      comment: '',
      items: {},
      error: '',
    });
    setSearchTerm('');
    setActiveCategory('Tất cả');
  };

  const handleStartCreate = () => {
    resetShipmentDraft();
    setView('create');
  };

  const handleExitCreate = () => {
    resetShipmentDraft();
    setView('list');
  };

  const handleShipmentItemChange = (productId, value, maxQuantity) => {
    const nextValue = Math.max(0, Math.min(maxQuantity, Number(value) || 0));
    setShipmentDraft((prev) => {
      const nextItems = { ...prev.items };
      if (nextValue <= 0) {
        delete nextItems[productId];
      } else {
        nextItems[productId] = nextValue;
      }
      return {
        ...prev,
        items: nextItems,
        error: '',
      };
    });
  };

  // Điều chỉnh nhanh +/- số lượng giống thao tác trong màn hình tạo đơn.
  const adjustQuantity = (productId, delta, maxQuantity) => {
    setShipmentDraft((prev) => {
      const current = prev.items[productId] || 0;
      const nextValue = Math.max(0, Math.min(maxQuantity, current + delta));
      const nextItems = { ...prev.items };
      if (nextValue <= 0) {
        delete nextItems[productId];
      } else {
        nextItems[productId] = nextValue;
      }
      return {
        ...prev,
        items: nextItems,
        error: '',
      };
    });
  };

  const handleShipmentFieldChange = (field) => (value) => {
    if (field === 'weightKg') {
      const sanitized = sanitizeDecimalInput(value);
      setShipmentDraft(prev => ({ ...prev, weightKg: sanitized, error: '' }));
      return;
    }
    if (field === 'feeVnd') {
      const sanitized = sanitizeNumberInput(value);
      setShipmentDraft(prev => ({ ...prev, feeVnd: sanitized, error: '' }));
      return;
    }
    setShipmentDraft(prev => ({ ...prev, [field]: value, error: '' }));
  };

  const getSelectedItems = () => pendingPurchases
    .map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: Number(shipmentDraft.items[item.productId]) || 0,
    }))
    .filter(item => item.quantity > 0);

  // Chỉ mở modal thông tin kiện sau khi đã chọn sản phẩm.
  const handleOpenShipmentModal = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      setShipmentDraft(prev => ({ ...prev, error: 'Vui lòng chọn sản phẩm để lên kiện.' }));
      return;
    }
    setShipmentModalOpen(true);
  };

  const handleShipmentSave = () => {
    const selectedItems = getSelectedItems();

    if (selectedItems.length === 0) {
      setShipmentDraft(prev => ({ ...prev, error: 'Vui lòng chọn sản phẩm cho kiện hàng.' }));
      return;
    }

    const weightKg = Number(shipmentDraft.weightKg) || 0;
    if (shipmentDraft.method === 'jp' && weightKg <= 0) {
      setShipmentDraft(prev => ({ ...prev, error: 'Vui lòng nhập cân nặng kiện hàng.' }));
      return;
    }

    const feeJpy = shipmentDraft.method === 'jp' ? Math.round(weightKg * 900) : 0;
    const exchangeRate = Number(settings.exchangeRate) || 0;
    const feeVnd = shipmentDraft.method === 'jp'
      ? Math.round(feeJpy * exchangeRate)
      : Number(shipmentDraft.feeVnd) || 0;

    const newShipment = {
      id: Date.now().toString(),
      items: selectedItems,
      warehouse: shipmentDraft.warehouse,
      method: shipmentDraft.method,
      weightKg,
      feeJpy,
      feeVnd,
      comment: shipmentDraft.comment?.trim() || '',
      status: 'in_transit',
      createdAt: new Date().toISOString(),
    };

    setInboundShipments(prev => [newShipment, ...prev]);
    setProducts((prev) => prev.map(item => {
      const selected = selectedItems.find(selectedItem => selectedItem.productId === item.id);
      if (!selected) return item;
      const nextPending = Math.max(0, (Number(item.purchasePending) || 0) - selected.quantity);
      return { ...item, purchasePending: nextPending };
    }));

    setShipmentModalOpen(false);
    resetShipmentDraft();
    setView('list');
  };

  const handleReceiveShipment = (shipmentId) => {
    const shipment = inboundShipments.find(item => item.id === shipmentId);
    if (!shipment || shipment.status === 'received') return;
    setConfirmModal({
      title: 'Nhập kho kiện hàng?',
      message: `Xác nhận nhập kho ${getWarehouseLabel(shipment.warehouse)} cho kiện #${shipment.id.slice(-4)}?`,
      confirmLabel: 'Nhập kho',
      tone: 'rose',
      onConfirm: () => {
        setInboundShipments(prev => prev.map(item => (
          item.id === shipmentId
            ? { ...item, status: 'received', receivedAt: new Date().toISOString() }
            : item
        )));
        setProducts(prev => prev.map(product => {
          const shippedItem = shipment.items.find(item => item.productId === product.id);
          if (!shippedItem) return product;
          const currentStock = normalizeWarehouseStock(product);
          const nextStock = {
            ...currentStock,
            [shipment.warehouse]: currentStock[shipment.warehouse] + shippedItem.quantity,
          };
          return {
            ...product,
            stockByWarehouse: nextStock,
            stock: nextStock.daLat + nextStock.vinhPhuc,
          };
        }));
      },
    });
  };

  return {
    view,
    shipmentModalOpen,
    setShipmentModalOpen,
    confirmModal,
    setConfirmModal,
    shipmentDraft,
    setShipmentDraft,
    pendingPurchases,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    handleStartCreate,
    handleExitCreate,
    handleShipmentItemChange,
    adjustQuantity,
    handleShipmentFieldChange,
    handleOpenShipmentModal,
    handleShipmentSave,
    handleReceiveShipment,
  };
};

export default useInboundLogic;
