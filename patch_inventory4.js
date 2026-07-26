import fs from 'fs';

function modifyProductBasicInfoModal() {
  let content = fs.readFileSync('src/components/inventory/ProductBasicInfoModal.jsx', 'utf8');
  content = content.replace('note: product?.note || "",', 'note: product?.note || "",\n  usageInstructions: product?.usageInstructions || "",');
  content = content.replace('initial.note !== current.note', 'initial.note !== current.note ||\n      initial.usageInstructions !== current.usageInstructions');

  const usageInstructionsField = `
        {/* Hướng dẫn sử dụng */}
        <div>
          <label className="text-xs font-bold text-rose-700 uppercase">
            Hướng dẫn sử dụng (Tự động bởi AI)
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-rose-400 text-gray-900 text-sm mt-1 resize-none overflow-y-auto"
            style={{ maxHeight: "160px", minHeight: "80px" }}
            value={formData.usageInstructions || ""}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, usageInstructions: e.target.value }));
              e.target.style.height = "auto";
              e.target.style.height = \`\${e.target.scrollHeight}px\`;
            }}
            placeholder="Hướng dẫn sử dụng..."
          />
        </div>
`;

  content = content.replace('{/* Nhập ghi chú */}', usageInstructionsField + '\n        {/* Nhập ghi chú */}');

  fs.writeFileSync('src/components/inventory/ProductBasicInfoModal.jsx', content, 'utf8');
}

modifyProductBasicInfoModal();
