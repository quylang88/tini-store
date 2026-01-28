import { useCallback } from "react";
import { addPurchaseLot } from "../../utils/inventory/purchaseUtils";
import { syncProductsStock } from "../../utils/orders/orderStock";
import {
  getDefaultWarehouse,
  resolveWarehouseKey,
  getWarehouses,
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
        customer_name,
        customer_address,
      } = args;

      if (!product_name || !quantity) {
        return {
          success: false,
          message: "Thiếu thông tin sản phẩm hoặc số lượng.",
        };
      }

      // -- VALIDATION: Check số lượng hợp lệ --
      const qty = Number(quantity);
      if (isNaN(qty)) {
        return {
          success: false,
          message: `Misa không hiểu số lượng "${quantity}" là bao nhiêu. Mẹ kiểm tra lại giúp con nhé!`,
        };
      }

      // -- VALIDATION: Check các trường số khác (nếu có) --
      // Chỉ cảnh báo nhẹ hoặc dùng 0, nhưng nếu AI truyền chuỗi rác ("bao nhiêu") vào giá thì nên báo lỗi.
      const parseNumberOrNull = (val) => {
        if (val === undefined || val === null || val === "") return null;
        const n = Number(val);
        return isNaN(n) ? null : n;
      };

      const validCost = parseNumberOrNull(cost_price);
      const validSelling = parseNumberOrNull(selling_price);

      if (cost_price && validCost === null) {
        return {
          success: false,
          message: `Giá nhập "${cost_price}" không phải là số hợp lệ.`,
        };
      }
      if (selling_price && validSelling === null) {
        return {
          success: false,
          message: `Giá bán "${selling_price}" không phải là số hợp lệ.`,
        };
      }

      const targetWarehouse =
        resolveWarehouseKey(warehouse_key) || getDefaultWarehouse().key;

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
        let finalShipping = null;
        const feeInput = parseNumberOrNull(shipping_fee);
        if (feeInput !== null) {
          finalShipping = { feeVnd: feeInput };
        }

        // Logic tự động tính cước nếu là hàng Nhật (JPY) và có cân nặng
        if (cost_currency === "JPY" && shipping_weight) {
          const weight = parseNumberOrNull(shipping_weight) || 0;
          if (weight > 0) {
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
        }

        const lotData = {
          quantity: qty,
          cost: validCost || 0,
          costJpy: cost_currency === "JPY" ? validCost || 0 : 0,
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
            price: validSelling || 0,
            cost: validCost || 0,
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
          if (validSelling !== null) {
            updatedProduct.price = validSelling;
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
          price: validSelling !== null ? validSelling : product.price || 0,
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

        // Logic xác định Customer Name mặc định (Mẹ Hương/Mẹ Nguyệt theo kho)
        let finalCustomerName = customer_name;
        let finalCustomerAddress = customer_address;

        if (!finalCustomerName) {
          const warehouseConfig = getWarehouses().find(
            (w) => w.key === targetWarehouse,
          );
          finalCustomerName = warehouseConfig?.defaultCustomerName || null;
        }

        // Tạo đơn hàng
        const newOrder = {
          id: Date.now().toString(),
          orderNumber: `AI-${Math.floor(Math.random() * 10000)}`,
          status: "pending", // Unpaid
          orderType: "delivery",
          customerName: finalCustomerName, // Có thể null -> getOrderDisplayName sẽ hiển thị "Gửi khách" hoặc logic khác
          customerAddress: finalCustomerAddress,
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
