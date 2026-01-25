import { useCallback } from "react";
import { addPurchaseLot } from "../../utils/inventory/purchaseUtils";
import { syncProductsStock } from "../../utils/orders/orderStock";
import {
  getDefaultWarehouse,
  resolveWarehouseKey,
} from "../../utils/inventory/warehouseUtils";

export const useToolExecution = ({
  products,
  setProducts,
  setOrders,
  settings,
}) => {
  const executeTool = useCallback(
    async (toolCallId, functionName, args) => {
      // Return format: { success: boolean, message: string }

      if (functionName !== "inventory_action") {
        return { success: false, message: `Unknown function: ${functionName}` };
      }

      const {
        action_type,
        product_name,
        quantity,
        warehouse_key,
        cost_price,
        cost_currency, // 'VND' | 'JPY'
        shipping_fee,
        shipping_weight, // Cân nặng (kg) nếu là hàng Nhật
        selling_price,
        note,
      } = args;

      if (!product_name || !quantity) {
        return {
          success: false,
          message: "Thiếu thông tin sản phẩm hoặc số lượng.",
        };
      }

      const targetWarehouse =
        resolveWarehouseKey(warehouse_key) || getDefaultWarehouse().key;
      const qty = Number(quantity);

      // 1. Tìm sản phẩm
      const normalizedName = product_name.trim().toLowerCase();

      // Ưu tiên tìm chính xác
      let product = products.find(
        (p) => p.name.trim().toLowerCase() === normalizedName,
      );

      // Nếu không thấy, tìm tương đối (contains)
      if (!product) {
        const candidates = products.filter((p) =>
          p.name.toLowerCase().includes(normalizedName),
        );
        if (candidates.length > 0) {
          // Lấy cái ngắn nhất (thường là match tốt nhất) để tránh match nhầm
          // Ví dụ: "Áo" match "Áo thun", "Áo khoác".
          // Nhưng ở đây ta cứ lấy cái đầu tiên cho đơn giản hoặc cái có độ dài gần nhất.
          product = candidates.sort((a, b) => a.name.length - b.name.length)[0];
        }
      }

      // --- ACTION: IMPORT ---
      if (action_type === "import") {
        let updatedProduct = null;
        let isNewProduct = false;

        // Xử lý phí vận chuyển và cân nặng
        let finalShipping = shipping_fee
          ? { feeVnd: Number(shipping_fee) }
          : null;

        // Logic tự động tính cước nếu là hàng Nhật (JPY) và có cân nặng
        if (cost_currency === "JPY" && shipping_weight) {
          const weight = Number(shipping_weight);
          const rate = Number(settings?.exchangeRate) || 170; // Fallback 170 nếu chưa config
          const feeJpy = Math.round(weight * 900); // 900 JPY/kg (Hardcode theo rule shop)
          const feeVnd = Math.round(feeJpy * rate);

          finalShipping = {
            method: "jp",
            weightKg: weight,
            feeJpy,
            feeVnd,
            exchangeRate: rate,
          };
        }

        const lotData = {
          quantity: qty,
          cost: Number(cost_price) || 0,
          costJpy: cost_currency === "JPY" ? Number(cost_price) || 0 : 0,
          warehouse: targetWarehouse,
          shipping: finalShipping,
          createdAt: new Date().toISOString(),
        };

        if (!product) {
          // TẠO SẢN PHẨM MỚI
          isNewProduct = true;
          const newId = `SP-${Date.now()}`;
          const baseProduct = {
            id: newId,
            name: product_name, // Dùng tên user cung cấp
            price: Number(selling_price) || 0,
            cost: Number(cost_price) || 0,
            stock: 0,
            stockByWarehouse: {},
            purchaseLots: [],
            createdAt: new Date().toISOString(),
          };

          // Thêm lot vào sản phẩm mới
          // addPurchaseLot trả về product kèm purchaseLots đã update
          // Lưu ý: addPurchaseLot cũng set lại cost cho product
          updatedProduct = addPurchaseLot(baseProduct, {
            ...lotData,
            id: `${newId}-lot-init`,
            originalQuantity: qty,
          });
        } else {
          // RESTOCK SẢN PHẨM CŨ
          updatedProduct = addPurchaseLot(product, lotData);
          if (selling_price) {
            updatedProduct.price = Number(selling_price);
          }
        }

        // Cập nhật Stock Summary (vì addPurchaseLot chỉ push mảng lots)
        const currentStockVal =
          updatedProduct.stockByWarehouse?.[targetWarehouse] || 0;
        updatedProduct.stockByWarehouse = {
          ...(updatedProduct.stockByWarehouse || {}),
          [targetWarehouse]: currentStockVal + qty,
        };
        updatedProduct.stock = (updatedProduct.stock || 0) + qty;

        // Lưu State
        if (isNewProduct) {
          setProducts((prev) => [...prev, updatedProduct]);
          return {
            success: true,
            message: `Đã tạo sản phẩm mới "${product_name}" và nhập ${qty} cái vào kho.`,
          };
        } else {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? updatedProduct : p)),
          );
          return {
            success: true,
            message: `Đã nhập thêm ${qty} "${product.name}" vào kho.`,
          };
        }
      }

      // --- ACTION: EXPORT ---
      if (action_type === "export") {
        if (!product) {
          return {
            success: false,
            message: `Không tìm thấy sản phẩm nào tên là "${product_name}" để xuất kho.`,
          };
        }

        // Tạo item ảo để chạy syncProductsStock
        const item = {
          productId: product.id,
          name: product.name,
          price: Number(selling_price) || product.price || 0,
          quantity: qty,
          // cost sẽ được syncProductsStock tự xử lý hoặc lấy từ snapshot?
          // syncProductsStock tính toán allocations.
        };

        // Chạy logic trừ kho (syncProductsStock trả về danh sách products mới)
        // Lưu ý: syncProductsStock mutate item để thêm lotAllocations
        const itemsToSync = [item];
        const nextProducts = syncProductsStock(
          products,
          itemsToSync,
          [], // previousItems rỗng -> trừ kho mới
          targetWarehouse,
        );

        setProducts(nextProducts);

        // Tạo đơn hàng
        const newOrder = {
          id: Date.now().toString(),
          orderNumber: `AI-${Math.floor(Math.random() * 10000)}`,
          status: "pending", // Unpaid
          orderType: "delivery",
          customerName: "Khách lẻ (Qua Misa)",
          customerAddress: "Tại quầy / Qua Chat",
          items: itemsToSync, // item đã có lotAllocations
          total: item.price * item.quantity,
          warehouse: targetWarehouse,
          date: new Date().toISOString(),
          note: note || "Đơn hàng tạo bởi Misa",
        };

        setOrders((prev) => [newOrder, ...prev]);

        return {
          success: true,
          message: `Đã tạo đơn hàng mới cho ${qty} ${product.name}. (Trạng thái: Chưa thanh toán)`,
        };
      }

      return { success: false, message: "Hành động không hợp lệ." };
    },
    [products, setProducts, setOrders, settings],
  );

  return { executeTool };
};
