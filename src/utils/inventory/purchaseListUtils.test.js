import { describe, expect, it } from "vitest";
import { completePurchaseListItem } from "./purchaseListUtils.js";

describe("completePurchaseListItem", () => {
  it("assigns an automatic code to a newly purchased product", () => {
    const result = completePurchaseListItem({
      purchaseLists: [
        {
          id: "list-1",
          warehouse: "vinhPhuc",
          items: [
            {
              id: "item-1",
              kind: "new",
              name: "Sữa rửa mặt",
              quantity: 2,
              status: "pending",
            },
          ],
        },
      ],
      products: [],
      listId: "list-1",
      itemId: "item-1",
      completionData: {
        price: 200,
        cost: 100,
        category: "Mỹ phẩm",
      },
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].productCode).toMatch(
      /^MP-SRM-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
    );
  });

});
