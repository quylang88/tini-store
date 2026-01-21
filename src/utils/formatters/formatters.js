export const formatNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }
  return number.toLocaleString("en-US");
};

export const formatInputNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "";
  }
  return number.toLocaleString("en-US");
};

export const sanitizeNumberInput = (value) => value.replace(/[^\d]/g, "");

export const sanitizeDecimalInput = (value) => {
  const normalized = value.replace(/,/g, ".");
  const sanitized = normalized.replace(/[^\d.]/g, "");
  const [whole, ...rest] = sanitized.split(".");
  if (rest.length === 0) {
    return sanitized;
  }
  return `${whole}.${rest.join("")}`;
};

// Hàm chuẩn hóa chuỗi để so sánh (bỏ dấu, chuyển thường)
export const normalizeString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};
