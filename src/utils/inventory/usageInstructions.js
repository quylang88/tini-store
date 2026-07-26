export const normalizeUsageInstructions = (value) => {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized || null;
};

export const hasUsageInstructions = (value) =>
  normalizeUsageInstructions(value) !== null;

export const normalizeProductUsageInstructions = (product = {}) => {
  const usageInstructions = normalizeUsageInstructions(
    product.usageInstructions,
  );
  const hasProperty = Object.prototype.hasOwnProperty.call(
    product,
    "usageInstructions",
  );

  if (hasProperty && product.usageInstructions === usageInstructions) {
    return product;
  }

  return {
    ...product,
    usageInstructions,
  };
};

export const applyGeneratedUsageInstructions = (
  product = {},
  generatedUpdate = {},
) => {
  const usageInstructions = normalizeUsageInstructions(
    generatedUpdate.usageInstructions,
  );
  const identityMatches =
    product.id === generatedUpdate.productId &&
    product.name === generatedUpdate.name &&
    product.category === generatedUpdate.category;

  if (
    !identityMatches ||
    !usageInstructions ||
    hasUsageInstructions(product.usageInstructions)
  ) {
    return product;
  }

  return {
    ...product,
    usageInstructions,
  };
};
