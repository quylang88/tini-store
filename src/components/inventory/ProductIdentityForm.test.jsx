import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductIdentityForm from "./ProductIdentityForm.jsx";

const renderForm = (productCode) =>
  renderToStaticMarkup(
    <ProductIdentityForm
      productCode={productCode}
      category="Mỹ phẩm"
      name="Sữa rửa mặt"
      categories={["Mỹ phẩm"]}
    />,
  );

describe("ProductIdentityForm product code", () => {
  it("renders an existing product code as read-only", () => {
    const markup = renderForm("MP-SRM-A7K3");

    expect(markup).toContain('value="MP-SRM-A7K3"');
    expect(markup).toContain('readOnly=""');
  });

  it("explains that a new product code is assigned on save", () => {
    const markup = renderForm("");

    expect(markup).toContain('placeholder="Tự động khi lưu"');
  });
});
