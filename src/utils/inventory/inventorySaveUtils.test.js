import { describe, expect, it } from "vitest";
import { createFormDataForLot } from "./inventoryForm";
import { buildNextProductFromForm } from "./inventorySaveUtils";

describe("automatic product code creation", () => {
  it("assigns an automatic code when the inventory form creates a product", () => {
    const next = buildNextProductFromForm({
      formData: {
        name: "Sữa rửa mặt",
        category: "Mỹ phẩm",
        price: 100,
        cost: 0,
        quantity: 0,
        warehouse: "vinhPhuc",
        shippingMethod: "vn",
      },
      editingProduct: null,
      editingLotId: null,
      settings: { exchangeRate: 170 },
      usedProductCodes: new Set(),
    });

    expect(next.productCode).toMatch(
      /^MP-SRM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
    );
  });

  it("preserves the immutable code when editing an existing product", () => {
    const next = buildNextProductFromForm({
      formData: {
        name: "Sữa rửa mặt mới",
        productCode: "MANUAL-CODE",
        category: "Chăm sóc da",
        price: 120,
        cost: 0,
        quantity: 0,
        warehouse: "vinhPhuc",
        shippingMethod: "vn",
      },
      editingProduct: {
        id: "p1",
        productCode: "MP-SRM-A7K3",
        purchaseLots: [],
        stockByWarehouse: { vinhPhuc: 0, lamDong: 0 },
      },
      editingLotId: null,
      settings: { exchangeRate: 170 },
      usedProductCodes: new Set(["MP-SRM-A7K3"]),
    });

    expect(next.productCode).toBe("MP-SRM-A7K3");
  });
});

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
