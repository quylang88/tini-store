import { describe, expect, it } from "vitest";
import { generateProductCode } from "../inventory/productCode.js";
import {
  buildBackupData,
  normalizeBackupProducts,
} from "./backupUtils.js";

describe("backup product code versioning", () => {
  it("marks newly exported backups as version 2", () => {
    const backup = buildBackupData({
      products: [],
      orders: [],
      settings: {},
    });

    expect(backup.backupVersion).toBe(2);
  });

  it("replaces every product code from an unversioned backup", () => {
    const products = normalizeBackupProducts({
      products: [
        {
          id: "p1",
          name: "Sữa rửa mặt",
          category: "Mỹ phẩm",
          productCode: "OLD-1",
        },
      ],
    });

    expect(products[0].productCode).not.toBe("OLD-1");
    expect(products[0].productCode).toMatch(
      /^MP-SRM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
    );
  });

  it("keeps valid v2 codes while repairing missing codes", () => {
    const existingCode = generateProductCode({
      id: "p1",
      name: "Tên cũ",
      category: "Chung",
    });
    const products = normalizeBackupProducts({
      backupVersion: 2,
      products: [
        {
          id: "p1",
          name: "Tên mới",
          category: "Mỹ phẩm",
          productCode: existingCode,
        },
        {
          id: "p2",
          name: "Collagen",
          category: "Thực phẩm",
          productCode: "",
        },
      ],
    });

    expect(products[0].productCode).toBe(existingCode);
    expect(products[1].productCode).toMatch(
      /^TP-COL-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
    );
  });
});
