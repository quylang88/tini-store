import { normalizeString } from "../formatters/formatUtils";
import { normalizeWarehouseStock } from "./warehouseUtils";
import {
  addPurchaseLot,
  getLatestCost,
  normalizePurchaseLots,
} from "./purchaseUtils";

// Helper tính toán chi phí nhập hàng để tái sử dụng
export const calculateImportCosts = ({ formData, settings }) => {
  const shippingWeight = Number(formData.shippingWeightKg) || 0;
  const exchangeRateValue =
    Number(formData.exchangeRate || settings.exchangeRate) || 0;
  const feeJpy =
    formData.shippingMethod === "jp" ? Math.round(shippingWeight * 900) : 0;
  const feeVnd =
    formData.shippingMethod === "jp"
      ? Math.round(feeJpy * exchangeRateValue)
      : Number(formData.shippingFeeVnd) || 0;

  return {
    shippingWeight,
    exchangeRateValue,
    feeJpy,
    feeVnd,
  };
};

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

  // Check trùng tên sản phẩm (không tính sản phẩm đang sửa)
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

  // Check trùng Barcode
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
  const quantityValue = Number(formData.quantity) || 0;
  const warehouseKey = formData.warehouse || "daLat";

  const { shippingWeight, exchangeRateValue, feeJpy, feeVnd } =
    calculateImportCosts({ formData, settings });

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
    barcode: formData.barcode ? formData.barcode.trim() : "",
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
          return {
            ...lot,
            cost: costValue,
            quantity: quantityValue,
            warehouse: warehouseKey,
            shipping: {
              ...shippingInfo,
              perUnitVnd: feeVnd,
            },
            priceAtPurchase: updatedPrice,
          };
        }

        // Cập nhật giá bán mới cho tất cả các lô khác luôn
        return {
          ...lot,
          priceAtPurchase: updatedPrice,
        };
      });
      const adjustedStock = nextLots.reduce(
        (acc, lot) => {
          const nextWarehouse = lot.warehouse || "daLat";
          const lotQty = Number(lot.quantity) || 0;
          return {
            ...acc,
            [nextWarehouse]: (acc[nextWarehouse] || 0) + lotQty,
          };
        },
        { daLat: 0, vinhPhuc: 0 },
      );
      nextProduct = {
        ...nextProduct,
        purchaseLots: nextLots,
        stockByWarehouse: adjustedStock,
        stock: adjustedStock.daLat + adjustedStock.vinhPhuc,
        cost: getLatestCost({ ...nextProduct, purchaseLots: nextLots }),
      };
    } else {
      nextProduct = addPurchaseLot(nextProduct, {
        cost: costValue,
        quantity: quantityValue,
        warehouse: warehouseKey,
        shipping: shippingInfo,
        priceAtPurchase: Number(formData.price) || 0,
      });
    }
  }

  return nextProduct;
};
