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
const SLIDING_WINDOW_SIZE = 6;

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
      "Mất mạng rồi mẹ Trang ơi, Misa không check giá online được 🥺",
    );
  }

  const modeConfig = getModeConfig(modeKey);

  // 1. Xác định vị trí
  const coords = await getCurrentLocation();
  let locationName = null;
  let fullLocationInfo = coords || "Chưa rõ";
  if (coords) {
    locationName = await getAddressFromCoordinates(coords);
    if (locationName) fullLocationInfo = `${locationName} (${coords})`;
  }

  // 2. LOGIC TÌM KIẾM THÔNG MINH (STRICT SOURCING)
  const lowerQuery = query.toLowerCase();

  const isForceSearch = FORCE_WEB_SEARCH_TRIGGERS.some((kw) =>
    lowerQuery.includes(kw),
  );
  const isStandardSearchTrigger =
    modeKey === "standard" &&
    STANDARD_MODE_SEARCH_TRIGGERS.some((kw) => lowerQuery.includes(kw));
  const isDeepSearch = modeKey === "deep";

  const shouldSearch =
    isForceSearch ||
    isStandardSearchTrigger ||
    (isDeepSearch && query.length > 3);

  let searchResults = null; // Mặc định là null để Prompt biết là KHÔNG CÓ DATA

  if (shouldSearch) {
    onStatusUpdate("Misa đang đi soi giá thị trường...");

    // Tự động thêm từ khóa để tìm đúng nguồn Nhật/Giá cả
    let searchQuery = query;
    if (
      lowerQuery.includes("giá") ||
      lowerQuery.includes("nhập") ||
      lowerQuery.includes("mua")
    ) {
      if (!lowerQuery.includes("nhật") && !lowerQuery.includes("japan")) {
        searchQuery += " price Japan Rakuten Amazon JP review";
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

      // FORMAT DỮ LIỆU ĐỂ AI TRÍCH DẪN ĐƯỢC
      // Giả sử searchWeb trả về string hoặc object, ta cần format rõ ràng
      if (webData) {
        // Nếu providers trả về chuỗi raw, ta dùng luôn.
        // Nếu logic bên providers đã parse ra array results, ta format lại ở đây (tuỳ implement của providers.js)
        // Ở đây mình giả định webData là string tổng hợp từ providers.js
        searchResults = webData;
      }
    } catch (err) {
      console.warn("Search failed:", err);
    }

    onStatusUpdate(null);
  }

  // 3. Xử lý Lịch sử
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

  // 4. Build System Prompt (STRICT MODE)
  const systemInstruction = buildSystemPrompt(
    { ...context, location: fullLocationInfo },
    searchResults, // Truyền null nếu không tìm thấy gì
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
      `Lỗi rồi: ${error.message}. Misa chịu thua 😭`,
    );
  }
};

/**
 * Tóm tắt lịch sử
 */
export const summarizeChatHistory = async (
  currentSummary,
  messagesToSummarize,
) => {
  if (!messagesToSummarize || messagesToSummarize.length === 0)
    return currentSummary;

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
