import { describe, expect, it } from "vitest";
import {
  buildUsageInstructionsExportData,
  getOrderUsageInstructionItems,
} from "./usageInstructionsExport";

describe("order usage instruction export selection", () => {
  const products = [
    {
      id: "p1",
      name: "Vitamin C",
      image: "data:image/png;base64,a",
      usageInstructions: "  • Liều mỗi lần: 1 viên  ",
    },
    {
      id: "p2",
      name: "Áo khoác",
      usageInstructions: null,
    },
  ];

  it("keeps only order products with non-empty instructions", () => {
    expect(
      getOrderUsageInstructionItems(
        {
          items: [
            { productId: "p1", quantity: 1 },
            { productId: "p2", quantity: 1 },
          ],
        },
        products,
      ),
    ).toEqual([
      {
        key: "p1",
        productId: "p1",
        name: "Vitamin C",
        image: "data:image/png;base64,a",
        usageInstructions: "• Liều mỗi lần: 1 viên",
      },
    ]);
  });

  it("emits each eligible product once when an order repeats it", () => {
    expect(
      getOrderUsageInstructionItems(
        {
          items: [
            { productId: "p1", quantity: 1 },
            { productId: "p1", quantity: 2 },
          ],
        },
        products,
      ),
    ).toHaveLength(1);
  });

  it("builds a local-date filename without an order identifier", () => {
    const result = buildUsageInstructionsExportData(
      {
        id: "order-secret",
        orderNumber: "0123",
        items: [{ productId: "p1", quantity: 1 }],
      },
      products,
      new Date(2026, 6, 27, 10, 30),
    );

    expect(result.fileName).toBe("Phieu_HDSD_2026-07-27.pdf");
    expect(result.dateDisplay).toBe("27/07/2026");
    expect(JSON.stringify(result)).not.toContain("order-secret");
    expect(JSON.stringify(result)).not.toContain("0123");
  });

  it("returns null when no ordered product has instructions", () => {
    expect(
      buildUsageInstructionsExportData(
        { items: [{ productId: "p2", quantity: 1 }] },
        products,
      ),
    ).toBeNull();
  });
});
