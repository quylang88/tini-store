const SAFE_TOKEN_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const TOKEN_LENGTH = 4;
const AUTOMATIC_PRODUCT_CODE_PATTERN =
  /^[A-Z]{2}-[A-Z]{3}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

const normalizeWords = (value) => {
  const normalized = String(value || "")
    .replace(/[Đđ]/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  return normalized.match(/[A-Z]+/g) || [];
};

const buildCategorySegment = (category) => {
  const words = normalizeWords(category);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`;
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).padEnd(2, "X");
  }
  return "SP";
};

const buildNameSegment = (name) => {
  const words = normalizeWords(name);
  if (words.length >= 3) {
    return `${words[0][0]}${words[1][0]}${words[2][0]}`;
  }
  if (words.length === 2) {
    return `${words[0].slice(0, 2).padEnd(2, "X")}${words[1][0]}`;
  }
  if (words.length === 1) {
    return words[0].slice(0, 3).padEnd(3, "X");
  }
  return "XXX";
};

const hashString = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const buildToken = (seed) => {
  const base = SAFE_TOKEN_ALPHABET.length;
  const tokenSpace = base ** TOKEN_LENGTH;
  let value = hashString(seed) % tokenSpace;
  let token = "";

  for (let index = 0; index < TOKEN_LENGTH; index += 1) {
    token = SAFE_TOKEN_ALPHABET[value % base] + token;
    value = Math.floor(value / base);
  }

  return token;
};

export const generateProductCode = ({
  id,
  name,
  category,
  usedCodes = new Set(),
}) => {
  const prefix = `${buildCategorySegment(category)}-${buildNameSegment(name)}`;
  let attempt = 0;

  while (true) {
    const token = buildToken(`${String(id || "")}:${attempt}`);
    const code = `${prefix}-${token}`;
    if (!usedCodes.has(code)) {
      return code;
    }
    attempt += 1;
  }
};

export const isAutomaticProductCode = (value) =>
  AUTOMATIC_PRODUCT_CODE_PATTERN.test(String(value || ""));

export const migrateProductCodes = (
  products,
  { replaceAll = false } = {},
) => {
  if (!Array.isArray(products)) return products;

  const orderedProducts = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => product && typeof product === "object")
    .sort((left, right) => {
      const idOrder = String(left.product.id || "").localeCompare(
        String(right.product.id || ""),
      );
      return idOrder || left.index - right.index;
    });

  const usedCodes = new Set();
  const preservedIndexes = new Set();

  if (!replaceAll) {
    for (const { product, index } of orderedProducts) {
      if (
        isAutomaticProductCode(product.productCode) &&
        !usedCodes.has(product.productCode)
      ) {
        usedCodes.add(product.productCode);
        preservedIndexes.add(index);
      }
    }
  }

  const migratedByIndex = new Map();
  for (const { product, index } of orderedProducts) {
    if (preservedIndexes.has(index)) {
      migratedByIndex.set(index, product);
      continue;
    }

    const productCode = generateProductCode({
      id: product.id || `legacy-${index}`,
      name: product.name,
      category: product.category,
      usedCodes,
    });
    usedCodes.add(productCode);
    migratedByIndex.set(index, {
      ...product,
      productCode,
    });
  }

  return products.map(
    (product, index) => migratedByIndex.get(index) || product,
  );
};
