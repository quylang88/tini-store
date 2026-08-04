import { describe, expect, it, vi } from "vitest";
import {
  buildUsageInstructionsPasteHtml,
  getDeclaredBoldClassNamesFromCss,
  isClipboardBoldFormatting,
  normalizeVietnameseClipboardText,
  repairVietnameseUtf8Mojibake,
  restoreBoldFormattingInPlainText,
} from "./usageInstructionsClipboard";

describe("Vietnamese usage-instructions clipboard handling", () => {
  it("normalizes decomposed Vietnamese characters to NFC", () => {
    const decomposed = "Hu\u031Bo\u031B\u0301ng da\u0302\u0303n";

    expect(normalizeVietnameseClipboardText(decomposed)).toBe("Hướng dẫn");
    expect(normalizeVietnameseClipboardText(decomposed)).toBe(
      normalizeVietnameseClipboardText(decomposed).normalize("NFC"),
    );
  });

  it("repairs the UTF-8/Windows-1252 mojibake produced by rich mobile clipboards", () => {
    expect(
      repairVietnameseUtf8Mojibake(
        "HÆ°á»›ng dáº«n sá»­ dá»¥ng: Uá»‘ng sau bá»¯a Äƒn.",
      ),
    ).toBe("Hướng dẫn sử dụng: Uống sau bữa ăn.");
  });

  it("repairs every precomposed Vietnamese letter from a Windows-1252 clipboard", () => {
    const vietnameseAlphabet =
      "àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ" +
      "ÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ";
    const mojibake = new TextDecoder("windows-1252").decode(
      new TextEncoder().encode(vietnameseAlphabet),
    );

    expect(repairVietnameseUtf8Mojibake(mojibake)).toBe(vietnameseAlphabet);
  });

  it("repairs clipboard text that was incorrectly decoded twice", () => {
    const toMojibake = (text) =>
      new TextDecoder("windows-1252").decode(new TextEncoder().encode(text));
    const valid = "Hướng dẫn sử dụng tiếng Việt";

    expect(repairVietnameseUtf8Mojibake(toMojibake(toMojibake(valid)))).toBe(
      valid,
    );
  });

  it("repairs corrupt tokens even when other Vietnamese words are already valid", () => {
    expect(repairVietnameseUtf8Mojibake("Liều dùng: Uá»‘ng 1 viên")).toBe(
      "Liều dùng: Uống 1 viên",
    );
  });

  it("preserves valid Vietnamese punctuation and emoji", () => {
    const valid = "“Uống đủ nước” – mỗi ngày 2 lần 👩‍⚕️";

    expect(normalizeVietnameseClipboardText(valid)).toBe(valid);
  });

  it("does not rewrite legitimate non-Vietnamese Latin text", () => {
    const valid = "Âm thanh, Änderung, São Tomé, déjà vu";

    expect(normalizeVietnameseClipboardText(valid)).toBe(valid);
  });

  it("uses clean plain text when the rich clipboard payload is corrupted", () => {
    const toPlainHtml = vi.fn((text) => `<p>${text}</p>`);

    const result = buildUsageInstructionsPasteHtml({
      htmlData: "<p>HÆ°á»›ng dáº«n sá»­ dá»¥ng</p>",
      textData: "Hướng dẫn sử dụng",
      sanitizeHtml: (html) => html,
      plainTextToHtml: toPlainHtml,
    });

    expect(result).toBe("<p>Hướng dẫn sử dụng</p>");
    expect(toPlainHtml).toHaveBeenCalledWith("Hướng dẫn sử dụng");
  });

  it("rebuilds bold formatting on top of clean plain text", () => {
    const toPlainHtml = vi.fn((text) =>
      `<p>${text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`,
    );
    const result = buildUsageInstructionsPasteHtml({
      htmlData:
        '<p style="font-family: Courier New"><strong>Liều dùng</strong>: 1 viên</p>',
      textData: "Liều dùng: 1 viên",
      sanitizeHtml: (html) => html,
      getBoldTextSegments: () => ["Liều dùng"],
      plainTextToHtml: toPlainHtml,
    });

    expect(result).toBe("<p><strong>Liều dùng</strong>: 1 viên</p>");
    expect(toPlainHtml).toHaveBeenCalledWith("**Liều dùng**: 1 viên");
  });

  it("restores rich bold formatting when plain mobile text adds list markers", () => {
    const richHtml =
      "<ul><li><strong>Công dụng</strong>: Tăng đề kháng</li>" +
      "<li><strong>Liều dùng</strong>: 1 viên</li></ul>";
    const toPlainHtml = vi.fn((text) => `<article>${text}</article>`);
    const result = buildUsageInstructionsPasteHtml({
      htmlData: richHtml,
      textData:
        "• Công dụng: Tăng đề kháng\n• Liều dùng: 1 viên",
      sanitizeHtml: (html) => html,
      getBoldTextSegments: () => ["Công dụng", "Liều dùng"],
      plainTextToHtml: toPlainHtml,
    });

    expect(result).toBe(
      "<article>• **Công dụng**: Tăng đề kháng\n" +
        "• **Liều dùng**: 1 viên</article>",
    );
    expect(toPlainHtml).toHaveBeenCalledWith(
      "• **Công dụng**: Tăng đề kháng\n• **Liều dùng**: 1 viên",
    );
  });

  it("restores repeated bold ranges without changing the plain text", () => {
    expect(
      restoreBoldFormattingInPlainText(
        "Liều dùng sáng. Liều dùng tối.",
        ["Liều dùng", "Liều dùng"],
      ),
    ).toBe("**Liều dùng** sáng. **Liều dùng** tối.");
    expect(
      restoreBoldFormattingInPlainText(
        "Đã có **chữ đậm** và chữ thường.",
        ["chữ đậm"],
      ),
    ).toBe("Đã có **chữ đậm** và chữ thường.");
    expect(
      restoreBoldFormattingInPlainText("Hướng dẫn sử dụng", [
        "HÆ°á»›ng dáº«n",
      ]),
    ).toBe("**Hướng dẫn** sử dụng");
    expect(
      restoreBoldFormattingInPlainText(
        "Liều dùng sáng. Liều dùng tối.",
        [{ text: "Liều dùng", occurrence: 1 }],
      ),
    ).toBe("Liều dùng sáng. **Liều dùng** tối.");
  });

  it("recognizes semantic, CSS, and variable-font bold clipboard formats", () => {
    expect(isClipboardBoldFormatting({ tagName: "strong" })).toBe(true);
    expect(isClipboardBoldFormatting({ tagName: "h3" })).toBe(true);
    expect(
      isClipboardBoldFormatting({ tagName: "span", fontWeight: "600" }),
    ).toBe(true);
    expect(
      isClipboardBoldFormatting({
        tagName: "span",
        className: "response-text font-semibold",
      }),
    ).toBe(true);
    expect(
      isClipboardBoldFormatting({
        tagName: "span",
        fontVariationSettings: '"wght" 650',
      }),
    ).toBe(true);
    expect(
      isClipboardBoldFormatting({
        tagName: "span",
        declaredBold: true,
      }),
    ).toBe(true);
    expect(
      isClipboardBoldFormatting({
        tagName: "span",
        declaredBold: true,
        fontWeight: "normal",
      }),
    ).toBe(false);
    expect(
      isClipboardBoldFormatting({
        tagName: "span",
        className: "font-semibold",
        fontWeight: "normal",
      }),
    ).toBe(false);
  });

  it("finds bold classes declared inside clipboard stylesheets", () => {
    const classNames = getDeclaredBoldClassNamesFromCss(`
      .gemini-emphasis { font-weight: 650 !important; }
      .chatgpt-variable { font-variation-settings: "wght" 700; }
      .regular-copy { font-weight: 400; }
    `);

    expect(Array.from(classNames).sort()).toEqual([
      "chatgpt-variable",
      "gemini-emphasis",
    ]);
  });

  it("uses plain text when the HTML payload contains different clipboard content", () => {
    const result = buildUsageInstructionsPasteHtml({
      htmlData: "<p>ChatGPT</p><p>Hướng dẫn sử dụng</p>",
      textData: "Hướng dẫn sử dụng",
      sanitizeHtml: (html) => html,
      plainTextToHtml: (text) => `<p>${text}</p>`,
    });

    expect(result).toBe("<p>Hướng dẫn sử dụng</p>");
  });

  it("repairs a plain-text-only mobile clipboard payload", () => {
    const result = buildUsageInstructionsPasteHtml({
      textData: "Uá»‘ng sau bá»¯a Äƒn",
      plainTextToHtml: (text) => `<p>${text}</p>`,
    });

    expect(result).toBe("<p>Uống sau bữa ăn</p>");
  });
});
