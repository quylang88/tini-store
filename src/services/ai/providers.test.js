import { describe, expect, it } from "vitest";
import { buildGeminiContents } from "./providers";

describe("Gemini request content", () => {
  it("converts a product data URL into an inline image part", () => {
    expect(
      buildGeminiContents([
        {
          role: "user",
          content: "Nhận diện sản phẩm",
          image: "data:image/jpeg;base64,YWJjMTIz",
        },
      ]),
    ).toEqual([
      {
        role: "user",
        parts: [
          { text: "Nhận diện sản phẩm" },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: "YWJjMTIz",
            },
          },
        ],
      },
    ]);
  });

  it("keeps text-only history compatible with existing callers", () => {
    expect(
      buildGeminiContents([{ role: "assistant", content: "Đã hiểu" }]),
    ).toEqual([
      {
        role: "model",
        parts: [{ text: "Đã hiểu" }],
      },
    ]);
  });
});
