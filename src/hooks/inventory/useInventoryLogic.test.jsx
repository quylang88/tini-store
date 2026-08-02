import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import useInventoryLogic from "./useInventoryLogic";

const TestComponent = ({ products = [], settings = {} }) => {
  const logic = useInventoryLogic({
    products,
    setProducts: vi.fn(),
    settings,
  });

  return (
    <div data-testid="logic-status">
      <span data-testid="is-modal-open">{String(logic.isModalOpen)}</span>
      <span data-testid="has-handle-shipping">
        {String(typeof logic.handleShippingMethodChange === "function")}
      </span>
      <span data-testid="has-handle-decimal">
        {String(typeof logic.handleDecimalChange === "function")}
      </span>
    </div>
  );
};

describe("useInventoryLogic hook", () => {
  it("initializes without throwing ReferenceError and exports all required form handlers", () => {
    const settings = {
      categories: ["Mỹ phẩm", "Thực phẩm"],
      exchangeRate: 170,
    };

    expect(() => {
      const html = renderToStaticMarkup(
        <TestComponent products={[]} settings={settings} />,
      );
      expect(html).toContain('data-testid="is-modal-open">false</span>');
      expect(html).toContain(
        'data-testid="has-handle-shipping">true</span>',
      );
      expect(html).toContain(
        'data-testid="has-handle-decimal">true</span>',
      );
    }).not.toThrow();
  });
});
