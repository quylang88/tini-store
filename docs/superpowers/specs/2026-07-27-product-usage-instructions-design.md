# Product Usage Instructions and A4 PDF Design

## Context

Tiny Shop is a React 19 and Vite PWA. Product, order, and settings data are
stored locally in IndexedDB. Product records are schemaless JavaScript objects,
so the requested SQL-style nullable `VARCHAR` field is represented as a
nullable string property:

```js
usageInstructions: string | null
```

The app already calls Gemini for AI tasks, Tavily for web search, and uses the
Web Share API to hand generated files to iPhone's share sheet.

The current uncommitted implementation is incomplete: it saves empty strings
instead of `null`, does not invoke AI when a new product is saved, skips web
search when the initial Gemini response includes instructions, does not include
instructions in order export data, and exports HTML rather than a PDF.

## Goals

- Add a nullable `usageInstructions` string to every product record.
- Generate Vietnamese usage instructions only while that field is missing.
- Run generation when a new product is saved and when an existing product is
  opened for basic-information editing.
- Automatically persist instructions generated while editing, without
  requiring the user to press Save.
- Keep generated instructions editable by the user.
- Use Gemini for classification and synthesis, and always use the existing
  Tavily web search between those two steps for products classified as
  medicine or supplements.
- Produce a consistent bullet format for every generated instruction.
- Export eligible products from an order to a real A4 PDF that can be saved
  through the iPhone share sheet.

## Non-goals

- Adding a server, database service, authentication change, or background job.
- Generating instructions in bulk for the full inventory.
- Replacing or regenerating non-empty instructions.
- Adding order identifiers, customer details, prices, or quantities to the
  usage-instruction PDF.
- Treating AI output as a substitute for the product label or professional
  medical advice.

## Data Model and Migration

`usageInstructions` has two valid persisted states:

- `null`: no instruction exists, so automatic generation is allowed.
- A trimmed non-empty string: instructions exist, so automatic generation is
  forbidden.

Empty and whitespace-only strings are normalized to `null`. New product forms
start with `null`. A versioned IndexedDB migration updates existing product
records that do not have the property or contain an empty value. Product
normalization also applies the same rule to restored backups, so older backup
files remain compatible.

Editing a purchase lot or adding a restock must preserve the parent product's
existing `usageInstructions` value.

## AI Service

Usage-instruction generation is isolated from the general assistant chat flow
in a focused service. It accepts a product name and category and returns either
a standardized string or `null`.

### Step 1: Classification

The service calls an environment-configured Gemini Flash model already used by
the app. It requests strict JSON:

```json
{
  "isMedicineOrSupplement": true
}
```

If the product is not medicine or a supplement, the service returns `null`
without making a web request.

### Step 2: Web Search

For a positive classification, the service always calls Tavily with the
product name, category, and Vietnamese dosage and usage terms. Search failure
or an empty result leaves the field as `null`; the service must not fabricate
dosage.

### Step 3: Grounded Synthesis

Gemini receives the Tavily search results and returns strict JSON containing
the four display fields:

```json
{
  "timing": "Sau bữa sáng và tối",
  "dose": "1 viên mỗi lần",
  "frequency": "2 lần mỗi ngày",
  "note": "Đọc kỹ hướng dẫn trên bao bì; không tự tăng liều"
}
```

The service parses fenced or unfenced JSON defensively. It returns `null` when
the required timing, dose, or frequency value is absent. The final stored text
is formatted by application code rather than copied as free-form AI output:

```text
• Thời điểm dùng: Sau bữa sáng và tối
• Liều mỗi lần: 1 viên mỗi lần
• Số lần dùng: 2 lần mỗi ngày
• Lưu ý: Đọc kỹ hướng dẫn trên bao bì; không tự tăng liều
```

The configured Gemini model list is used instead of hard-coding a deprecated
model name. Failed Gemini candidates fall through to the next configured
Gemini candidate.

## Product Workflows

### Create Product

1. The existing synchronous product validation runs first.
2. If the user has entered a non-empty instruction manually, AI is skipped.
3. Otherwise the Save action enters a generating state and calls the AI
   service.
4. A valid result is included in the new product record; a failed or
   non-medicine result leaves the property as `null`.
5. The product is saved exactly once.

AI or network failure must not prevent product creation. The modal disables
duplicate Save actions while generation is running and shows an explicit
Vietnamese loading message.

### Edit Product

1. Opening the basic-information editor checks the normalized field.
2. A non-empty field skips AI entirely.
3. A `null` field starts generation and shows an in-field loading state.
4. The generated result is applied only if the modal still represents the same
   product name and category and the local field is still empty.
5. The result is immediately patched into the global products state, which
   causes the existing IndexedDB persistence hook to save it.
6. The generated change is incorporated into the form's initial snapshot, so
   closing the modal does not report an unsaved change solely because AI filled
   the field.
7. After generation completes, the textarea remains editable. A manual edit is
   normalized and saved through the existing Save action.

Closing the editor or changing identity data before the request completes
invalidates the result. A stale response cannot update another product or
overwrite user-entered text.

### Restock and Purchase-lot Editing

These flows never initiate generation. Their form mapping carries the current
product instruction through unchanged so saving inventory data cannot erase
it.

## Order Export Data

Order items are matched to current products using the existing product map.
The export-specific selector:

- copies product image, display name, and normalized usage instructions;
- removes items whose instructions are `null`;
- merges duplicate order entries without losing the instruction;
- exposes the eligible item count to the order detail UI.

If no eligible item exists, no PDF export action is rendered.

## PDF Generation

The PDF is generated fully in the browser:

1. Render one or more fixed A4 portrait canvases.
2. Draw the Tiny Shop logo and Vietnamese export date in the header.
3. Draw a card for each eligible item with product image, product name, and
   the standardized instruction text.
4. Estimate card height from wrapped text and paginate without splitting a
   product card across pages.
5. Dynamically import `jsPDF` only when the user requests this export.
6. Add each A4 canvas as a PDF page and return a PDF `Blob`.
7. Share the file through the existing `shareOrDownloadFile` helper with MIME
   type `application/pdf`.

Rasterizing the already-rendered Vietnamese text into each PDF page avoids
font-embedding failures on iPhone while keeping the generated file visually
consistent. The filename is:

```text
Phieu_HDSD_YYYY-MM-DD.pdf
```

The document contains no order code, customer data, prices, quantities, or
marketing footer.

## User Interface

### Product Editor

- Label: `Hướng dẫn sử dụng`
- Loading text: `AI đang tra cứu hướng dẫn sử dụng…`
- Helper text after generation: `AI đã tạo và tự lưu. Bạn có thể chỉnh sửa.`
- The textarea is temporarily read-only during generation and becomes editable
  afterward.

### Order Detail

The current compact export row remains three columns:

- `K80`
- `A4`
- `Ảnh`

When at least one product has instructions, a separate full-width action is
shown below that row and above Close:

```text
Xuất phiếu HDSD (N SP)
```

This placement avoids a cramped four-column footer on iPhone and distinguishes
the instruction sheet from invoice formats.

## Error Handling

- Gemini, Tavily, parsing, or synthesis failure returns `null`.
- Product creation proceeds when generation fails.
- Editing leaves the field eligible for retry on the next open when generation
  fails.
- Existing or manually entered text is never overwritten.
- Stale asynchronous responses are ignored.
- PDF generation errors use the order detail's existing error handling; the PDF
  generator does not call `alert`.
- Unsafe or unsupported product images fall back to an image placeholder.

## Testing

Automated tests cover:

- Normalizing missing, empty, and non-empty instruction values.
- Parsing Gemini JSON with and without Markdown fences.
- Rejecting incomplete synthesis data.
- Producing the exact four-line bullet format.
- Skipping Tavily for a negative classification.
- Always calling Tavily for a positive classification.
- Returning `null` when search evidence is unavailable.
- Preserving existing instructions and bypassing all AI work.
- Preserving instructions during restock and lot editing.
- Mapping and filtering eligible order products.
- Estimating item heights and paginating without splitting cards.
- Producing the correct PDF filename and MIME type.

Verification includes the full Vitest suite, ESLint, a production Vite build,
and browser testing of the create, edit, manual-edit, conditional export-button,
and iPhone-sized order-detail flows.

## Acceptance Criteria

- Every persisted product has `usageInstructions` as `null` or a trimmed
  non-empty string.
- AI never runs for a product with existing instructions.
- Positive medicine/supplement classification always triggers web search before
  synthesis.
- New-product generation occurs only after validation and as part of Save.
- Edit generation automatically persists without requiring Save.
- Manual edits remain possible and take precedence over pending AI results.
- Every generated instruction uses the same four bullet labels.
- Eligible order products export to a valid A4 PDF with logo, date, image, name,
  and instructions only.
- The iPhone share sheet receives a `.pdf` file with
  `application/pdf`.
- Existing inventory, restock, order, invoice, image-export, backup, and restore
  behavior remains intact.
