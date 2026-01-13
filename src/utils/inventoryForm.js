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
  const shippingMethod = lot.shipping?.method || 'jp';

  return {
    ...buildBaseFormData(settings),
    name: product.name,
    barcode: product.barcode || '',
    category: product.category || 'Chung',
    costCurrency: shippingMethod === 'jp' ? 'JPY' : 'VND',
    costJPY: '',
    exchangeRate: String(lot.shipping?.exchangeRate || settings.exchangeRate),
    cost: lot.cost || '',
    price: lot.priceAtPurchase ?? product.price,
    quantity: lot.quantity || '',
    warehouse: lot.warehouse || 'vinhPhuc',
    shippingMethod,
    shippingWeightKg: lot.shipping?.weightKg || '',
    shippingFeeVnd: lot.shipping?.feeVnd || '',
    image: product.image || '',
  };
};
