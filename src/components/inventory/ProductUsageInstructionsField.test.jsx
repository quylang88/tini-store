import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductUsageInstructionsField from "./ProductUsageInstructionsField";

describe("ProductUsageInstructionsField", () => {
  it("renders the label and rich text formatting toolbar", () => {
    const html = renderToStaticMarkup(
      <ProductUsageInstructionsField
        value="<p><b>Liều dùng:</b> 1 viên/ngày</p>"
        onChange={() => {}}
      />,
    );

    expect(html).toContain("Hướng dẫn sử dụng");
    expect(html).toContain("In đậm (Bold)");
    expect(html).toContain("Danh sách dấu chấm (Bullet List)");
    expect(html).toContain("Liều dùng:");
  });

  it("disables editing when readOnly or disabled is true", () => {
    const html = renderToStaticMarkup(
      <ProductUsageInstructionsField
        value="HDSD"
        onChange={() => {}}
        readOnly={true}
      />,
    );

    expect(html).toContain('contentEditable="false"');
    expect(html).not.toContain("In đậm (Bold)");
  });
});
