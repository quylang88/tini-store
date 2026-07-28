import { describe, expect, it } from "vitest";
import {
  formatUsageInstructions,
  parseJsonObject,
  resolveProductUsageInstructions,
} from "./productUsageInstructionsService";

describe("product usage instruction response parsing", () => {
  it("parses fenced Gemini JSON", () => {
    expect(
      parseJsonObject(
        '```json\n{"isMedicineOrSupplement":true}\n```',
      ),
    ).toEqual({ isMedicineOrSupplement: true });
  });

  it("returns null for malformed Gemini output", () => {
    expect(parseJsonObject("Không có JSON hợp lệ")).toBeNull();
    expect(parseJsonObject('{"missing":')).toBeNull();
  });

  it("creates the exact four-line Vietnamese format", () => {
    expect(
      formatUsageInstructions({
        timing: "Sau bữa sáng",
        dose: "1 viên",
        frequency: "2 lần mỗi ngày",
        note: "Không tự tăng liều",
      }),
    ).toBe(
      [
        "• Thời điểm dùng: Sau bữa sáng",
        "• Liều mỗi lần: 1 viên",
        "• Số lần dùng: 2 lần mỗi ngày",
        "• Lưu ý: Không tự tăng liều",
      ].join("\n"),
    );
  });

  it("collapses model-supplied newlines and bullet markers into four owned lines", () => {
    const result = formatUsageInstructions({
      timing: "Sau bữa sáng\n• Không uống lúc đói",
      dose: "• 1 viên\r\n- Không tự tăng",
      frequency: "2 lần mỗi ngày",
      note: "Theo nhãn • hỏi dược sĩ",
    });

    expect(result.split("\n")).toHaveLength(4);
    expect(result.match(/•/g)).toHaveLength(4);
    expect(result).toContain(
      "• Thời điểm dùng: Sau bữa sáng; Không uống lúc đói",
    );
  });

  it("rejects incomplete dosage data", () => {
    expect(
      formatUsageInstructions({
        timing: "Sau bữa sáng",
        dose: "",
        frequency: "2 lần mỗi ngày",
      }),
    ).toBeNull();
  });

  it("rejects a daily total presented as a per-use dose", () => {
    expect(
      formatUsageInstructions({
        timing: "Sau bữa sáng",
        dose: "75 - 90mg/ngày",
        frequency: "1 lần mỗi ngày",
      }),
    ).toBeNull();
  });
});

describe("product usage instruction orchestration", () => {
  it("preserves existing instructions without invoking external work", async () => {
    const calls = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C",
        usageInstructions: "  Nội dung thủ công  ",
      },
      {
        callGemini: async () => calls.push("gemini"),
        search: async () => calls.push("search"),
        modelNames: ["gemini-test"],
      },
    );

    expect(result).toEqual({
      instructions: "Nội dung thủ công",
      error: null,
    });
    expect(calls).toEqual([]);
  });

  it("does not search when classification is negative", async () => {
    const calls = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Áo khoác",
        category: "Quần áo",
        usageInstructions: null,
      },
      {
        callGemini: async () => {
          calls.push("classify");
          return { content: '{"isMedicineOrSupplement":false}' };
        },
        search: async () => {
          calls.push("search");
          return "unused";
        },
        modelNames: ["gemini-test"],
      },
    );

    expect(result.instructions).toBeNull();
    expect(result.error).toContain("không thuộc nhóm Thuốc hoặc Thực phẩm bổ sung");
    expect(calls).toEqual(["classify"]);
  });

  it("always searches before synthesis for a positive classification", async () => {
    const calls = [];
    const responses = [
      { content: '{"isMedicineOrSupplement":true}' },
      {
        content:
          '{"timing":"Sau ăn","dose":"1 viên","frequency":"2 lần mỗi ngày","note":"Không tự tăng liều"}',
      },
    ];

    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C 1000mg",
        category: "Thực phẩm",
        usageInstructions: null,
      },
      {
        callGemini: async () => {
          calls.push("gemini");
          return responses.shift();
        },
        search: async (query) => {
          calls.push("search");
          expect(query).toContain("Vitamin C 1000mg");
          return "[Nguồn: nhãn sản phẩm]";
        },
        modelNames: ["gemini-test"],
      },
    );

    expect(calls).toEqual(["gemini", "search", "gemini"]);
    expect(result.instructions).toContain("• Liều mỗi lần: 1 viên");
    expect(result.error).toBeNull();
  });

  it("tries Japanese search after Vietnamese evidence is unavailable", async () => {
    const searchQueries = [];
    const responses = [
      { content: '{"isMedicineOrSupplement":true}' },
      {
        content:
          '{"timing":"Sau bữa sáng","dose":"2 viên","frequency":"1 lần mỗi ngày","note":"Dịch từ hướng dẫn trên nhãn Nhật"}',
      },
    ];
    const result = await resolveProductUsageInstructions(
      {
        name: "アリナミンEXプラス",
        category: "Thực phẩm",
        usageInstructions: null,
      },
      {
        callGemini: async () => {
          return responses.shift();
        },
        search: async (query) => {
          searchQueries.push(query);
          return searchQueries.length === 1
            ? null
            : "[日本語の公式情報] 1日1回、食後に2錠";
        },
        modelNames: ["gemini-test"],
      },
    );

    expect(searchQueries).toHaveLength(2);
    expect(searchQueries[0]).toContain("hướng dẫn sử dụng");
    expect(searchQueries[1]).toContain("使用方法");
    expect(searchQueries[1]).toContain("アリナミンEXプラス");
    expect(result.instructions).toContain(
      "• Thời điểm dùng: Sau bữa sáng",
    );
    expect(result.sourceLanguage).toBe("ja");
    expect(result.error).toBeNull();
  });

  it("tries Japanese search when Vietnamese evidence cannot produce complete dosage", async () => {
    const prompts = [];
    const searchQueries = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C Nhật Bản",
        category: "Thực phẩm",
        usageInstructions: null,
      },
      {
        callGemini: async (_modelName, history) => {
          const prompt = history[0].content;
          prompts.push(prompt);
          if (prompt.startsWith("Phân loại sản phẩm")) {
            return { content: '{"isMedicineOrSupplement":true}' };
          }
          if (prompt.includes("Ngôn ngữ nguồn: Tiếng Việt")) {
            return {
              content:
                '{"timing":"Sau ăn","dose":null,"frequency":"1 lần mỗi ngày"}',
            };
          }
          return {
            content:
              '{"timing":"Sau ăn","dose":"1 viên","frequency":"1 lần mỗi ngày","note":"Bản dịch tiếng Việt từ nguồn Nhật"}',
          };
        },
        search: async (query) => {
          searchQueries.push(query);
          return searchQueries.length === 1
            ? "[Nguồn Việt] Không nêu liều mỗi lần"
            : "[日本語の公式情報] 1日1回、食後に1錠";
        },
        modelNames: ["gemini-test"],
      },
    );

    expect(searchQueries).toHaveLength(2);
    expect(prompts.some((prompt) => prompt.includes("Ngôn ngữ nguồn: Tiếng Nhật"))).toBe(
      true,
    );
    expect(result.instructions).toContain("• Liều mỗi lần: 1 viên");
    expect(result.sourceLanguage).toBe("ja");
    expect(result.error).toBeNull();
  });

  it("returns a clear error only after Vietnamese and Japanese searches both fail", async () => {
    const searchQueries = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C không rõ hãng",
        category: "Thực phẩm",
        usageInstructions: null,
      },
      {
        callGemini: async () => ({
          content: '{"isMedicineOrSupplement":true}',
        }),
        search: async (query) => {
          searchQueries.push(query);
          return null;
        },
        modelNames: ["gemini-test"],
      },
    );

    expect(searchQueries).toHaveLength(2);
    expect(result.instructions).toBeNull();
    expect(result.error).toContain("tiếng Việt và tiếng Nhật");
    expect(result.error).toContain("Vitamin C không rõ hãng");
    expect(result.error).toContain("ảnh");
  });

  it("reports a Gemini classification failure instead of silently returning null", async () => {
    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C",
        category: "Thực phẩm",
        usageInstructions: null,
      },
      {
        callGemini: async () => {
          throw new Error("Gemini unavailable");
        },
        search: async () => "unused",
        modelNames: ["gemini-a", "gemini-b"],
      },
    );

    expect(result.instructions).toBeNull();
    expect(result.error).toContain("Gemini");
    expect(result.error).toContain("Vui lòng thử lại");
  });

  it("reports a web-search failure after both language attempts error", async () => {
    const queries = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C",
        category: "Thực phẩm",
        usageInstructions: null,
      },
      {
        callGemini: async () => ({
          content: '{"isMedicineOrSupplement":true}',
        }),
        search: async (query) => {
          queries.push(query);
          throw new Error("Search unavailable");
        },
        modelNames: ["gemini-test"],
      },
    );

    expect(queries).toHaveLength(2);
    expect(result.instructions).toBeNull();
    expect(result.error).toContain("dịch vụ tìm kiếm web");
    expect(result.error).toContain("tiếng Việt và tiếng Nhật");
  });

  it("falls through configured Gemini models", async () => {
    const attemptedModels = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Áo khoác",
        category: "Quần áo",
        usageInstructions: null,
      },
      {
        callGemini: async (modelName) => {
          attemptedModels.push(modelName);
          if (modelName === "gemini-broken") {
            throw new Error("unavailable");
          }
          return { content: '{"isMedicineOrSupplement":false}' };
        },
        search: async () => "unused",
        modelNames: ["gemini-broken", "gemini-working"],
      },
    );

    expect(result.instructions).toBeNull();
    expect(result.error).toContain("không thuộc nhóm Thuốc hoặc Thực phẩm bổ sung");
    expect(attemptedModels).toEqual(["gemini-broken", "gemini-working"]);
  });

  it("falls through when a Gemini model returns malformed classification JSON", async () => {
    const attemptedModels = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Áo khoác",
        category: "Quần áo",
        usageInstructions: null,
      },
      {
        callGemini: async (modelName) => {
          attemptedModels.push(modelName);
          if (modelName === "gemini-malformed") {
            return { content: "không phải JSON" };
          }
          return { content: '{"isMedicineOrSupplement":false}' };
        },
        search: async () => "unused",
        modelNames: ["gemini-malformed", "gemini-working"],
      },
    );

    expect(result.instructions).toBeNull();
    expect(result.error).toContain("không thuộc nhóm Thuốc hoặc Thực phẩm bổ sung");
    expect(attemptedModels).toEqual([
      "gemini-malformed",
      "gemini-working",
    ]);
  });

  it("falls through when synthesis output is incomplete", async () => {
    const synthesisModels = [];
    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C 1000mg",
        category: "Thực phẩm",
        usageInstructions: null,
      },
      {
        callGemini: async (modelName, history) => {
          if (history[0].content.startsWith("Phân loại sản phẩm")) {
            return { content: '{"isMedicineOrSupplement":true}' };
          }

          synthesisModels.push(modelName);
          if (modelName === "gemini-incomplete") {
            return {
              content:
                '{"timing":"Sau ăn","dose":null,"frequency":"1 lần mỗi ngày"}',
            };
          }
          return {
            content:
              '{"timing":"Sau ăn","dose":"1 viên","frequency":"1 lần mỗi ngày","note":"Theo nhãn"}',
          };
        },
        search: async () => "[Nguồn: nhãn sản phẩm]",
        modelNames: ["gemini-incomplete", "gemini-working"],
      },
    );

    expect(synthesisModels).toEqual([
      "gemini-incomplete",
      "gemini-working",
    ]);
    expect(result.instructions).toContain("• Liều mỗi lần: 1 viên");
    expect(result.error).toBeNull();
  });

  it("passes the product image to Gemini classification and synthesis", async () => {
    const image =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
    const receivedImages = [];

    const result = await resolveProductUsageInstructions(
      {
        name: "Vitamin C 1000mg",
        category: "Thực phẩm",
        image,
        usageInstructions: null,
      },
      {
        callGemini: async (_modelName, history) => {
          receivedImages.push(history[0].image);
          return receivedImages.length === 1
            ? { content: '{"isMedicineOrSupplement":true}' }
            : {
                content:
                  '{"timing":"Sau ăn","dose":"1 viên","frequency":"1 lần mỗi ngày","note":"Theo nhãn"}',
              };
        },
        search: async () => "[Nguồn: nhãn sản phẩm]",
        modelNames: ["gemini-test"],
      },
    );

    expect(result.error).toBeNull();
    expect(receivedImages).toEqual([image, image]);
  });

  it("deduplicates concurrent requests for the same product identity", async () => {
    let releaseClassification;
    const classificationGate = new Promise((resolve) => {
      releaseClassification = resolve;
    });
    const calls = [];
    const dependencies = {
      callGemini: async (_modelName, history) => {
        const prompt = history[0].content;
        if (prompt.startsWith("Phân loại sản phẩm")) {
          calls.push("classify");
          await classificationGate;
          return { content: '{"isMedicineOrSupplement":true}' };
        }

        calls.push("synthesize");
        return {
          content:
            '{"timing":"Sau ăn","dose":"1 viên","frequency":"2 lần mỗi ngày","note":"Không tự tăng liều"}',
        };
      },
      search: async () => {
        calls.push("search");
        return "[Nguồn: nhãn sản phẩm]";
      },
      modelNames: ["gemini-test"],
    };
    const product = {
      id: "p1",
      name: "Vitamin C",
      category: "Thực phẩm",
      usageInstructions: null,
    };

    const firstRequest = resolveProductUsageInstructions(
      product,
      dependencies,
    );
    const secondRequest = resolveProductUsageInstructions(
      product,
      dependencies,
    );
    releaseClassification();

    const [firstResult, secondResult] = await Promise.all([
      firstRequest,
      secondRequest,
    ]);

    expect(firstResult).toBe(secondResult);
    expect(calls).toEqual(["classify", "search", "synthesize"]);
  });
});
