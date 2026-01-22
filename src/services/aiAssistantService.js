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
const SLIDING_WINDOW_SIZE = 6; // Chỉ gửi 6 tin nhắn gần nhất cho AI trả lời (Tiết kiệm Token cực mạnh)

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

  // 1. Xác định vị trí & Search Web (Giữ nguyên logic của bạn)
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

  // 2. Xử lý Lịch sử chat (SLIDING WINDOW)
  // Chỉ lấy N tin nhắn cuối cùng để gửi đi
  // Lọc bỏ tin nhắn lỗi hoặc hệ thống, chỉ lấy text
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

  // Cắt lấy đuôi (Sliding Window)
  const recentHistory = cleanHistory.slice(-SLIDING_WINDOW_SIZE);
  // Thêm câu hỏi mới vào cuối
  recentHistory.push({ role: "user", content: query });

  // 3. Xây dựng System Prompt (Bơm thêm Summary vào)
  const systemInstruction = buildSystemPrompt(
    { ...context, location: fullLocationInfo },
    searchResults,
    currentSummary, // <--- Điểm mới: Truyền ký ức vào
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
 * Hàm TÓM TẮT LỊCH SỬ (Chạy ngầm)
 * @param {string} currentSummary - Tóm tắt hiện tại
 * @param {Array} messagesToSummarize - Các tin nhắn mới cần gộp vào tóm tắt
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

// --- GIỮ NGUYÊN HÀM FAILOVER CŨ ---
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
