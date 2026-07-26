# Product Usage Instructions and PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically create, persist, edit, and export grounded Vietnamese product usage instructions as a real A4 PDF.

**Architecture:** Store instructions as a normalized nullable product string, isolate Gemini/Tavily orchestration in a focused service, and integrate it at the create-save and basic-edit boundaries. Build an order-specific selector and a canvas-backed `jsPDF` exporter that produces shareable A4 PDF files without changing existing invoice exports.

**Tech Stack:** React 19, Vite 7, IndexedDB, Vitest, Gemini SDK, Tavily HTTP API, Canvas 2D, jsPDF, Web Share API.

## Global Constraints

- `usageInstructions` is persisted only as `null` or a trimmed non-empty string.
- A non-empty instruction must never be overwritten automatically.
- Positive medicine/supplement classification must always be followed by Tavily search before Gemini synthesis.
- AI/network failure must not block product creation.
- Edit-time generation auto-saves immediately while remaining manually editable afterward.
- PDF content contains only shop logo, export date, product image, product name, and usage instructions.
- PDF content and filename contain no order identifier.
- Heavy PDF code is loaded only when the user taps the export action.

---

### Task 1: Nullable Product Field and Preservation

**Files:**
- Create: `src/utils/inventory/usageInstructions.js`
- Create: `src/utils/inventory/usageInstructions.test.js`
- Create: `src/utils/inventory/inventorySaveUtils.test.js`
- Modify: `src/services/storageService.js`
- Modify: `src/utils/inventory/purchaseUtils.js`
- Modify: `src/utils/inventory/inventoryForm.js`
- Modify: `src/utils/inventory/inventorySaveUtils.js`

**Interfaces:**
- Produces: `normalizeUsageInstructions(value): string | null`
- Produces: `hasUsageInstructions(value): boolean`
- Produces: `normalizeProductUsageInstructions(product): object`
- Consumes: Existing product form and purchase-lot mapping functions.

- [ ] **Step 1: Write failing normalization tests**

```js
import { describe, expect, it } from "vitest";
import {
  hasUsageInstructions,
  normalizeProductUsageInstructions,
  normalizeUsageInstructions,
} from "./usageInstructions";

describe("usage instruction normalization", () => {
  it("normalizes missing and blank values to null", () => {
    expect(normalizeUsageInstructions(undefined)).toBeNull();
    expect(normalizeUsageInstructions("   ")).toBeNull();
  });

  it("trims and preserves non-empty text", () => {
    expect(normalizeUsageInstructions("  • Liều: 1 viên  ")).toBe(
      "• Liều: 1 viên",
    );
    expect(hasUsageInstructions(" • Liều: 1 viên ")).toBe(true);
  });

  it("adds the nullable property to legacy products", () => {
    expect(normalizeProductUsageInstructions({ id: "p1" })).toEqual({
      id: "p1",
      usageInstructions: null,
    });
  });
});
```

- [ ] **Step 2: Run the normalization test and verify RED**

Run: `npm test -- src/utils/inventory/usageInstructions.test.js`

Expected: FAIL because `usageInstructions.js` does not exist.

- [ ] **Step 3: Implement minimal normalization helpers**

```js
export const normalizeUsageInstructions = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
};

export const hasUsageInstructions = (value) =>
  normalizeUsageInstructions(value) !== null;

export const normalizeProductUsageInstructions = (product = {}) => ({
  ...product,
  usageInstructions: normalizeUsageInstructions(product.usageInstructions),
});
```

- [ ] **Step 4: Run the normalization test and verify GREEN**

Run: `npm test -- src/utils/inventory/usageInstructions.test.js`

Expected: PASS.

- [ ] **Step 5: Write failing restock and lot-preservation tests**

```js
import { describe, expect, it } from "vitest";
import { createFormDataForLot } from "./inventoryForm";
import { buildNextProductFromForm } from "./inventorySaveUtils";

describe("usage instruction inventory preservation", () => {
  it("copies product instructions into a purchase-lot form", () => {
    const form = createFormDataForLot({
      product: {
        id: "p1",
        name: "Vitamin C",
        price: 100,
        usageInstructions: "• Liều mỗi lần: 1 viên",
      },
      lot: {
        id: "l1",
        cost: 50,
        quantity: 1,
        warehouse: "vn",
        shipping: { method: "vn", feeVnd: 0 },
      },
      settings: { exchangeRate: 170 },
    });

    expect(form.usageInstructions).toBe("• Liều mỗi lần: 1 viên");
  });

  it("normalizes a blank instruction to null when saving a product", () => {
    const next = buildNextProductFromForm({
      formData: {
        name: "Vitamin C",
        category: "Thực phẩm",
        price: 100,
        cost: 0,
        quantity: 0,
        warehouse: "vn",
        shippingMethod: "vn",
        usageInstructions: "   ",
      },
      editingProduct: {
        id: "p1",
        purchaseLots: [],
        stockByWarehouse: { vn: 0 },
      },
      editingLotId: null,
      settings: { exchangeRate: 170 },
    });

    expect(next.usageInstructions).toBeNull();
  });
});
```

- [ ] **Step 6: Run preservation tests and verify RED**

Run: `npm test -- src/utils/inventory/inventorySaveUtils.test.js`

Expected: FAIL because the lot form omits the instruction and save logic uses an empty string.

- [ ] **Step 7: Preserve and normalize the field at all product boundaries**

Import the helpers into inventory form/save utilities and `purchaseUtils.js`.
Set new forms to `null`, map existing and lot forms with
`normalizeUsageInstructions`, and save with `normalizeUsageInstructions`.
Update `normalizePurchaseLots` to return
`normalizeProductUsageInstructions(normalizedProduct)`.

- [ ] **Step 8: Add the IndexedDB record migration**

Increment `DB_VERSION` from `4` to `5`. In `onupgradeneeded`, when
`event.oldVersion < 5`, open a cursor on the products store and update each
record with:

```js
const normalized = normalizeProductUsageInstructions(cursor.value);
cursor.update(normalized);
cursor.continue();
```

This mutates only product records during the version upgrade.

- [ ] **Step 9: Run Task 1 tests**

Run:

```bash
npm test -- src/utils/inventory/usageInstructions.test.js src/utils/inventory/inventorySaveUtils.test.js
```

Expected: PASS.

### Task 2: Structured Gemini and Tavily Service

**Files:**
- Create: `src/services/productUsageInstructionsService.js`
- Create: `src/services/productUsageInstructionsService.test.js`
- Modify: `src/services/aiAssistantService.js`
- Modify: `src/services/ai/config.js`

**Interfaces:**
- Consumes: `callGeminiAPI(model, history, systemInstruction, temperature)`
- Consumes: `searchWeb(query, location, searchDepth, maxResults)`
- Consumes: `normalizeUsageInstructions(value)`
- Produces: `parseJsonObject(content): object | null`
- Produces: `formatUsageInstructions(fields): string | null`
- Produces: `resolveProductUsageInstructions(product, dependencies?): Promise<string | null>`

- [ ] **Step 1: Write failing parser and formatter tests**

```js
it("parses fenced Gemini JSON", () => {
  expect(parseJsonObject("```json\n{\"isMedicineOrSupplement\":true}\n```"))
    .toEqual({ isMedicineOrSupplement: true });
});

it("creates the exact four-line Vietnamese format", () => {
  expect(formatUsageInstructions({
    timing: "Sau bữa sáng",
    dose: "1 viên",
    frequency: "2 lần mỗi ngày",
    note: "Không tự tăng liều",
  })).toBe([
    "• Thời điểm dùng: Sau bữa sáng",
    "• Liều mỗi lần: 1 viên",
    "• Số lần dùng: 2 lần mỗi ngày",
    "• Lưu ý: Không tự tăng liều",
  ].join("\n"));
});

it("rejects incomplete dosage data", () => {
  expect(formatUsageInstructions({
    timing: "Sau bữa sáng",
    dose: "",
    frequency: "2 lần mỗi ngày",
  })).toBeNull();
});
```

- [ ] **Step 2: Run service tests and verify RED**

Run: `npm test -- src/services/productUsageInstructionsService.test.js`

Expected: FAIL because the service module does not exist.

- [ ] **Step 3: Implement defensive JSON parsing and deterministic formatting**

Implement brace extraction for fenced/unfenced responses and require trimmed
`timing`, `dose`, and `frequency`. Default a missing note to:
`Đọc kỹ hướng dẫn trên bao bì; không tự tăng liều`.

- [ ] **Step 4: Write failing orchestration tests**

Use injected `callGemini`, `search`, and `modelNames` dependencies:

```js
it("skips every dependency when instructions already exist", async () => {
  const calls = [];
  const result = await resolveProductUsageInstructions(
    { name: "Vitamin C", usageInstructions: "  Nội dung thủ công  " },
    {
      callGemini: async () => calls.push("gemini"),
      search: async () => calls.push("search"),
      modelNames: ["gemini-test"],
    },
  );

  expect(result).toBe("Nội dung thủ công");
  expect(calls).toEqual([]);
});

it("does not search when classification is negative", async () => {
  const calls = [];
  const result = await resolveProductUsageInstructions(
    { name: "Áo khoác", category: "Quần áo", usageInstructions: null },
    {
      callGemini: async () => {
        calls.push("classify");
        return { content: "{\"isMedicineOrSupplement\":false}" };
      },
      search: async () => calls.push("search"),
      modelNames: ["gemini-test"],
    },
  );

  expect(result).toBeNull();
  expect(calls).toEqual(["classify"]);
});

it("always searches before synthesis for a positive classification", async () => {
  const calls = [];
  const responses = [
    { content: "{\"isMedicineOrSupplement\":true}" },
    {
      content:
        "{\"timing\":\"Sau ăn\",\"dose\":\"1 viên\",\"frequency\":\"2 lần mỗi ngày\",\"note\":\"Không tự tăng liều\"}",
    },
  ];

  const result = await resolveProductUsageInstructions(
    { name: "Vitamin C", category: "Thực phẩm", usageInstructions: null },
    {
      callGemini: async () => {
        calls.push("gemini");
        return responses.shift();
      },
      search: async () => {
        calls.push("search");
        return "[Nguồn: nhãn sản phẩm]";
      },
      modelNames: ["gemini-test"],
    },
  );

  expect(calls).toEqual(["gemini", "search", "gemini"]);
  expect(result).toContain("• Liều mỗi lần: 1 viên");
});
```

- [ ] **Step 5: Run orchestration tests and verify RED**

Run: `npm test -- src/services/productUsageInstructionsService.test.js`

Expected: parser tests may pass, orchestration tests FAIL until the workflow is
implemented.

- [ ] **Step 6: Implement Gemini failover, classification, search, and synthesis**

Filter the existing fast-mode candidates to Gemini providers, try configured
models in order, and make Tavily mandatory after a positive classification.
Return `null` on any exhausted-model, search, parse, or incomplete-data error.
Prompts must interpolate the actual product name/category and require strict
JSON.

- [ ] **Step 7: Remove the incomplete function from the general assistant**

Delete the uncommitted `generateUsageInstructions` implementation and its
direct Tavily dependency from `aiAssistantService.js`. Product instruction
logic now lives only in `productUsageInstructionsService.js`.

- [ ] **Step 8: Run Task 2 tests**

Run: `npm test -- src/services/productUsageInstructionsService.test.js`

Expected: PASS.

### Task 3: Product Create, Edit Auto-save, and Manual Editing

**Files:**
- Create: `src/components/inventory/ProductUsageInstructionsField.jsx`
- Modify: `src/hooks/inventory/useInventoryLogic.js`
- Modify: `src/screens/Inventory.jsx`
- Modify: `src/components/inventory/ProductModal.jsx`
- Modify: `src/components/inventory/ProductIdentityForm.jsx`
- Modify: `src/components/inventory/ProductBasicInfoModal.jsx`
- Modify: `src/components/inventory/ProductDetailModal.jsx`

**Interfaces:**
- Consumes: `resolveProductUsageInstructions(product): Promise<string | null>`
- Consumes: `normalizeUsageInstructions(value): string | null`
- Produces: `onUsageInstructionsGenerated({ productId, name, category, usageInstructions })`
- Produces: `isGeneratingUsageInstructions: boolean`

- [ ] **Step 1: Add create-save behavior around tested service boundaries**

Make `handleSave` asynchronous. Keep validation first. Only for a truly new
product, call `resolveProductUsageInstructions` with the validated form
snapshot. Use the returned value in `buildNextProductFromForm`, update products
with a functional state setter, and reset loading in `finally`.

```js
const generatedInstructions = editingProduct
  ? normalizeUsageInstructions(formData.usageInstructions)
  : await resolveProductUsageInstructions({
      name: formData.name,
      category: formData.category,
      usageInstructions: formData.usageInstructions,
    });
```

- [ ] **Step 2: Add a shared controlled field**

Create `ProductUsageInstructionsField` with controlled `value`, `onChange`,
`readOnly`, loading/helper text, and the existing rose input styling. Render it
in the new-product modal and basic-information editor. Remove usage-instruction
responsibility from `ProductIdentityForm`.

- [ ] **Step 3: Implement edit-time generation and auto-save**

In `ProductBasicInfoModal`, start one request per open product identity when the
field is `null`. Guard the response with an active-request flag plus the
captured product id/name/category. Apply it only when the current local field is
still empty, update the initial snapshot, and call
`onUsageInstructionsGenerated`.

- [ ] **Step 4: Patch global product state without overwriting**

In `Inventory.jsx`, implement the callback using a functional product update.
Patch only when id/name/category still match and the persisted instruction is
still empty:

```js
setProducts((currentProducts) =>
  currentProducts.map((currentProduct) =>
    currentProduct.id === productId &&
    currentProduct.name === name &&
    currentProduct.category === category &&
    !hasUsageInstructions(currentProduct.usageInstructions)
      ? { ...currentProduct, usageInstructions }
      : currentProduct,
  ),
);
```

- [ ] **Step 5: Normalize manual saves and update loading UX**

Manual basic-info Save writes `normalizeUsageInstructions`. Disable duplicate
new-product Save actions and render loading text:
`AI đang tra cứu hướng dẫn sử dụng…`.

- [ ] **Step 6: Run targeted tests and lint changed components**

Run:

```bash
npm test -- src/utils/inventory/usageInstructions.test.js src/utils/inventory/inventorySaveUtils.test.js src/services/productUsageInstructionsService.test.js
npm run lint
```

Expected: tests PASS and ESLint exits 0.

### Task 4: Eligible Order Selector and A4 PDF

**Files:**
- Create: `src/utils/file/usageInstructionsExport.js`
- Create: `src/utils/file/usageInstructionsExport.test.js`
- Create: `src/utils/file/usageInstructionsPdf.js`
- Create: `src/utils/file/usageInstructionsPdf.test.js`
- Modify: `src/utils/file/fileUtils.js`
- Modify: `src/utils/file/invoiceTemplates.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `getOrderUsageInstructionItems(order, products): Array`
- Produces: `buildUsageInstructionsExportData(order, products, exportedAt?): object | null`
- Produces: `paginateByHeight(items, getHeight, maxHeight): Array<Array>`
- Produces: `generateUsageInstructionsPdf(exportData): Promise<Blob>`
- Produces: `exportUsageInstructionsToPdf(order, products): Promise<boolean>`

- [ ] **Step 1: Write failing selector tests**

```js
it("keeps only order products with non-empty instructions", () => {
  const result = buildUsageInstructionsExportData(
    {
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 1 },
      ],
    },
    [
      {
        id: "p1",
        name: "Vitamin C",
        image: "data:image/png;base64,a",
        usageInstructions: "• Liều mỗi lần: 1 viên",
      },
      { id: "p2", name: "Áo khoác", usageInstructions: null },
    ],
    new Date("2026-07-27T00:00:00+09:00"),
  );

  expect(result.items).toEqual([
    {
      key: "p1",
      productId: "p1",
      name: "Vitamin C",
      image: "data:image/png;base64,a",
      usageInstructions: "• Liều mỗi lần: 1 viên",
    },
  ]);
  expect(result.fileName).toBe("Phieu_HDSD_2026-07-27.pdf");
});
```

- [ ] **Step 2: Run selector tests and verify RED**

Run: `npm test -- src/utils/file/usageInstructionsExport.test.js`

Expected: FAIL because the selector module does not exist.

- [ ] **Step 3: Implement order matching, filtering, de-duplication, and filename**

Map products by id, visit order items in order, keep each eligible product once,
and format the filename from local date components rather than UTC.

- [ ] **Step 4: Write failing height-pagination tests**

```js
it("starts a new page before an item would exceed available height", () => {
  const items = [
    { id: "a", height: 400 },
    { id: "b", height: 500 },
    { id: "c", height: 300 },
  ];

  expect(paginateByHeight(items, (item) => item.height, 900)).toEqual([
    [items[0], items[1]],
    [items[2]],
  ]);
});

it("places an oversized item alone without dropping it", () => {
  const oversized = { id: "a", height: 1200 };
  expect(paginateByHeight([oversized], (item) => item.height, 900)).toEqual([
    [oversized],
  ]);
});
```

- [ ] **Step 5: Run PDF utility tests and verify RED**

Run: `npm test -- src/utils/file/usageInstructionsPdf.test.js`

Expected: FAIL because the PDF utility does not exist.

- [ ] **Step 6: Implement pure pagination and A4 canvas rendering**

Use a 1240x1754 white canvas per page. Render the Tiny Shop logo, export date,
and non-splitting product cards. Safely load product images and use a
placeholder on error. Wrap Vietnamese text using Canvas 2D measurements.

- [ ] **Step 7: Add jsPDF and generate a real PDF Blob**

Run: `npm install jspdf`

Inside `generateUsageInstructionsPdf`, use:

```js
const { jsPDF } = await import("jspdf");
const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
```

Add each rendered page image at `0, 0, 210, 297` millimetres and return
`pdf.output("blob")`.

- [ ] **Step 8: Replace the incomplete HTML export**

Remove `generateUsageInstructionsHTMLContent` from `invoiceTemplates.js` and
replace `exportUsageInstructionsToHTML` in `fileUtils.js` with the selector,
PDF generator, and `application/pdf` share flow.

- [ ] **Step 9: Run Task 4 tests**

Run:

```bash
npm test -- src/utils/file/usageInstructionsExport.test.js src/utils/file/usageInstructionsPdf.test.js
```

Expected: PASS.

### Task 5: Order UI, Full Verification, and Integration

**Files:**
- Modify: `src/components/orders/OrderDetailModal.jsx`
- Modify: all files required by fixes discovered during verification

**Interfaces:**
- Consumes: `getOrderUsageInstructionItems(order, products)`
- Consumes: `exportUsageInstructionsToPdf(order, products)`

- [ ] **Step 1: Update the order-detail footer**

Keep the existing export controls in a three-column row. Compute eligible count
with `useMemo`. When count is positive, render a full-width button above Close:

```text
Xuất phiếu HDSD (N SP)
```

Use PDF-specific loading text and remove the permanent fourth-column HDSD
button.

- [ ] **Step 2: Run the complete automated verification**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0; Vite may retain only its pre-existing chunk-size
warning.

- [ ] **Step 3: Browser-test the user-visible flows**

Start Vite and verify at desktop and iPhone-sized viewports:

- Existing instructions skip generation.
- New manual instructions remain unchanged.
- Edit-time generation shows loading and auto-saves.
- Generated instructions remain editable.
- Orders without eligible items have no PDF action.
- Orders with eligible items show the full-width count action.
- PDF export creates a `.pdf` file with A4 pages and required content only.
- Existing K80, A4 HTML, and image exports remain available.

- [ ] **Step 4: Review the final diff against every acceptance criterion**

Confirm field nullability, mandatory web search, no overwrite, stale-response
guards, real PDF MIME/extension, button placement, no order id in the PDF, and
preservation through lot editing and backups.

- [ ] **Step 5: Commit the feature branch**

```bash
git add package.json package-lock.json src docs/superpowers/plans/2026-07-27-product-usage-instructions-pdf.md
git commit -m "feat: add AI product usage instruction PDFs"
```

- [ ] **Step 6: Merge into main and verify again**

```bash
git switch main
git merge --no-ff codex/product-usage-instructions-pdf
npm test
npm run lint
npm run build
```

Expected: merge succeeds and all verification commands exit 0 on `main`.
