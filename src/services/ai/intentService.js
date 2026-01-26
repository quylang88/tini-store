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
  "so sánh",
  "giá nhập",
  "giá sỉ",
  "shopee",
  "lazada",
  "amazon",
  "rakuten",
  "cosme",
  "rẻ",
  "tốt",
  "trend",
  // Force Search Triggers
  "bên nhật",
  "tại nhật",
  "web nhật",
  "nguồn hàng",
  "giá yên",
  "check giá",
  "review",
  "đánh giá",
];

/**
 * Phân loại ý định dựa trên từ khóa (Rule-based) - SIÊU NHANH
 */
const detectIntentByKeywords = (query) => {
  const lowerQuery = query.toLowerCase();

  // Kiểm tra Import
  if (IMPORT_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    return "IMPORT";
  }

  // Kiểm tra Export
  if (EXPORT_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    return "EXPORT";
  }

  // Kiểm tra Search
  if (SEARCH_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    return "SEARCH";
  }

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
    - IMPORT: User wants to add stock, restock products (e.g. "nhập 5 cái", "thêm hàng").
    - EXPORT: User wants to sell, create order, ship items (e.g. "bán 2 cái", "lên đơn cho khách").
    - SEARCH: User asks for external info, price comparison, web search, market trends (e.g. "giá iphone", "tìm hiểu về...").
    - CHAT: General conversation, greetings, or asking about CURRENT STOCK in local inventory (e.g. "kho còn áo A không?", "chào em").

    OUTPUT FORMAT: Return ONLY the category name (IMPORT, EXPORT, SEARCH, or CHAT). Do not explain.
  `;

  const history = [{ role: "user", content: query }];

  try {
    const response = await callGroqAPI(fastModel, history, systemPrompt, 0.1);
    const intent = response.content.trim().toUpperCase();

    // Validate output
    if (["IMPORT", "EXPORT", "SEARCH", "CHAT"].includes(intent)) {
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
  if (keywordIntent) {
    console.log(`Intent detected by Keyword: ${keywordIntent}`);
    return keywordIntent;
  }

  // 2. Nếu không khớp keyword, dùng AI Router (Low latency)
  // Chỉ dùng khi query đủ dài (> 3 từ) để tránh spam, nếu quá ngắn -> Chat
  if (query.trim().split(/\s+/).length < 4) {
    return "CHAT";
  }

  const aiIntent = await detectIntentByAI(query);
  console.log(`Intent detected by AI Router: ${aiIntent}`);
  return aiIntent;
};
