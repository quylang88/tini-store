import { describe, expect, it, vi } from "vitest";
import {
  createPdfFromPageImages,
  fitLayoutsToPageHeight,
  loadImage,
  paginateByHeight,
} from "./usageInstructionsPdf";

describe("usage instruction PDF pagination", () => {
  it("starts a new page before an item would exceed available height", () => {
    const items = [
      { id: "a", height: 400 },
      { id: "b", height: 500 },
      { id: "c", height: 300 },
    ];

    expect(
      paginateByHeight(items, (item) => item.height, 900),
    ).toEqual([[items[0], items[1]], [items[2]]]);
  });

  it("places an oversized item alone without dropping it", () => {
    const oversized = { id: "a", height: 1200 };

    expect(
      paginateByHeight([oversized], (item) => item.height, 900),
    ).toEqual([[oversized]]);
  });

  it("splits oversized product instructions into bounded continuation cards", () => {
    const layout = {
      key: "p1",
      imageKey: "p1",
      name: "Sản phẩm dài",
      nameLines: ["Sản phẩm dài"],
      instructionLines: Array.from(
        { length: 80 },
        (_, index) => `Dòng ${index + 1}`,
      ),
      height: 4000,
    };

    const fitted = fitLayoutsToPageHeight([layout], 900);

    expect(fitted.length).toBeGreaterThan(1);
    expect(fitted.every((item) => item.height <= 900)).toBe(true);
    expect(
      fitted.flatMap((item) => item.instructionLines),
    ).toEqual(layout.instructionLines);
    expect(fitted[1].nameLines).toEqual(layout.nameLines);
  });

  it("keeps every continuation bounded when the wrapped name is oversized", () => {
    const layout = {
      key: "p-long-name",
      imageKey: "p-long-name",
      name: "Tên rất dài",
      nameLines: Array.from(
        { length: 30 },
        (_, index) => `Dòng tên ${index + 1}`,
      ),
      instructionLines: ["• Liều mỗi lần: 1 viên"],
      height: 4000,
    };

    const fitted = fitLayoutsToPageHeight([layout], 900);

    expect(fitted.length).toBeGreaterThan(1);
    expect(fitted.every((item) => item.height <= 900)).toBe(true);
    for (const nameLine of layout.nameLines) {
      expect(
        fitted.some((item) => item.nameLines.includes(nameLine)),
      ).toBe(true);
    }
    expect(
      fitted.flatMap((item) => item.instructionLines),
    ).toEqual(layout.instructionLines);
  });

  it("returns no pages for empty input", () => {
    expect(paginateByHeight([], () => 100, 900)).toEqual([]);
  });

  it("assembles page images into a valid A4 PDF blob", async () => {
    const onePixelPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    const blob = await createPdfFromPageImages([onePixelPng]);
    const signature = new TextDecoder().decode(
      (await blob.arrayBuffer()).slice(0, 4),
    );

    expect(blob.type).toBe("application/pdf");
    expect(signature).toBe("%PDF");
  });

  it("falls back when a remote image never settles", async () => {
    vi.useFakeTimers();
    class StalledImage {
      set src(value) {
        this.source = value;
      }
    }

    const request = loadImage("https://images.example/product.png", {
      ImageConstructor: StalledImage,
      baseUrl: "https://shop.example/",
      timeoutMs: 50,
    });
    await vi.advanceTimersByTimeAsync(50);

    expect(await request).toBeNull();
    vi.useRealTimers();
  });
});
