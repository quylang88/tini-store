/**
 * aiAssistantService.js
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo.
 */

import {
  getModeConfig,
  PROVIDERS,
  SEARCH_KEYWORDS,
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

// --- THUẬT TOÁN SO SÁNH CHUỖI THÔNG MINH (Dice Coefficient) ---
const getBigrams = (str) => {
  const s = str.toLowerCase().replace(/[^\w\s\u00C0-\u1EF9]/g, ""); // Giữ lại tiếng Việt và số
  const words = s.split(/\s+/).filter((w) => w.length > 0);
  return words;
};

const calculateSimilarity = (str1, str2) => {
  const words1 = getBigrams(str1);
  const words2 = getBigrams(str2);

  if (words1.length === 0 || words2.length === 0) return 0.0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // Tìm số từ trùng nhau
  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  // Công thức Dice: (2 * số_từ_trùng) / (tổng_số_từ_cả_2_câu)
  return (2.0 * intersection.size) / (set1.size + set2.size);
};

const checkDuplicateQuery = (currentQuery, lastQuery) => {
  if (!lastQuery) return false;

  // 1. Check cơ bản: Giống hệt nhau
  if (currentQuery.trim().toLowerCase() === lastQuery.trim().toLowerCase())
    return true;

  // 2. Check thông minh: Độ tương đồng từ ngữ
  const similarity = calculateSimilarity(currentQuery, lastQuery);

  // Ngưỡng: 0.85 nghĩa là giống nhau 85% về mặt từ ngữ
  // VD: "Bạn tên gì" vs "Tên bạn là gì" -> Similarity ~ 0.9 -> Trùng
  // VD: "SP A" (3 từ) vs "SP B" (3 từ) -> Trùng "SP" (2 từ) -> Sim = (2*2)/6 = 0.66 -> KHÔNG trùng.
  const SIMILARITY_THRESHOLD = 0.85;

  if (similarity >= SIMILARITY_THRESHOLD) {
    // --- GUARD: KIỂM TRA SỐ LIỆU ---
    // Nếu câu chứa số khác nhau thì KHÔNG bao giờ là trùng (VD: Mua 1 cái vs Mua 2 cái)
    const nums1 = currentQuery.match(/\d+/g) || [];
    const nums2 = lastQuery.match(/\d+/g) || [];

    // Nếu số lượng con số tìm thấy khác nhau, hoặc giá trị số khác nhau -> KHÔNG trùng
    if (nums1.join(",") !== nums2.join(",")) {
      return false;
    }

    return true;
  }

  return false;
};

// --- XỬ LÝ CHÍNH (MAIN PROCESS) ---

/**
 * Hàm chính để xử lý truy vấn từ người dùng.
 * @param {string} query - Câu hỏi của user
 * @param {Object} context - Dữ liệu app (products, orders)
 * @param {string} modeKey - Key chế độ AI (fast, standard, deep)
 * @param {Array} history - Lịch sử chat ĐẦY ĐỦ
 * @param {string} currentSummary - Tóm tắt ngữ cảnh cũ (Memory)
 */
export const processQuery = async (
  query,
  context,
  modeKey = "standard",
  history = [],
  currentSummary = "",
  onStatusUpdate = () => {},
) => {
  if (!navigator.onLine) {
    return createResponse("text", "Bạn đang Offline. Kiểm tra mạng đi bạn êi.");
  }

  const modeConfig = getModeConfig(modeKey);

  // 1. Xác định vị trí & Search Web
  const coords = await getCurrentLocation();
  let locationName = null;
  let fullLocationInfo = coords || "Chưa rõ";

  if (coords) {
    locationName = await getAddressFromCoordinates(coords);
    if (locationName) fullLocationInfo = `${locationName} (${coords})`;
  }

  const lowerQuery = query.toLowerCase();
  const isForceSearch = FORCE_WEB_SEARCH_TRIGGERS.some((kw) =>
    lowerQuery.includes(kw),
  );
  const isStandardSearchTrigger =
    modeKey === "standard" &&
    STANDARD_MODE_SEARCH_TRIGGERS.some((kw) => lowerQuery.includes(kw));
  const isDefaultSearchTrigger =
    (modeKey === "deep" && query.length > 5) ||
    SEARCH_KEYWORDS.some((kw) => lowerQuery.includes(kw));
  const shouldSearch =
    isForceSearch || isStandardSearchTrigger || isDefaultSearchTrigger;

  let searchResults = "";
  if (shouldSearch) {
    onStatusUpdate("Đang lướt web tìm info...");
    const searchLocation = locationName || coords;
    const webData = await searchWeb(
      query,
      searchLocation,
      modeConfig.search_depth,
      modeConfig.max_results,
    );
    if (webData) searchResults = webData;
    onStatusUpdate(null);
  }

  // 2. Xử lý Lịch sử chat & CHECK TRÙNG LẶP THÔNG MINH

  // Lấy tin nhắn cuối cùng CỦA USER
  const lastUserMessage = [...history]
    .reverse()
    .find((msg) => msg.sender === "user");

  // Sử dụng hàm so sánh thông minh mới
  const isDuplicate =
    lastUserMessage && checkDuplicateQuery(query, lastUserMessage.content);

  if (isDuplicate) {
    console.log("Phát hiện trùng lặp nội dung (Smart Check).");
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
  // Thêm câu hỏi mới vào cuối
  recentHistory.push({ role: "user", content: query });

  // 3. Xây dựng System Prompt (với cờ isDuplicate)
  const systemInstruction = buildSystemPrompt(
    { ...context, location: fullLocationInfo },
    searchResults,
    currentSummary,
    isDuplicate, // <--- Truyền kết quả so sánh vào
  );

  // 4. Gọi AI
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
    return createResponse("text", `Misa bị lỗi rồi: ${error.message}`);
  }
};

/**
 * Hàm TÓM TẮT LỊCH SỬ
 */
export const summarizeChatHistory = async (
  currentSummary,
  messagesToSummarize,
) => {
  if (!messagesToSummarize || messagesToSummarize.length === 0)
    return currentSummary;

  console.log("Đang chạy tóm tắt ngầm...");
  // Dùng model NHANH NHẤT để tóm tắt cho rẻ và lẹ (Gemini Flash hoặc Groq Llama Instant)
  const fastModel = [
    {
      provider: PROVIDERS.GEMINI,
      model: import.meta.env.VITE_GEMINI_MODEL_2_FLASH,
    }, // Ưu tiên Gemini Flash vì context window lớn
    {
      provider: PROVIDERS.GEMINI,
      model: import.meta.env.VITE_GEMINI_MODEL_2_LITE,
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

  // Gọi AI nhưng không cần history (vì history đã nằm trong prompt tóm tắt rồi)
  try {
    const newSummary = await processQueryWithFailover(
      fastModel,
      [],
      prompt,
      0.3,
    );
    console.log("Tóm tắt mới:", newSummary);
    return newSummary;
  } catch (e) {
    console.warn("Lỗi khi tóm tắt:", e);
    return currentSummary; // Lỗi thì giữ nguyên cái cũ
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
      let result = "";
      if (provider === PROVIDERS.GEMINI) {
        result = await callGeminiAPI(
          model,
          chatHistory,
          systemInstruction,
          temperature,
        );
      } else if (provider === PROVIDERS.GROQ) {
        result = await callGroqAPI(
          model,
          chatHistory,
          systemInstruction,
          temperature,
        );
      }
      if (result) return result;
    } catch (error) {
      console.error(`Lỗi ${provider}:`, error);
      lastError = error;
      continue;
    }
  }
  throw lastError || new Error("All models failed.");
};
