import fs from 'fs';

function modifyProductModal() {
  let content = fs.readFileSync('src/components/inventory/ProductModal.jsx', 'utf8');
  content = content.replace('name={formData.name}', 'name={formData.name}\n          usageInstructions={formData.usageInstructions}');
  content = content.replace('onNameChange={(val) => setFormData({ ...formData, name: val })}', 'onNameChange={(val) => setFormData({ ...formData, name: val })}\n          onUsageInstructionsChange={(val) => setFormData({ ...formData, usageInstructions: val })}');
  fs.writeFileSync('src/components/inventory/ProductModal.jsx', content, 'utf8');
}

modifyProductModal();
