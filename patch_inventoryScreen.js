import fs from 'fs';

function modifyInventoryScreen() {
  let content = fs.readFileSync('src/screens/Inventory.jsx', 'utf8');

  if (!content.includes('generateUsageInstructions')) {
    content = content.replace('import ProductBasicInfoModal from "../components/inventory/ProductBasicInfoModal";', 'import ProductBasicInfoModal from "../components/inventory/ProductBasicInfoModal";\nimport { generateUsageInstructions } from "../services/aiAssistantService";');
  }

  const setEditingBasicInfo = `
              setEditingBasicInfoProduct(product);
              if (!product.usageInstructions && product.name) {
                generateUsageInstructions(product.name, product.category).then(instructions => {
                  if (instructions) {
                    setEditingBasicInfoProduct(prev => ({ ...prev, usageInstructions: instructions }));
                  }
                });
              }
`;

  content = content.replace('onEditBasicInfo={setEditingBasicInfoProduct}', 'onEditBasicInfo={(product) => {\n' + setEditingBasicInfo + '\n            }}');
  fs.writeFileSync('src/screens/Inventory.jsx', content, 'utf8');
}

modifyInventoryScreen();
