import fs from 'fs';

function modifyInventoryLogic() {
  let content = fs.readFileSync('src/hooks/inventory/useInventoryLogic.js', 'utf8');

  // Trigger when opening modal for existing product
  const newOpenModal = `
  const openModal = useCallback(
    (product = null) => {
      if (product) {
        setEditingProduct(product);
        setEditingLotId(null);
        const nextFormData = createFormDataForProduct({ product, settings });
        setFormData(nextFormData);
        initialFormDataRef.current = nextFormData;
        setIsModalOpen(true);

        // Tự động fetch hướng dẫn sử dụng nếu thiếu
        if (!nextFormData.usageInstructions && nextFormData.name) {
          generateUsageInstructions(nextFormData.name, nextFormData.category).then(instructions => {
            if (instructions) {
              setFormData(prev => ({ ...prev, usageInstructions: instructions }));
            }
          });
        }
      } else {
        setEditingProduct(null);
        setEditingLotId(null);
        const nextFormData = createFormDataForNewProduct({
          settings,
          activeCategory,
        });
        setFormData(nextFormData);
        initialFormDataRef.current = nextFormData;
        setIsModalOpen(true);
      }
    },
    [settings, activeCategory, setFormData],
  );
`;

  content = content.replace(/const openModal = useCallback\(\s*\(product = null\) => \{[\s\S]*?\[settings, activeCategory, setFormData\],\s*\);/, newOpenModal);

  fs.writeFileSync('src/hooks/inventory/useInventoryLogic.js', content, 'utf8');
}

modifyInventoryLogic();
