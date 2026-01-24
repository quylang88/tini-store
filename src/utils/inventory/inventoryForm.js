import { getLatestCost } from "./purchaseUtils.js";

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
  warehouse: "vinhPhuc",
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
  const lotCostValue = Number(lot.cost) || 0;
  const lotCostJpy = Number(lot.costJpy) || 0;
  // Nếu lô nhập bằng Yên thì nội suy lại giá Yên từ giá VNĐ để hiển thị cho user chỉnh sửa.
  // Ưu tiên dùng giá Yên đã lưu (costJpy), nếu không có (data cũ) thì mới tính ngược.
  const costJPYValue =
    lotCostJpy > 0
      ? lotCostJpy
      : inferredShippingMethod === "jp" && exchangeRateValue > 0
        ? Math.round(lotCostValue / exchangeRateValue)
        : "";

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
    warehouse: lot.warehouse || "vinhPhuc",
    shippingMethod: inferredShippingMethod,
    shippingWeightKg: lot.shipping?.weightKg || "",
    shippingFeeVnd: lot.shipping?.feeVnd || "",
    shippingFeeVndInput:
      inferredShippingMethod === "vn" ? lot.shipping?.feeVnd || "" : "", // Populate shipping fee input
    image: product.image || "",
  };
};
