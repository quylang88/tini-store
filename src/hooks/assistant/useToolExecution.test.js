import { describe, expect, it } from "vitest";
import { buildAssistantProductIdentity } from "./useToolExecution.js";

describe("buildAssistantProductIdentity", () => {
  it("assigns the default category and an automatic code", () => {
    const identity = buildAssistantProductIdentity({
      id: "assistant-product-1",
      name: "Vitamin C",
      products: [],
    });

    expect(identity.category).toBe("Chung");
    expect(identity.productCode).toMatch(
      /^CH-VIC-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
    );
  });
});
