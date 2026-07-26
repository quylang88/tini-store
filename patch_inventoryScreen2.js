import fs from 'fs';

function modifyInventoryScreen() {
  let content = fs.readFileSync('src/screens/Inventory.jsx', 'utf8');

  // Trigger when selecting existing product in modal
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
    [setFormData, settings, setEditingProduct, setEditingLotId],
  );
`;
  content = content.replace(/const handleSelectExistingProduct = useCallback\(\s*\(product\) => \{[\s\S]*?\[setFormData, settings, setEditingProduct, setEditingLotId\],\s*\);/, handleSelectExistingProduct);
  fs.writeFileSync('src/screens/Inventory.jsx', content, 'utf8');
}

modifyInventoryScreen();
