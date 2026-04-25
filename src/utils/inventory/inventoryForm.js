import { getProductStats } from "./purchaseUtils.js";
import { getDefaultWarehouse } from "./warehouseUtils.js";

const buildBaseFormData = (settings) => ({
  name: "",
  productCode: "",
  category: "Chung",
  costCurrency: "JPY",
  costJPY: "",
  exchangeRate: String(settings.exchangeRate),
  cost: "",
  // Bổ sung các trường input riêng để giữ giá trị khi chuyển tab
  costVNDInput: "",
  price: "",
  quantity: "",
  warehouse: getDefaultWarehouse().key,
  shippingMethod: "jp",
  shippingWeightKg: "",
  shippingFeeVnd: "",
  // Bổ sung input cho phí gửi VNĐ
  shippingFeeVndInput: "",
  image: "",
  expiryDate: "",
});

export const createFormDataForNewProduct = ({ settings, activeCategory }) => ({
  ...buildBaseFormData(settings),
  category:
    activeCategory && activeCategory !== "Tất cả" ? activeCategory : "Chung",
});

export const createFormDataForProduct = ({ product, settings }) => {
  const { latestLot, isJpy, cost: currentCost } = getProductStats(product);

  const inferredShippingMethod = (() => {
    if (latestLot?.shipping?.method) {
      return latestLot.shipping.method;
    }
    const weightKg = Number(latestLot?.shipping?.weightKg || 0);
    const feeJpy = Number(latestLot?.shipping?.feeJpy || 0);
    if (weightKg > 0 || feeJpy > 0) {
      return "jp";
    }
    return isJpy ? "jp" : "vn";
  })();

  const exchangeRateValue =
    Number(latestLot?.shipping?.exchangeRate || settings.exchangeRate) || 0;

  return {
    ...buildBaseFormData(settings),
    name: product.name,
    productCode: product.productCode || "",
    category: product.category || "Chung",
    costCurrency: isJpy ? "JPY" : "VND",
    costJPY: isJpy ? String(latestLot?.costJpy || "") : "",
    exchangeRate: String(exchangeRateValue || settings.exchangeRate),
    cost: currentCost,
    costVNDInput: isJpy ? "" : currentCost,
    price: product.price,
    shippingMethod: inferredShippingMethod,
    shippingWeightKg: latestLot?.shipping?.weightKg || "",
    shippingFeeVnd: latestLot?.shipping?.feeVnd || "",
    shippingFeeVndInput:
      inferredShippingMethod === "vn" ? latestLot?.shipping?.feeVnd || "" : "",
    image: product.image || "",
    expiryDate: product.expiryDate || "",
  };
};

export const createFormDataForLot = ({ product, lot, settings }) => {
  const inferredShippingMethod = (() => {
    if (lot.shipping?.method) {
      return lot.shipping.method;
    }
    const weightKg = Number(lot.shipping?.weightKg || 0);
    const feeJpy = Number(lot.shipping?.feeJpy || 0);
    if (weightKg > 0 || feeJpy > 0) {
      return "jp";
    }
    return "vn";
  })();
  const exchangeRateValue =
    Number(lot.shipping?.exchangeRate || settings.exchangeRate) || 0;
  const lotCostJpy = Number(lot.costJpy) || 0;
  const costJPYValue = lotCostJpy > 0 ? lotCostJpy : "";

  return {
    ...buildBaseFormData(settings),
    name: product.name,
    productCode: product.productCode || "",
    category: product.category || "Chung",
    costCurrency: inferredShippingMethod === "jp" ? "JPY" : "VND",
    costJPY: costJPYValue === "" ? "" : String(costJPYValue),
    exchangeRate: String(exchangeRateValue || settings.exchangeRate),
    cost: lot.cost || "",
    costVNDInput: inferredShippingMethod === "vn" ? lot.cost || "" : "", // Điền input VNĐ nếu là VN
    price: lot.priceAtPurchase ?? product.price,
    quantity: lot.quantity || "",
    warehouse: lot.warehouse || getDefaultWarehouse().key,
    shippingMethod: inferredShippingMethod,
    shippingWeightKg: lot.shipping?.weightKg || "",
    shippingFeeVnd: lot.shipping?.feeVnd || "",
    shippingFeeVndInput:
      inferredShippingMethod === "vn" ? lot.shipping?.feeVnd || "" : "", // Điền input phí gửi
    image: product.image || "",
    expiryDate: lot.expiryDate || "",
  };
};
