import { describe, expect, it } from "vitest";
import {
  generateProductCode,
  isAutomaticProductCode,
  migrateProductCodes,
} from "./productCode.js";

describe("generateProductCode", () => {
  it("builds readable segments from Vietnamese category and product names", () => {
    const code = generateProductCode({
      id: "product-123",
      category: "Mỹ phẩm",
      name: "Sữa rửa mặt",
      usedCodes: new Set(),
    });

    expect(code).toMatch(/^MP-SRM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
  });

  it("uses stable fallback and abbreviation rules", () => {
    const twoWordName = generateProductCode({
      id: "p1",
      category: "Chung",
      name: "Vitamin C",
    });
    const missingIdentity = generateProductCode({ id: "p2" });

    expect(twoWordName).toMatch(/^CH-VIC-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
    expect(missingIdentity).toMatch(
      /^SP-XXX-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
    );
    expect(generateProductCode({ id: "p1", category: "Chung", name: "Vitamin C" }))
      .toBe(twoWordName);
  });

  it("retries deterministically when the first generated code is already used", () => {
    const input = {
      id: "p1",
      category: "Thực phẩm",
      name: "Collagen",
    };
    const firstCode = generateProductCode(input);
    const nextCode = generateProductCode({
      ...input,
      usedCodes: new Set([firstCode]),
    });

    expect(nextCode).not.toBe(firstCode);
    expect(nextCode).toMatch(
      /^TP-COL-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
    );
    expect(
      generateProductCode({
        ...input,
        usedCodes: new Set([firstCode]),
      }),
    ).toBe(nextCode);
  });
});

describe("automatic product code migration", () => {
  it("recognizes only the automatic code shape", () => {
    expect(isAutomaticProductCode("MP-SRM-A7K3")).toBe(true);
    expect(isAutomaticProductCode("MP-SRM-A0K3")).toBe(false);
    expect(isAutomaticProductCode("legacy-code")).toBe(false);
  });

  it("replaces every legacy code without mutating products or array order", () => {
    const products = [
      {
        id: "p2",
        name: "Collagen",
        category: "Thực phẩm",
        productCode: "OLD-2",
        stock: 7,
        purchaseLots: [{ id: "lot-1", quantity: 7 }],
      },
      { id: "p1", name: "Sữa rửa mặt", category: "Mỹ phẩm", productCode: "OLD-1" },
    ];

    const migrated = migrateProductCodes(products, { replaceAll: true });

    expect(migrated.map((product) => product.id)).toEqual(["p2", "p1"]);
    expect(migrated.map((product) => product.productCode)).not.toContain("OLD-1");
    expect(migrated.map((product) => product.productCode)).not.toContain("OLD-2");
    expect(new Set(migrated.map((product) => product.productCode)).size).toBe(2);
    expect(migrated.every((product) => isAutomaticProductCode(product.productCode)))
      .toBe(true);
    expect({
      ...migrated[0],
      productCode: products[0].productCode,
    }).toEqual(products[0]);
    expect(products.map((product) => product.productCode)).toEqual([
      "OLD-2",
      "OLD-1",
    ]);
  });

  it("assigns the same migrated code to each id regardless of input order", () => {
    const firstOrder = [
      { id: "p2", name: "Collagen", category: "Thực phẩm", productCode: "A" },
      { id: "p1", name: "Collagen", category: "Thực phẩm", productCode: "B" },
    ];
    const secondOrder = [...firstOrder].reverse();

    const firstCodes = new Map(
      migrateProductCodes(firstOrder, { replaceAll: true }).map((product) => [
        product.id,
        product.productCode,
      ]),
    );
    const secondCodes = new Map(
      migrateProductCodes(secondOrder, { replaceAll: true }).map((product) => [
        product.id,
        product.productCode,
      ]),
    );

    expect(secondCodes).toEqual(firstCodes);
  });

  it("preserves one valid v2 code and repairs duplicates deterministically", () => {
    const keptCode = generateProductCode({
      id: "legacy-seed",
      category: "Mỹ phẩm",
      name: "Serum dưỡng da",
    });
    const products = [
      {
        id: "p2",
        name: "Serum dưỡng da",
        category: "Mỹ phẩm",
        productCode: keptCode,
      },
      {
        id: "p1",
        name: "Tên đã đổi",
        category: "Danh mục mới",
        productCode: keptCode,
      },
    ];

    const migrated = migrateProductCodes(products, { replaceAll: false });
    const byId = new Map(migrated.map((product) => [product.id, product]));

    expect(byId.get("p1").productCode).toBe(keptCode);
    expect(byId.get("p2").productCode).not.toBe(keptCode);
    expect(isAutomaticProductCode(byId.get("p2").productCode)).toBe(true);
  });
});
