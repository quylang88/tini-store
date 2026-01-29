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

// --- Vietnamese Number Reading Logic ---

const DIGITS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

export const readMoneyToVietnamese = (amount) => {
  if (!amount || isNaN(amount) || amount === 0) return "Không đồng";

  let number = Math.abs(Number(amount));
  let str = "";
  let i = 0;
  const suffixes = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

  while (number > 0) {
    const group = number % 1000;
    const remaining = Math.floor(number / 1000); // Số phần còn lại phía trước

    if (group > 0) {
      const u = group % 10;
      const t = Math.floor((group / 10) % 10);
      const h = Math.floor(group / 100);

      let groupStr = "";

      // Hàng trăm:
      // Đọc nếu:
      // 1. Có số ở hàng trăm (h > 0)
      // 2. Hoặc là nhóm này không phải nhóm cao nhất (remaining > 0) -> đọc "không trăm"
      if (h > 0 || remaining > 0) {
        groupStr += DIGITS[h] + " trăm";
      }

      // Hàng chục và đơn vị
      if (t === 0 && u === 0) {
        // Chẵn trăm -> không làm gì thêm
      } else {
        if (t === 0 && (h > 0 || remaining > 0)) {
          // Có hàng trăm (hoặc 'không trăm') mà hàng chục = 0 -> "lẻ"
          groupStr += " lẻ";
        }

        if (t === 1) {
          groupStr += " mười";
        } else if (t > 1) {
          groupStr += " " + DIGITS[t] + " mươi";
        }

        // Hàng đơn vị
        if (u > 0) {
          if (t > 1 && u === 1) {
            groupStr += " mốt";
          } else if (t > 0 && u === 5) {
            groupStr += " lăm";
          } else {
            // t=0 (lẻ ...), t=1 (mười ...) -> đọc bình thường
            groupStr += " " + DIGITS[u];
          }
        }
      }

      str = groupStr.trim() + " " + suffixes[i] + " " + str;
    }

    number = Math.floor(number / 1000);
    i++;
  }

  str = str.trim();
  // Capitalize first letter
  if (str.length > 0) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }

  return str + " đồng";
};
