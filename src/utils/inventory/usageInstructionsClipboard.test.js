import { describe, expect, it, vi } from "vitest";
import {
  buildUsageInstructionsPasteHtml,
  normalizeVietnameseClipboardText,
  repairVietnameseUtf8Mojibake,
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
      htmlToText: (html) => html.replace(/<[^>]+>/g, ""),
      plainTextToHtml: toPlainHtml,
    });

    expect(result).toBe("<p>Hướng dẫn sử dụng</p>");
    expect(toPlainHtml).toHaveBeenCalledWith("Hướng dẫn sử dụng");
  });

  it("keeps sanitized rich formatting when its Unicode text matches plain text", () => {
    const result = buildUsageInstructionsPasteHtml({
      htmlData: "<p><strong>Liều dùng</strong>: 1 viên</p>",
      textData: "Liều dùng: 1 viên",
      sanitizeHtml: (html) => html,
      htmlToText: (html) => html.replace(/<[^>]+>/g, ""),
      plainTextToHtml: (text) => `<p>${text}</p>`,
    });

    expect(result).toBe("<p><strong>Liều dùng</strong>: 1 viên</p>");
  });

  it("uses plain text when the HTML payload contains different clipboard content", () => {
    const result = buildUsageInstructionsPasteHtml({
      htmlData: "<p>ChatGPT</p><p>Hướng dẫn sử dụng</p>",
      textData: "Hướng dẫn sử dụng",
      sanitizeHtml: (html) => html,
      htmlToText: (html) => html.replace(/<[^>]+>/g, ""),
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
