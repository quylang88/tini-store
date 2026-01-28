// Cached formatters to avoid re-creation overhead
const numberFormatterEn = new Intl.NumberFormat("en-US");
const numberFormatterVi = new Intl.NumberFormat("vi-VN");

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

export const formatNumber = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }
  return numberFormatterEn.format(number);
};

export const formatInputNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "";
  }
  return numberFormatterEn.format(number);
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
// Tối ưu hóa: Cache kết quả để tránh tính toán lại regex đắt đỏ,
// đặc biệt quan trọng khi lọc danh sách lớn (O(N) -> O(1) cho cache hits).
const normalizeCache = new Map();

export const normalizeString = (str) => {
  if (!str) return "";
  if (normalizeCache.has(str)) {
    return normalizeCache.get(str);
  }

  const normalized = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

  // Simple eviction policy: Clear cache if it grows too large (e.g., > 10000 entries)
  // This prevents memory leaks while covering typical inventory sizes, while avoiding thrashing for larger shops.
  if (normalizeCache.size > 10000) {
    normalizeCache.clear();
  }

  normalizeCache.set(str, normalized);
  return normalized;
};

// Common formatter for currency (VND)
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return "0₫";
  const number = Number(value);
  if (!Number.isFinite(number)) return "0₫";
  return numberFormatterVi.format(number) + "₫";
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  return dateTimeFormatter.format(date);
};
