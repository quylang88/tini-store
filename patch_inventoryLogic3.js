import fs from 'fs';

function modifyInventoryLogic() {
  let content = fs.readFileSync('src/hooks/inventory/useInventoryLogic.js', 'utf8');

  // Add generateUsageInstructions to imports if not exists
  if (!content.includes('generateUsageInstructions')) {
    content = content.replace('import useHighlightFields from "../ui/useHighlightFields";', 'import useHighlightFields from "../ui/useHighlightFields";\nimport { generateUsageInstructions } from "../../services/aiAssistantService";');
  }

  const handleSelectExistingProduct = `
  const handleSelectExistingProduct = useCallback(
    (product) => {
      setEditingProduct(product);
      setEditingLotId(null);
      const nextFormData = createFormDataForProduct({ product, settings });
      setFormData(nextFormData);

      if (!nextFormData.usageInstructions && nextFormData.name) {
        generateUsageInstructions(nextFormData.name, nextFormData.category).then(instructions => {
          if (instructions) {
            setFormData(prev => ({ ...prev, usageInstructions: instructions }));
          }
        });
      }
    },
    [setFormData, settings],
  );
`;
  content = content.replace(/const handleSelectExistingProduct = useCallback\(\s*\(product\) => \{[\s\S]*?\[setFormData, settings\],\s*\);/, handleSelectExistingProduct);

  fs.writeFileSync('src/hooks/inventory/useInventoryLogic.js', content, 'utf8');
}

modifyInventoryLogic();
