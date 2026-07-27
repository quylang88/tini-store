import { describe, expect, it } from "vitest";
import { normalizeMigratedProducts } from "./storageService";

describe("legacy product migration", () => {
  it("normalizes usage instructions and replaces every legacy product code", () => {
    const products = [
      { id: "p1", name: "Cũ", category: "Chung", productCode: "OLD-1" },
      {
        id: "p2",
        name: "Trống",
        category: "Chung",
        productCode: "OLD-2",
        usageInstructions: "   ",
      },
      {
        id: "p3",
        name: "Có sẵn",
        category: "Chung",
        productCode: "OLD-3",
        usageInstructions: "  Sau ăn  ",
      },
    ];

    const migrated = normalizeMigratedProducts(products);

    expect(migrated.map((product) => product.usageInstructions)).toEqual([
      null,
      null,
      "Sau ăn",
    ]);
    expect(migrated.map((product) => product.productCode)).not.toEqual([
      "OLD-1",
      "OLD-2",
      "OLD-3",
    ]);
    expect(
      migrated.every((product) =>
        /^CH-[A-Z]{3}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(
          product.productCode,
        ),
      ),
    ).toBe(true);
  });

  it("returns non-array migration payloads unchanged", () => {
    expect(normalizeMigratedProducts(null)).toBeNull();
    expect(normalizeMigratedProducts({ products: [] })).toEqual({
      products: [],
    });
  });
});
