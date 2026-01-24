import { getLatestCost } from "./purchaseUtils.js";
import { getDefaultWarehouse } from "./warehouseUtils.js";

const buildBaseFormData = (settings) => ({
  name: "",
  barcode: "",
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
});

export const createFormDataForNewProduct = ({ settings, activeCategory }) => ({
  ...buildBaseFormData(settings),
  category:
    activeCategory && activeCategory !== "Tất cả" ? activeCategory : "Chung",
});

export const createFormDataForProduct = ({ product, settings }) => ({
  ...buildBaseFormData(settings),
  name: product.name,
  barcode: product.barcode || "",
  category: product.category || "Chung",
  costCurrency: "VND",
  costJPY: "",
  cost: getLatestCost(product) || "",
  costVNDInput: getLatestCost(product) || "",
  price: product.price,
  shippingMethod: "vn",
  shippingFeeVnd: "",
  shippingFeeVndInput: "",
  image: product.image || "",
});

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
    barcode: product.barcode || "",
    category: product.category || "Chung",
    costCurrency: inferredShippingMethod === "jp" ? "JPY" : "VND",
    costJPY: costJPYValue === "" ? "" : String(costJPYValue),
    exchangeRate: String(exchangeRateValue || settings.exchangeRate),
    cost: lot.cost || "",
    costVNDInput: inferredShippingMethod === "vn" ? lot.cost || "" : "", // Populate VND input if VN
    price: lot.priceAtPurchase ?? product.price,
    quantity: lot.quantity || "",
    warehouse: lot.warehouse || getDefaultWarehouse().key,
    shippingMethod: inferredShippingMethod,
    shippingWeightKg: lot.shipping?.weightKg || "",
    shippingFeeVnd: lot.shipping?.feeVnd || "",
    shippingFeeVndInput:
      inferredShippingMethod === "vn" ? lot.shipping?.feeVnd || "" : "", // Populate shipping fee input
    image: product.image || "",
  };
};
