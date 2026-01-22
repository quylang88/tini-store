/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo.
 */

import { MODEL_CONFIGS, PROVIDERS, SEARCH_KEYWORDS } from "./ai/config";
import { callGeminiAPI, callGroqAPI, searchWeb } from "./ai/providers";
import { buildSystemPrompt } from "./ai/prompts";
import { getCurrentLocation, createResponse } from "./ai/utils";

// --- XỬ LÝ CHÍNH (MAIN PROCESS) ---

/**
 * Hàm chính để xử lý truy vấn từ người dùng.
 * @param {string} query - Câu hỏi của user
 * @param {Object} context - Dữ liệu app (products, orders)
 * @param {string} mode - Chế độ AI (SMART, FLASH, DEEP)
 */
export const processQuery = async (query, context, mode = "SMART") => {
  // 1. Kiểm tra mạng
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Bạn đang Offline. Vui lòng kiểm tra kết nối mạng.",
    );
  }

  // 2. Xác định vị trí & Search Web
  const userLocation = await getCurrentLocation();

  // Logic xác định có cần search web không
  // Nếu mode là DEEP, luôn ưu tiên tìm kiếm nếu câu hỏi dài > 5 ký tự
  // Hoặc nếu có keyword đặc biệt (thời tiết, tin tức...)
  const shouldSearch =
    (mode === "DEEP" && query.length > 5) ||
    SEARCH_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

  let searchResults = "";
  if (shouldSearch) {
    console.log("Đang tìm kiếm trên Tavily...");
    const webData = await searchWeb(query, userLocation);
    if (webData) {
      searchResults = `\n\nTHÔNG TIN TÌM KIẾM TỪ WEB:\n${webData}`;
    }
  }

  // 3. Lấy danh sách model candidates dựa trên Mode
  // Mặc định fallback về SMART nếu mode không tồn tại
  const modelCandidates = MODEL_CONFIGS[mode] || MODEL_CONFIGS.SMART;

  // 4. Xây dựng prompt
  // Prompt được dùng chung cho cả Groq và Gemini
  const systemPrompt = buildSystemPrompt(
    query,
    { ...context, location: userLocation },
    searchResults,
  );

  // 5. Gọi AI với cơ chế Failover (Thử lần lượt các models)
  try {
    const responseText = await processQueryWithFailover(
      modelCandidates,
      systemPrompt,
    );
    return createResponse("text", responseText);
  } catch (error) {
    console.error("AI Service Error:", error);
    return createResponse("text", `Đã có lỗi xảy ra: ${error.message}`);
  }
};

/**
 * Chạy qua danh sách các models/providers được cấu hình.
 * Nếu model ưu tiên thất bại, tự động chuyển sang model tiếp theo (Failover).
 */
const processQueryWithFailover = async (candidates, fullPrompt) => {
  let lastError = null;

  for (const candidate of candidates) {
    const { provider, model } = candidate;
    if (!model) continue;

    console.log(`Đang thử gọi model: ${model} (${provider})...`);

    try {
      let result = "";

      if (provider === PROVIDERS.GEMINI) {
        result = await callGeminiAPI(model, fullPrompt);
      } else if (provider === PROVIDERS.GROQ) {
        result = await callGroqAPI(model, fullPrompt);
      }

      // Nếu thành công trả về luôn
      if (result) return result;
    } catch (error) {
      console.error(`Lỗi với ${provider} - ${model}:`, error);
      lastError = error;

      // Tiếp tục vòng lặp để thử model tiếp theo trong danh sách candidates
      continue;
    }
  }

  // Nếu chạy hết danh sách mà vẫn lỗi
  throw lastError || new Error("Tất cả các models đều thất bại.");
};
