import { describe, expect, it } from "vitest";
import { createFormDataForLot } from "./inventoryForm";
import { buildNextProductFromForm } from "./inventorySaveUtils";

describe("usage instruction inventory preservation", () => {
  it("copies product instructions into a purchase-lot form", () => {
    const form = createFormDataForLot({
      product: {
        id: "p1",
        name: "Vitamin C",
        price: 100,
        usageInstructions: "• Liều mỗi lần: 1 viên",
      },
      lot: {
        id: "l1",
        cost: 50,
        quantity: 1,
        warehouse: "vinhPhuc",
        shipping: { method: "vn", feeVnd: 0 },
      },
      settings: { exchangeRate: 170 },
    });

    expect(form.usageInstructions).toBe("• Liều mỗi lần: 1 viên");
  });

  it("normalizes a blank instruction to null when saving a product", () => {
    const next = buildNextProductFromForm({
      formData: {
        name: "Vitamin C",
        category: "Thực phẩm",
        price: 100,
        cost: 0,
        quantity: 0,
        warehouse: "vinhPhuc",
        shippingMethod: "vn",
        usageInstructions: "   ",
      },
      editingProduct: {
        id: "p1",
        purchaseLots: [],
        stockByWarehouse: { vinhPhuc: 0, lamDong: 0 },
      },
      editingLotId: null,
      settings: { exchangeRate: 170 },
    });

    expect(next.usageInstructions).toBeNull();
  });
});
