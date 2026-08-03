import {
  normalizeVietnameseUsageInstructionsValue,
} from "./usageInstructionsClipboard";

export const normalizeUsageInstructions = (value) => {
  if (typeof value !== "string") return null;

  const textContent = value.replace(/<[^>]*>/g, "").trim();
  if (!textContent) return null;

  const normalized = normalizeVietnameseUsageInstructionsValue(value.trim());
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
