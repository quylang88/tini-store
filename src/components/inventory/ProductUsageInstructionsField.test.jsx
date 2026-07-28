import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductUsageInstructionsField from "./ProductUsageInstructionsField";

describe("ProductUsageInstructionsField", () => {
  it("renders the AI failure prominently beside an editable field", () => {
    const html = renderToStaticMarkup(
      <ProductUsageInstructionsField
        value=""
        onChange={() => {}}
        errorText="AI đã thử tìm bằng tiếng Việt và tiếng Nhật nhưng chưa đủ dữ liệu."
      />,
    );

    expect(html).toContain(
      "AI đã thử tìm bằng tiếng Việt và tiếng Nhật nhưng chưa đủ dữ liệu.",
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).not.toContain("readonly");
  });

  it("renders status label and message when generating offline", () => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    const html = renderToStaticMarkup(
      <ProductUsageInstructionsField
        value=""
        onChange={() => {}}
        isGenerating={true}
      />,
    );

    expect(html).toContain("Không có kết nối mạng");
    expect(html).toContain("Không có kết nối Internet để AI tra cứu HDSD.");

    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      configurable: true,
    });
  });
});
