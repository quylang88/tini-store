/**
 * aiAssistantService.js
 * "Bộ não" xử lý logic cho Trợ lý Quản lý Tiny Shop.
 */

import {
  getModeConfig,
  PROVIDERS,
  STANDARD_MODE_SEARCH_TRIGGERS,
  FORCE_WEB_SEARCH_TRIGGERS,
} from "./ai/config";
import { callGeminiAPI, callGroqAPI, searchWeb } from "./ai/providers";
import { buildSystemPrompt, buildSummarizePrompt } from "./ai/prompts";
import {
  getCurrentLocation,
  createResponse,
  getAddressFromCoordinates,
} from "./ai/utils";

// --- CẤU HÌNH MEMORY ---
const SLIDING_WINDOW_SIZE = 8; // Tăng window để nhớ ngữ cảnh dài hơn khi phân tích

// --- THUẬT TOÁN SO SÁNH CHUỖI ---
const getBigrams = (str) => {
  const s = str.toLowerCase().replace(/[^\w\s\u00C0-\u1EF9]/g, "");
  const words = s.split(/\s+/).filter((w) => w.length > 0);
  return words;
};

const calculateSimilarity = (str1, str2) => {
  const words1 = getBigrams(str1);
  const words2 = getBigrams(str2);
  if (words1.length === 0 || words2.length === 0) return 0.0;
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  return (2.0 * intersection.size) / (set1.size + set2.size);
};

const checkDuplicateQuery = (currentQuery, lastQuery) => {
  if (!lastQuery) return false;
  if (currentQuery.trim().toLowerCase() === lastQuery.trim().toLowerCase())
    return true;
  const similarity = calculateSimilarity(currentQuery, lastQuery);
  const SIMILARITY_THRESHOLD = 0.85;
  if (similarity >= SIMILARITY_THRESHOLD) {
    const nums1 = currentQuery.match(/\d+/g) || [];
    const nums2 = lastQuery.match(/\d+/g) || [];
    if (nums1.join(",") !== nums2.join(",")) return false;
    return true;
  }
  return false;
};

// --- XỬ LÝ CHÍNH ---

export const processQuery = async (
  query,
  context,
  modeKey = "standard",
  history = [],
  currentSummary = "",
  onStatusUpdate = () => {},
) => {
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Mất kết nối mạng. Không thể check giá online được sếp ơi.",
    );
  }

  const modeConfig = getModeConfig(modeKey);

  // 1. Xác định vị trí (Quan trọng nếu muốn tìm cửa hàng đối thủ quanh đây)
  const coords = await getCurrentLocation();
  let locationName = null;
  let fullLocationInfo = coords || "Chưa rõ";
  if (coords) {
    locationName = await getAddressFromCoordinates(coords);
    if (locationName) fullLocationInfo = `${locationName} (${coords})`;
  }

  // 2. LOGIC TÌM KIẾM THÔNG MINH (SMART SOURCING SEARCH)
  const lowerQuery = query.toLowerCase();

  // Check trigger
  const isForceSearch = FORCE_WEB_SEARCH_TRIGGERS.some((kw) =>
    lowerQuery.includes(kw),
  );
  const isStandardSearchTrigger =
    modeKey === "standard" &&
    STANDARD_MODE_SEARCH_TRIGGERS.some((kw) => lowerQuery.includes(kw));
  const isDeepSearch = modeKey === "deep"; // Mode deep luôn search nếu query đủ dài

  const shouldSearch =
    isForceSearch ||
    isStandardSearchTrigger ||
    (isDeepSearch && query.length > 3);

  let searchResults = "";

  if (shouldSearch) {
    onStatusUpdate("Đang check giá & nguồn hàng...");

    // TỐI ƯU QUERY CHO SOURCING:
    // Nếu user hỏi về giá/nhập hàng, tự động thêm ngữ cảnh Nhật Bản để tìm chính xác hơn
    let searchQuery = query;
    if (lowerQuery.includes("giá") || lowerQuery.includes("nhập")) {
      // Nếu chưa có từ khóa Nhật, thêm vào để ưu tiên tìm nguồn gốc
      if (!lowerQuery.includes("nhật") && !lowerQuery.includes("japan")) {
        searchQuery += " price Japan Rakuten Amazon JP";
      }
    }

    const searchLocation = locationName || coords;

    try {
      const webData = await searchWeb(
        searchQuery,
        searchLocation,
        modeConfig.search_depth,
        modeConfig.max_results,
      );
      if (webData) searchResults = webData;
    } catch (err) {
      console.warn("Search failed:", err);
    }

    onStatusUpdate(null);
  }

  // 3. Xử lý Lịch sử & Check trùng
  const userMessages = history.filter(
    (msg) => msg.sender === "user" || msg.role === "user",
  );
  let isDuplicate = false;
  if (userMessages.length >= 2) {
    const previousUserMsg = userMessages[userMessages.length - 2];
    isDuplicate = checkDuplicateQuery(query, previousUserMsg.content);
  }

  const cleanHistory = history
    .filter(
      (msg) =>
        msg.type === "text" &&
        (msg.sender === "user" || msg.sender === "assistant"),
    )
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      content: msg.content,
    }));

  const recentHistory = cleanHistory.slice(-SLIDING_WINDOW_SIZE);

  // 4. Build System Prompt (Updated for Manager)
  const systemInstruction = buildSystemPrompt(
    { ...context, location: fullLocationInfo },
    searchResults,
    currentSummary,
    isDuplicate,
  );

  // 5. Gọi AI
  try {
    const responseText = await processQueryWithFailover(
      modeConfig.model,
      recentHistory,
      systemInstruction,
      modeConfig.temperature,
    );
    return createResponse("text", responseText);
  } catch (error) {
    console.error("AI Service Error:", error);
    return createResponse(
      "text",
      `Lỗi hệ thống: ${error.message}. Thử lại sau nhé sếp.`,
    );
  }
};

/**
 * Tóm tắt lịch sử (Giữ nguyên)
 */
export const summarizeChatHistory = async (
  currentSummary,
  messagesToSummarize,
) => {
  if (!messagesToSummarize || messagesToSummarize.length === 0)
    return currentSummary;

  // Dùng Gemini Flash cho nhanh và rẻ
  const fastModel = [
    {
      provider: PROVIDERS.GEMINI,
      model: import.meta.env.VITE_GEMINI_MODEL_2_FLASH,
    },
    {
      provider: PROVIDERS.GROQ,
      model: import.meta.env.VITE_GROQ_MODEL_INSTANT,
    },
  ];

  const cleanMessages = messagesToSummarize.map((m) => ({
    role: m.sender,
    content: m.content,
  }));

  const prompt = buildSummarizePrompt(currentSummary, cleanMessages);

  try {
    return await processQueryWithFailover(fastModel, [], prompt, 0.3);
  } catch {
    return currentSummary;
  }
};

const processQueryWithFailover = async (
  candidates,
  chatHistory,
  systemInstruction,
  temperature,
) => {
  let lastError = null;
  for (const candidate of candidates) {
    const { provider, model } = candidate;
    if (!model) continue;
    try {
      if (provider === PROVIDERS.GEMINI) {
        return await callGeminiAPI(
          model,
          chatHistory,
          systemInstruction,
          temperature,
        );
      } else if (provider === PROVIDERS.GROQ) {
        return await callGroqAPI(
          model,
          chatHistory,
          systemInstruction,
          temperature,
        );
      }
    } catch (error) {
      console.error(`Lỗi ${provider}:`, error);
      lastError = error;
      continue;
    }
  }
  throw lastError || new Error("All models failed.");
};
