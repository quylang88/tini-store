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
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [purchaseDraft, setPurchaseDraft] = useState({ productId: '', quantity: '' });
  const [shipmentDraft, setShipmentDraft] = useState({
    warehouse: DEFAULT_WAREHOUSE,
    method: 'vn',
    weightKg: '',
    feeVnd: '',
    items: {},
    error: '',
  });

  const productOptions = useMemo(
    () => products.map((product) => ({ id: product.id, name: product.name })),
    [products],
  );

  const pendingPurchases = useMemo(
    () => products
      .filter(item => (Number(item.purchasePending) || 0) > 0)
      .map(item => ({
        productId: item.id,
        name: item.name,
        quantity: Number(item.purchasePending) || 0,
      })),
    [products],
  );

  const resetPurchaseDraft = () => {
    setPurchaseDraft({ productId: '', quantity: '' });
  };

  const resetShipmentDraft = () => {
    setShipmentDraft({
      warehouse: DEFAULT_WAREHOUSE,
      method: 'vn',
      weightKg: '',
      feeVnd: '',
      items: {},
      error: '',
    });
  };

  const openPurchaseModal = () => {
    resetPurchaseDraft();
    setPurchaseModalOpen(true);
  };

  const openShipmentModal = () => {
    resetShipmentDraft();
    setShipmentModalOpen(true);
  };

  const handlePurchaseSave = () => {
    const quantityValue = Number(purchaseDraft.quantity);
    if (!purchaseDraft.productId || quantityValue <= 0) {
      setConfirmModal({
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn sản phẩm và nhập số lượng mua.',
        confirmLabel: 'Đã hiểu',
        tone: 'rose',
      });
      return;
    }
    const product = products.find(item => item.id === purchaseDraft.productId);
    if (!product) return;

    setProducts((prev) => prev.map(item => (
      item.id === purchaseDraft.productId
        ? { ...item, purchasePending: (Number(item.purchasePending) || 0) + quantityValue }
        : item
    )));
    setPurchaseModalOpen(false);
    resetPurchaseDraft();
  };

  const handlePurchaseRemove = (productId) => {
    const purchase = pendingPurchases.find(item => item.productId === productId);
    if (!purchase) return;
    setConfirmModal({
      title: 'Xoá hàng mua?',
      message: `Bạn có chắc muốn xoá "${purchase.name}" khỏi danh sách mua?`,
      confirmLabel: 'Xoá',
      tone: 'danger',
      onConfirm: () => {
        setProducts((prev) => prev.map(item => (
          item.id === productId
            ? { ...item, purchasePending: 0 }
            : item
        )));
      },
    });
  };

  const handleShipmentItemChange = (productId, value, maxQuantity) => {
    const nextValue = Math.max(0, Math.min(maxQuantity, Number(value) || 0));
    setShipmentDraft((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [productId]: nextValue,
      },
      error: '',
    }));
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

  const handleShipmentSave = () => {
    const selectedItems = pendingPurchases
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: Number(shipmentDraft.items[item.productId]) || 0,
      }))
      .filter(item => item.quantity > 0);

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
    activeTab,
    setActiveTab,
    purchaseModalOpen,
    setPurchaseModalOpen,
    shipmentModalOpen,
    setShipmentModalOpen,
    confirmModal,
    setConfirmModal,
    purchaseDraft,
    setPurchaseDraft,
    shipmentDraft,
    setShipmentDraft,
    productOptions,
    pendingPurchases,
    openPurchaseModal,
    openShipmentModal,
    handlePurchaseSave,
    handlePurchaseRemove,
    handleShipmentItemChange,
    handleShipmentFieldChange,
    handleShipmentSave,
    handleReceiveShipment,
  };
};

export default useInboundLogic;
