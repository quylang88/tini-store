import { normalizeString } from "../formatters/formatUtils.js";
import {
  normalizeWarehouseStock,
  getAllWarehouseKeys,
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "./warehouseUtils.js";
import {
  addPurchaseLot,
  getProductStats,
  normalizePurchaseLots,
} from "./purchaseUtils.js";

// Gom validation vào 1 chỗ để dễ test và dễ review.
export const getInventoryValidationError = ({
  formData,
  products,
  editingProduct,
  editingLotId,
}) => {
  if (!formData.name || !formData.price) {
    const missing = [];
    if (!formData.name) missing.push("name");
    if (!formData.price) missing.push("price");
    return {
      title: "Thiếu thông tin",
      message: "Vui lòng nhập Tên sản phẩm và Giá bán trước khi lưu.",
      missingFields: missing,
    };
  }

  // Kiểm tra trùng tên sản phẩm (không tính sản phẩm đang sửa)
  const duplicateName = products.find(
    (product) =>
      normalizeString(product.name) === normalizeString(formData.name) &&
      (!editingProduct || product.id !== editingProduct.id),
  );

  if (duplicateName) {
    return {
      title: "Sản phẩm đã tồn tại",
      message: editingProduct
        ? "Tên sản phẩm này đã được sử dụng bởi một sản phẩm khác."
        : "Vui lòng chọn sản phẩm trong gợi ý để nhập thêm hàng.",
    };
  }

  const costValue = Number(formData.cost) || 0;
  const priceValue = Number(formData.price) || 0;
  if (costValue > 0 && priceValue <= costValue) {
    return {
      title: "Giá bán chưa hợp lệ",
      message: "Giá bán phải cao hơn giá vốn để đảm bảo có lợi nhuận.",
    };
  }

  // Kiểm tra trùng Barcode
  if (formData.barcode) {
    const duplicateBarcode = products.find(
      (p) =>
        p.barcode === formData.barcode &&
        p.id !== (editingProduct ? editingProduct.id : null),
    );
    if (duplicateBarcode) {
      return {
        title: "Mã vạch bị trùng",
        message: `Mã vạch này đã được dùng cho "${duplicateBarcode.name}". Vui lòng kiểm tra lại.`,
      };
    }
  }

  const quantityValue = Number(formData.quantity) || 0;
  if (!editingProduct && quantityValue <= 0) {
    return {
      title: "Thiếu số lượng nhập",
      message: "Sản phẩm mới cần có số lượng nhập kho ban đầu.",
      missingFields: ["quantity"],
    };
  }

  if (editingLotId && quantityValue <= 0) {
    return {
      title: "Thiếu số lượng",
      message: "Vui lòng nhập số lượng cho lần nhập hàng này.",
      missingFields: ["quantity"],
    };
  }

  if (quantityValue > 0 && costValue <= 0) {
    return {
      title: "Thiếu giá nhập",
      message: "Vui lòng nhập giá nhập khi có số lượng nhập kho.",
      missingFields: ["costJPY", "costVNDInput"],
    };
  }

  const shippingWeight = Number(formData.shippingWeightKg) || 0;
  if (
    quantityValue > 0 &&
    formData.shippingMethod === "jp" &&
    shippingWeight <= 0
  ) {
    return {
      title: "Thiếu cân nặng",
      message: "Vui lòng nhập cân nặng nếu mua tại Nhật.",
      missingFields: ["shippingWeightKg"],
    };
  }

  return null;
};

// Tách logic build dữ liệu sản phẩm để tránh hook chính quá dài.
export const buildNextProductFromForm = ({
  formData,
  editingProduct,
  editingLotId,
  settings,
}) => {
  const costValue = Number(formData.cost) || 0;
  const costJpyValue =
    formData.costCurrency === "JPY" ? Number(formData.costJPY) || 0 : 0;
  const quantityValue = Number(formData.quantity) || 0;
  const defaultWarehouseKey = getDefaultWarehouse().key;
  const warehouseKey = formData.warehouse || defaultWarehouseKey;

  const shippingWeight = Number(formData.shippingWeightKg) || 0;
  const exchangeRateValue =
    Number(formData.exchangeRate || settings.exchangeRate) || 0;
  const feeJpy =
    formData.shippingMethod === "jp" ? Math.round(shippingWeight * 900) : 0;
  const feeVnd =
    formData.shippingMethod === "jp"
      ? Math.round(feeJpy * exchangeRateValue)
      : Number(formData.shippingFeeVnd) || 0;

  const allKeys = getAllWarehouseKeys();
  const initialStock = {};
  allKeys.forEach((key) => {
    initialStock[key] = 0;
  });

  const baseProduct = editingProduct
    ? normalizePurchaseLots(editingProduct)
    : {
        id: Date.now().toString(),
        purchaseLots: [],
        stockByWarehouse: { ...initialStock },
        stock: 0,
      };

  const existingStock = normalizeWarehouseStock(baseProduct);
  const resolvedWarehouseKey = resolveWarehouseKey(warehouseKey);

  const nextStockByWarehouse = {
    ...existingStock,
    [resolvedWarehouseKey]:
      (existingStock[resolvedWarehouseKey] || 0) + quantityValue,
  };

  let nextProduct = {
    ...baseProduct,
    name: formData.name.trim(),
    barcode: formData.barcode ? formData.barcode.trim() : "",
    category: formData.category,
    price: Number(formData.price),
    cost: costValue || getProductStats(baseProduct).cost,
    image: formData.image,
    stockByWarehouse: nextStockByWarehouse,
    stock: Object.values(nextStockByWarehouse).reduce(
      (sum, val) => sum + val,
      0,
    ),
  };

  // Lưu lại từng lần nhập hàng thành "lô giá nhập" để quản lý tồn kho theo giá.
  if (quantityValue > 0) {
    const shippingInfo = {
      method: formData.shippingMethod,
      weightKg: formData.shippingMethod === "jp" ? shippingWeight : 0,
      feeJpy,
      feeVnd,
      exchangeRate: exchangeRateValue,
    };
    if (editingLotId) {
      // Sửa lại thông tin của lô đã nhập.
      const nextLots = nextProduct.purchaseLots.map((lot) => {
        const isCurrentLot = lot.id === editingLotId;
        const updatedPrice = Number(formData.price) || 0;

        if (isCurrentLot) {
          // Tính lại số lượng ban đầu dựa trên thay đổi của số lượng (còn lại)
          // quantityValue ở đây là "Tồn kho thực tế" do user nhập
          const oldRemaining = Number(lot.quantity) || 0;
          const newRemaining = quantityValue;
          const delta = newRemaining - oldRemaining;
          const oldOriginal = Number(lot.originalQuantity) || oldRemaining;
          const newOriginal = Math.max(newRemaining, oldOriginal + delta);

          return {
            ...lot,
            cost: costValue,
            costJpy: costJpyValue,
            quantity: newRemaining,
            originalQuantity: newOriginal,
            warehouse: resolvedWarehouseKey,
            shipping: {
              ...shippingInfo,
              perUnitVnd: feeVnd,
            },
            priceAtPurchase: updatedPrice,
            expiryDate: formData.expiryDate || "",
          };
        }

        // Cập nhật giá bán mới cho tất cả các lô khác luôn
        return {
          ...lot,
          priceAtPurchase: updatedPrice,
        };
      });

      // Tính toán lại tồn kho theo kho một cách động
      const adjustedStock = nextLots.reduce(
        (acc, lot) => {
          const nextWarehouse =
            resolveWarehouseKey(lot.warehouse) || defaultWarehouseKey;
          const lotQty = Number(lot.quantity) || 0;
          return {
            ...acc,
            [nextWarehouse]: (acc[nextWarehouse] || 0) + lotQty,
          };
        },
        { ...initialStock },
      );

      nextProduct = {
        ...nextProduct,
        purchaseLots: nextLots,
        stockByWarehouse: adjustedStock,
        stock: Object.values(adjustedStock).reduce((sum, val) => sum + val, 0),
        cost: getProductStats({ ...nextProduct, purchaseLots: nextLots }).cost,
      };
    } else {
      nextProduct = addPurchaseLot(nextProduct, {
        cost: costValue,
        costJpy: costJpyValue,
        quantity: quantityValue,
        warehouse: resolvedWarehouseKey,
        shipping: shippingInfo,
        priceAtPurchase: Number(formData.price) || 0,
        expiryDate: formData.expiryDate || "",
      });
    }
  }

  return nextProduct;
};
