import { useEffect, useMemo, useState } from 'react';
import { sanitizeDecimalInput, sanitizeNumberInput } from '../utils/helpers';
import { normalizeWarehouseStock } from '../utils/warehouseUtils';
import { getLatestPurchaseCost, normalizePurchaseLots } from '../utils/purchaseUtils';

const DEFAULT_WAREHOUSE = 'daLat';

const emptyDraft = (settings) => ({
  productId: null,
  name: '',
  price: '',
  cost: '',
  quantity: '',
  warehouse: DEFAULT_WAREHOUSE,
  method: 'vn',
  weightKg: '',
  feeVnd: '',
  category: 'Chung',
  barcode: '',
  error: '',
  exchangeRate: Number(settings.exchangeRate) || 0,
});

const useInboundLogic = ({ products, setProducts, settings }) => {
  const [draft, setDraft] = useState(() => emptyDraft(settings));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      exchangeRate: Number(settings.exchangeRate) || 0,
    }));
  }, [settings.exchangeRate]);

  // Gợi ý sản phẩm theo tên để user chọn nhanh sản phẩm đã có.
  const suggestions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return [];
    return products.filter((product) => product.name.toLowerCase().includes(keyword));
  }, [products, searchTerm]);

  // Khi chọn sản phẩm đã tồn tại thì tự động đổ dữ liệu để user chỉnh sửa.
  const handleSelectProduct = (product) => {
    const purchaseLots = normalizePurchaseLots(product);
    setDraft((prev) => ({
      ...prev,
      productId: product.id,
      name: product.name,
      price: product.price ? String(product.price) : '',
      cost: getLatestPurchaseCost(purchaseLots) ? String(getLatestPurchaseCost(purchaseLots)) : '',
      category: product.category || 'Chung',
      barcode: product.barcode || '',
      warehouse: DEFAULT_WAREHOUSE,
      quantity: '',
      error: '',
    }));
    setSearchTerm(product.name);
  };

  const handleClearSelection = () => {
    setDraft((prev) => ({
      ...emptyDraft(settings),
      exchangeRate: prev.exchangeRate,
    }));
    setSearchTerm('');
  };

  const handleDraftChange = (field) => (value) => {
    if (field === 'weightKg') {
      setDraft((prev) => ({ ...prev, weightKg: sanitizeDecimalInput(value), error: '' }));
      return;
    }
    if (['cost', 'price', 'quantity', 'feeVnd'].includes(field)) {
      setDraft((prev) => ({ ...prev, [field]: sanitizeNumberInput(value), error: '' }));
      return;
    }
    setDraft((prev) => ({ ...prev, [field]: value, error: '' }));
  };

  const feeJpy = draft.method === 'jp'
    ? Math.round((Number(draft.weightKg) || 0) * 900)
    : 0;
  const feeVnd = draft.method === 'jp'
    ? Math.round(feeJpy * (Number(draft.exchangeRate) || 0))
    : Number(draft.feeVnd) || 0;

  // Lưu nhập hàng: tạo lô giá nhập mới và cập nhật tồn kho theo kho chọn.
  const handleSavePurchase = () => {
    if (!draft.name.trim()) {
      setDraft((prev) => ({ ...prev, error: 'Vui lòng nhập tên sản phẩm.' }));
      return;
    }
    const priceValue = Number(draft.price) || 0;
    const costValue = Number(draft.cost) || 0;
    const quantityValue = Number(draft.quantity) || 0;
    if (priceValue <= 0 || costValue <= 0 || quantityValue <= 0) {
      setDraft((prev) => ({ ...prev, error: 'Giá nhập, giá bán và tồn kho phải lớn hơn 0.' }));
      return;
    }

    if (draft.method === 'jp' && Number(draft.weightKg) <= 0) {
      setDraft((prev) => ({ ...prev, error: 'Vui lòng nhập cân nặng kiện hàng.' }));
      return;
    }

    const purchaseLot = {
      id: Date.now().toString(),
      cost: costValue,
      quantity: quantityValue,
      warehouse: draft.warehouse,
      createdAt: new Date().toISOString(),
      shipping: {
        method: draft.method,
        weightKg: Number(draft.weightKg) || 0,
        feeJpy,
        feeVnd,
      },
    };

    setProducts((prev) => {
      const existing = draft.productId
        ? prev.find((item) => item.id === draft.productId)
        : prev.find((item) => item.name.toLowerCase() === draft.name.trim().toLowerCase());
      if (existing) {
        const currentStock = normalizeWarehouseStock(existing);
        const nextStock = {
          ...currentStock,
          [draft.warehouse]: currentStock[draft.warehouse] + quantityValue,
        };
        const nextLots = [...normalizePurchaseLots(existing), purchaseLot];
        return prev.map((item) => (
          item.id === existing.id
            ? {
              ...item,
              name: draft.name.trim(),
              price: priceValue,
              category: draft.category || item.category || 'Chung',
              barcode: draft.barcode || item.barcode || '',
              purchaseLots: nextLots,
              stockByWarehouse: nextStock,
              stock: nextStock.daLat + nextStock.vinhPhuc,
            }
            : item
        ));
      }

      const initialStock = {
        daLat: draft.warehouse === 'daLat' ? quantityValue : 0,
        vinhPhuc: draft.warehouse === 'vinhPhuc' ? quantityValue : 0,
      };

      return [
        ...prev,
        {
          id: Date.now().toString(),
          name: draft.name.trim(),
          barcode: draft.barcode.trim(),
          category: draft.category || 'Chung',
          price: priceValue,
          purchaseLots: [purchaseLot],
          stockByWarehouse: initialStock,
          stock: initialStock.daLat + initialStock.vinhPhuc,
          image: '',
        },
      ];
    });

    setDraft(emptyDraft(settings));
    setSearchTerm('');
  };

  return {
    draft,
    setDraft,
    searchTerm,
    setSearchTerm,
    suggestions,
    feeJpy,
    feeVnd,
    handleSelectProduct,
    handleClearSelection,
    handleDraftChange,
    handleSavePurchase,
  };
};

export default useInboundLogic;
