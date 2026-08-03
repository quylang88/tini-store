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
    expect(html).toContain("Căn giữa");
    expect(html).toContain("Hoàn tác (Undo)");
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

  it("renders formatted HTML content correctly", () => {
    const html = renderToStaticMarkup(
      <ProductUsageInstructionsField
        value="<p><strong>Liều dùng:</strong> 2 viên</p><ul><li>Sáng 1 viên</li></ul>"
        onChange={() => {}}
      />,
    );

    expect(html).toContain("<strong>Liều dùng:</strong>");
    expect(html).toContain("<li>Sáng 1 viên</li>");
  });

  it("renders nested multilevel list structures correctly", () => {
    const html = renderToStaticMarkup(
      <ProductUsageInstructionsField
        value="<ul><li>Công dụng:<ul><li>Tăng đề kháng</li></ul></li></ul>"
        onChange={() => {}}
      />,
    );

    expect(html).toContain("<ul><li>Công dụng:<ul><li>Tăng đề kháng</li></ul></li></ul>");
  });
});
