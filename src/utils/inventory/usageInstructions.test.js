import { describe, expect, it } from "vitest";
import {
  applyGeneratedUsageInstructions,
  hasUsageInstructions,
  normalizeProductUsageInstructions,
  normalizeUsageInstructions,
} from "./usageInstructions";

describe("usage instruction normalization", () => {
  it("normalizes missing and blank values to null", () => {
    expect(normalizeUsageInstructions(undefined)).toBeNull();
    expect(normalizeUsageInstructions(null)).toBeNull();
    expect(normalizeUsageInstructions("   ")).toBeNull();
  });

  it("trims and preserves non-empty text", () => {
    expect(normalizeUsageInstructions("  • Liều: 1 viên  ")).toBe(
      "• Liều: 1 viên",
    );
    expect(hasUsageInstructions(" • Liều: 1 viên ")).toBe(true);
    expect(hasUsageInstructions("  ")).toBe(false);
  });

  it("adds the nullable property to legacy products", () => {
    expect(normalizeProductUsageInstructions({ id: "p1" })).toEqual({
      id: "p1",
      usageInstructions: null,
    });
  });

  it("preserves the product reference when the value is already normalized", () => {
    const product = { id: "p1", usageInstructions: "• Liều: 1 viên" };

    expect(normalizeProductUsageInstructions(product)).toBe(product);
  });
});

describe("generated usage instruction updates", () => {
  const generatedUpdate = {
    productId: "p1",
    name: "Vitamin C",
    category: "Thực phẩm",
    usageInstructions: "• Liều mỗi lần: 1 viên",
  };

  it("applies a generated value only to the matching empty product", () => {
    const product = {
      id: "p1",
      name: "Vitamin C",
      category: "Thực phẩm",
      usageInstructions: null,
    };

    expect(
      applyGeneratedUsageInstructions(product, generatedUpdate),
    ).toEqual({
      ...product,
      usageInstructions: "• Liều mỗi lần: 1 viên",
    });
  });

  it("does not overwrite manual instructions", () => {
    const product = {
      id: "p1",
      name: "Vitamin C",
      category: "Thực phẩm",
      usageInstructions: "Nội dung thủ công",
    };

    expect(
      applyGeneratedUsageInstructions(product, generatedUpdate),
    ).toBe(product);
  });

  it("ignores stale identity results", () => {
    const product = {
      id: "p1",
      name: "Vitamin C phiên bản mới",
      category: "Thực phẩm",
      usageInstructions: null,
    };

    expect(
      applyGeneratedUsageInstructions(product, generatedUpdate),
    ).toBe(product);
  });
});
