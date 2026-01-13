import { getLatestCost } from './purchaseUtils';

const buildBaseFormData = (settings) => ({
  name: '',
  barcode: '',
  category: 'Chung',
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

export const createFormDataForNewProduct = ({ settings, activeCategories }) => ({
  ...buildBaseFormData(settings),
  category: activeCategories.length === 1 ? activeCategories[0] : 'Chung',
});

export const createFormDataForProduct = ({ product, settings }) => ({
  ...buildBaseFormData(settings),
  name: product.name,
  barcode: product.barcode || '',
  category: product.category || 'Chung',
  costCurrency: 'VND',
  costJPY: '',
  cost: getLatestCost(product) || '',
  price: product.price,
  shippingMethod: 'vn',
  image: product.image || '',
});

export const createFormDataForLot = ({ product, lot, settings }) => {
  const inferredShippingMethod = (() => {
    if (lot.shipping?.method) {
      return lot.shipping.method;
    }
    const weightKg = Number(lot.shipping?.weightKg || 0);
    const feeJpy = Number(lot.shipping?.feeJpy || 0);
    if (weightKg > 0 || feeJpy > 0) {
      return 'jp';
    }
    return 'vn';
  })();
  const exchangeRateValue = Number(lot.shipping?.exchangeRate || settings.exchangeRate) || 0;
  const lotCostValue = Number(lot.cost) || 0;
  // Nếu lô nhập bằng Yên thì nội suy lại giá Yên từ giá VNĐ để hiển thị cho user chỉnh sửa.
  const costJPYValue = inferredShippingMethod === 'jp' && exchangeRateValue > 0
    ? Math.round(lotCostValue / exchangeRateValue)
    : '';

  return {
    ...buildBaseFormData(settings),
    name: product.name,
    barcode: product.barcode || '',
    category: product.category || 'Chung',
    costCurrency: inferredShippingMethod === 'jp' ? 'JPY' : 'VND',
    costJPY: costJPYValue === '' ? '' : String(costJPYValue),
    exchangeRate: String(exchangeRateValue || settings.exchangeRate),
    cost: lot.cost || '',
    price: lot.priceAtPurchase ?? product.price,
    quantity: lot.quantity || '',
    warehouse: lot.warehouse || 'vinhPhuc',
    shippingMethod: inferredShippingMethod,
    shippingWeightKg: lot.shipping?.weightKg || '',
    shippingFeeVnd: lot.shipping?.feeVnd || '',
    image: product.image || '',
  };
};
