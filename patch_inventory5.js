import fs from 'fs';

function modifyProductIdentityForm() {
  let content = fs.readFileSync('src/components/inventory/ProductIdentityForm.jsx', 'utf8');

  // Add usageInstructions to props
  content = content.replace('name,', 'name,\n  usageInstructions,');
  content = content.replace('onNameChange,', 'onNameChange,\n  onUsageInstructionsChange,');

  const usageField = `
      {/* Hướng dẫn sử dụng (trong ProductModal chính) */}
      {onUsageInstructionsChange !== undefined && (
      <div>
        <label className="text-xs font-bold text-rose-700 uppercase">
          Hướng dẫn sử dụng (Tự động bởi AI)
        </label>
        <textarea
          className="w-full border-b border-gray-200 py-2 focus:border-rose-400 outline-none font-medium disabled:text-gray-500 text-sm resize-none"
          value={usageInstructions || ""}
          onChange={(e) => onUsageInstructionsChange(e.target.value)}
          placeholder={disabled ? "---" : "Hướng dẫn sử dụng..."}
          disabled={disabled}
          style={{ minHeight: "40px" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = \`\${e.target.scrollHeight}px\`;
          }}
        />
      </div>
      )}
`;

  content = content.replace('    </div>\n  );\n};\n\nexport default ProductIdentityForm;', usageField + '    </div>\n  );\n};\n\nexport default ProductIdentityForm;');

  fs.writeFileSync('src/components/inventory/ProductIdentityForm.jsx', content, 'utf8');
}

modifyProductIdentityForm();
