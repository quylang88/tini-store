/**
 * toolsDefinitions.js
 * Định nghĩa các công cụ (Function Calling) mà AI có thể sử dụng.
 * Theo chuẩn OpenAI/Groq Tool Use.
 */

export const INVENTORY_TOOLS = [
  {
    type: "function",
    function: {
      name: "inventory_action",
      description:
        "Thực hiện hành động NHẬP KHO (import) hoặc XUẤT KHO/TẠO ĐƠN (export).",
      parameters: {
        type: "object",
        properties: {
          action_type: {
            type: "string",
            enum: ["import", "export"],
            description:
              "Loại hành động: 'import' (nhập hàng mới/restock) hoặc 'export' (xuất kho/bán hàng).",
          },
          product_name: {
            type: "string",
            description:
              "Tên sản phẩm. AI cần tìm tên gần đúng nhất trong danh sách sản phẩm.",
          },
          quantity: {
            type: "number",
            description: "Số lượng sản phẩm.",
          },
          warehouse_key: {
            type: "string",
            description:
              "Mã kho hàng (nếu có). Ví dụ: 'hcm' (Kho HCM), 'lam_dong' (Kho Lâm Đồng), 'japan' (Kho Nhật).",
          },
          cost_price: {
            type: "number",
            description:
              "(Chỉ Import) Giá vốn/Giá nhập của lô hàng này (nguyên tệ).",
          },
          cost_currency: {
            type: "string",
            enum: ["VND", "JPY"],
            description:
              "(Chỉ Import) Loại tiền tệ của giá nhập. Mặc định là VND.",
          },
          shipping_fee: {
            type: "number",
            description:
              "(Chỉ Import) Phí vận chuyển (VND) phân bổ cho lô hàng này (nếu có).",
          },
          selling_price: {
            type: "number",
            description:
              "Giá bán ra (với Export) hoặc Giá bán niêm yết mới (với Import). Đơn vị VND.",
          },
          note: {
            type: "string",
            description: "Ghi chú thêm cho đơn hàng hoặc phiếu nhập.",
          },
        },
        required: ["action_type", "product_name", "quantity"],
      },
    },
  },
];
