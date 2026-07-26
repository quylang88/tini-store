import { describe, expect, it } from "vitest";
import { normalizeMigratedProducts } from "./storageService";

describe("legacy product migration", () => {
  it("persists missing and blank usage instructions as null", () => {
    const products = [
      { id: "p1", name: "Cũ" },
      { id: "p2", name: "Trống", usageInstructions: "   " },
      { id: "p3", name: "Có sẵn", usageInstructions: "  Sau ăn  " },
    ];

    expect(normalizeMigratedProducts(products)).toEqual([
      { id: "p1", name: "Cũ", usageInstructions: null },
      { id: "p2", name: "Trống", usageInstructions: null },
      { id: "p3", name: "Có sẵn", usageInstructions: "Sau ăn" },
    ]);
  });

  it("returns non-array migration payloads unchanged", () => {
    expect(normalizeMigratedProducts(null)).toBeNull();
    expect(normalizeMigratedProducts({ products: [] })).toEqual({
      products: [],
    });
  });
});
