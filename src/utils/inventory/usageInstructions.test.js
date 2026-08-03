import { describe, expect, it } from "vitest";
import {
  hasUsageInstructions,
  normalizeProductUsageInstructions,
  normalizeUsageInstructions,
} from "./usageInstructions";

describe("usage instruction normalization", () => {
  it("normalizes missing and blank values to null", () => {
    expect(normalizeUsageInstructions(undefined)).toBeNull();
    expect(normalizeUsageInstructions(null)).toBeNull();
    expect(normalizeUsageInstructions("   ")).toBeNull();
    expect(normalizeUsageInstructions("<p><br></p>")).toBeNull();
  });

  it("trims and preserves non-empty text and HTML", () => {
    expect(normalizeUsageInstructions("  • Liều: 1 viên  ")).toBe(
      "• Liều: 1 viên",
    );
    expect(
      normalizeUsageInstructions("<p><b>Liều dùng:</b> 1 viên/ngày</p>"),
    ).toBe("<p><b>Liều dùng:</b> 1 viên/ngày</p>");
    expect(hasUsageInstructions(" • Liều: 1 viên ")).toBe(true);
    expect(hasUsageInstructions("  ")).toBe(false);
    expect(hasUsageInstructions("<div></div>")).toBe(false);
  });

  it("stores Vietnamese HTML in canonical NFC form", () => {
    const decomposedHtml = "<p>Hu\u031Bo\u031B\u0301ng da\u0302\u0303n</p>";

    expect(normalizeUsageInstructions(decomposedHtml)).toBe(
      "<p>Hướng dẫn</p>",
    );
  });

  it("repairs legacy mojibake in HTML text without rewriting tag attributes", () => {
    expect(
      normalizeUsageInstructions(
        '<p data-source="HÆ°á»›ng">HÆ°á»›ng dáº«n sá»­ dá»¥ng</p>',
      ),
    ).toBe('<p data-source="HÆ°á»›ng">Hướng dẫn sử dụng</p>');
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
