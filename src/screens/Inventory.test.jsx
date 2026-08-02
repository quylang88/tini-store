import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Inventory from "./Inventory.jsx";

describe("Inventory screen", () => {
  it("renders Inventory screen without error", () => {
    const products = [
      {
        id: "p1",
        name: "Kem dưỡng ẩm",
        category: "Mỹ phẩm",
        price: 350000,
        productCode: "MP-KDA-1234",
        purchaseLots: [
          {
            id: "lot-1",
            cost: 200000,
            quantity: 10,
            warehouse: "kho-vn",
          },
        ],
      },
    ];

    const settings = {
      categories: ["Mỹ phẩm", "Thực phẩm"],
      exchangeRate: 170,
    };

    expect(() => {
      const html = renderToStaticMarkup(
        <Inventory
          products={products}
          setProducts={vi.fn()}
          orders={[]}
          setOrders={vi.fn()}
          settings={settings}
          setTabBarVisible={vi.fn()}
          updateFab={vi.fn()}
          isActive={true}
        />,
      );
      expect(html).toContain("Kem dưỡng ẩm");
      expect(html).toContain("MP-KDA-1234");
    }).not.toThrow();
  });
});
