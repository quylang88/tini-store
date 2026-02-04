/**
 * intentService.js
 * Dịch vụ phân loại ý định người dùng (Intent Classification)
 * Giúp chọn đúng System Prompt để tiết kiệm token.
 */

import { callGroqAPI } from "./providers";

// --- KEYWORDS CONFIGURATION ---

const IMPORT_KEYWORDS = [
  "nhập kho",
  "nhập hàng",
  "thêm sản phẩm",
  "thêm các sp",
  "restock",
  "nhập thêm",
];

const EXPORT_KEYWORDS = [
  "xuất kho",
  "lên đơn",
  "tạo đơn",
  "giao cho",
  "ship cho",
];

// Unified Search Keywords (Standard + Deep + Force Search)
const SEARCH_KEYWORDS = [
  // General Search Triggers
  "tìm",
  "trên mạng",
  "internet",
  "so sánh",
  "tại sao",
  "ở đâu",
  "tư vấn",
  "hợp lý",
  "có lời",
  "giá nhập",
  "giá sỉ",
  "rẻ",
  "tốt",
  "trend",
  "thị trường", // Added based on user feedback
  // Force Search Triggers
  "bên nhật",
  "tại nhật",
  "web nhật",
  "nguồn hàng",
  "review",
  "đánh giá",
];

// Local Business Data Keywords (Trigger LOCAL mode)
const LOCAL_KEYWORDS = [
  "tồn kho",
  "đơn hàng",
  "số lượng",
  "sản phẩm",
  "thuốc",
  "mỹ phẩm",
  "giá bán",
  "kho",
  "hàng",
  "bán",
  "mua",
  "khách hàng",
  "doanh thu",
  "lãi",
  "lời",
  "lỗ",
  "vốn",
  "thông tin",
  "shop",
  "cửa hàng",
];

/**
 * Helper to escape regex special characters
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Precompiled Regex for performance
 */
const buildRegex = (keywords) => {
  const pattern = keywords.map(escapeRegExp).join("|");
  return new RegExp(pattern, "i");
};

const LOCAL_REGEX = buildRegex(LOCAL_KEYWORDS);
const SEARCH_REGEX = buildRegex(SEARCH_KEYWORDS);
const IMPORT_REGEX = buildRegex(IMPORT_KEYWORDS);
const EXPORT_REGEX = buildRegex(EXPORT_KEYWORDS);

/**
 * Phân loại ý định dựa trên từ khóa (Rule-based) - SIÊU NHANH
 */
const detectIntentByKeywords = (query) => {
  const isLocal = LOCAL_REGEX.test(query);
  const isSearch = SEARCH_REGEX.test(query);
  const isImport = IMPORT_REGEX.test(query);
  const isExport = EXPORT_REGEX.test(query);

  // 1. Conflict Detection (Quan trọng nhất để fix lỗi nhận nhầm)
  // Nếu câu vừa có ý định Search (tìm, check, thị trường...)
  // VÀ vừa có ý định hành động (nhập, xuất, tồn kho...)
  // -> Khả năng cao là câu phức -> Trả về "AMBIGUOUS" để đẩy sang AI phân tích kỹ hơn (bất kể độ dài).
  if (isSearch && (isImport || isExport || isLocal)) {
    console.log(
      "Intent Ambiguity Detected (Search mixed with Action) -> Fallback to AI",
    );
    return "AMBIGUOUS";
  }

  // 2. Nếu không có mâu thuẫn, trả về theo thứ tự ưu tiên
  if (isLocal) return "LOCAL";
  if (isSearch) return "SEARCH";
  if (isImport) return "IMPORT";
  if (isExport) return "EXPORT";

  return null; // Không tìm thấy keyword
};

/**
 * Phân loại ý định bằng AI (LLM Router) - Dùng model nhỏ, nhanh
 */
const detectIntentByAI = async (query) => {
  const fastModel =
    import.meta.env.VITE_GROQ_MODEL_INSTANT || "llama-3-8b-8192";

  const systemPrompt = `
    You are a precise Intent Classifier for a shop assistant AI.
    Classify the following User Query into exactly one of these categories:

    - LOCAL: User asks about internal/local business info: stock, products, revenue, customers (e.g., "kho còn áo A không?", "hôm nay bán được bao nhiêu?", "check tồn kho").
    - SEARCH: User asks for external info, price comparison, web search, market trends OR asks for PRICING ADVICE (e.g., "giá iphone", "nhập về bán giá bao nhiêu thì hợp lý?", "tìm hiểu về...").
    - IMPORT: User EXPLICITLY commands to add stock/restock products (e.g., "nhập 5 cái", "thêm hàng", "tạo phiếu nhập"). WARNING: Questions like "if I import..." or "import price?" are SEARCH, not IMPORT.
    - EXPORT: User EXPLICITLY commands to sell/create order (e.g., "bán 2 cái", "lên đơn cho khách").
    - CHAT: Pure casual conversation, greetings, fun (e.g., "chào em", "em làm được gì", "kể chuyện vui").

    OUTPUT FORMAT: Return ONLY the category name (IMPORT, EXPORT, SEARCH, LOCAL, or CHAT). Do not explain.
  `;

  const history = [{ role: "user", content: query }];

  try {
    const response = await callGroqAPI(fastModel, history, systemPrompt, 0.1);
    const intent = response.content.trim().toUpperCase();

    // Validate output
    if (["LOCAL", "SEARCH", "IMPORT", "EXPORT", "CHAT"].includes(intent)) {
      return intent;
    }
    return "CHAT"; // Fallback
  } catch (error) {
    console.warn("Intent Router failed:", error);
    return "CHAT"; // Fallback an toàn
  }
};

/**
 * Main function: Detect Intent
 */
export const detectIntent = async (query) => {
  // 1. Thử check keyword trước (Zero latency)
  const keywordIntent = detectIntentByKeywords(query);

  // Nếu detect ra intent cụ thể (IMPORT, EXPORT...) -> Return luôn
  if (keywordIntent && keywordIntent !== "AMBIGUOUS") {
    console.log(`Intent detected by Keyword: ${keywordIntent}`);
    return keywordIntent;
  }

  // 2. Nếu không khớp keyword (null), hoặc mơ hồ (AMBIGUOUS) -> Chuẩn bị dùng AI Router
  const isAmbiguous = keywordIntent === "AMBIGUOUS";

  // Logic length check:
  // - Nếu là AMBIGUOUS: Bỏ qua check length (vì đã có keyword xịn, chắc chắn ko phải spam)
  // - Nếu là null (ko keyword): Check length < 4 -> CHAT (để tránh spam "hi", "alo")
  if (!isAmbiguous && query.trim().split(/\s+/).length < 4) {
    return "CHAT";
  }

  const aiIntent = await detectIntentByAI(query);
  console.log(`Intent detected by AI Router: ${aiIntent}`);
  return aiIntent;
};
