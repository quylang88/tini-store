/**
 * aiAssistantService.js
 *
 * Service này đóng vai trò là "Bộ não" cho Trợ lý ảo.
 */

import { getModeConfig, PROVIDERS, SEARCH_KEYWORDS } from "./ai/config";
import { callGeminiAPI, callGroqAPI, searchWeb } from "./ai/providers";
import { buildSystemPrompt } from "./ai/prompts";
import {
  getCurrentLocation,
  createResponse,
  getAddressFromCoordinates,
} from "./ai/utils";

// --- XỬ LÝ CHÍNH (MAIN PROCESS) ---

/**
 * Hàm chính để xử lý truy vấn từ người dùng.
 * @param {string} query - Câu hỏi của user
 * @param {Object} context - Dữ liệu app (products, orders)
 * @param {string} modeKey - Key chế độ AI (fast, standard, deep)
 * @param {Array} history - Lịch sử chat (tùy chọn)
 */
export const processQuery = async (
  query,
  context,
  modeKey = "standard",
  history = [],
) => {
  // 1. Kiểm tra mạng
  if (!navigator.onLine) {
    return createResponse(
      "text",
      "Bạn đang Offline. Vui lòng kiểm tra kết nối mạng.",
    );
  }

  // Lấy cấu hình cho mode hiện tại
  const modeConfig = getModeConfig(modeKey);

  // 2. Xác định vị trí & Search Web
  const coords = await getCurrentLocation();
  let locationName = null;
  let fullLocationInfo = coords || "Chưa rõ"; // Mặc định là tọa độ thô nếu không lấy được tên

  if (coords) {
    // Thử lấy tên địa điểm từ tọa độ
    locationName = await getAddressFromCoordinates(coords);
    if (locationName) {
      // Context vị trí sẽ là: "Thành phố Saitama, Nhật Bản (35.82..., 139.55...)"
      fullLocationInfo = `${locationName} (${coords})`;
    }
  }

  // Logic xác định có cần search web không
  // Nếu mode là deep, luôn ưu tiên tìm kiếm nếu câu hỏi dài > 5 ký tự
  // Hoặc nếu có keyword đặc biệt (thời tiết, tin tức...)
  const shouldSearch =
    (modeKey === "deep" && query.length > 5) ||
    SEARCH_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

  let searchResults = "";
  if (shouldSearch) {
    console.log("Đang tìm kiếm trên Tavily...");
    // Ưu tiên dùng tên địa điểm để search (chính xác hơn tọa độ số)
    const searchLocation = locationName || coords;

    const webData = await searchWeb(
      query,
      searchLocation,
      modeConfig.search_depth,
      modeConfig.max_results,
    );
    if (webData) {
      searchResults = `\n\nTHÔNG TIN TÌM KIẾM TỪ WEB:\n${webData}`;
    }
  }

  // 3. Lấy danh sách model candidates từ config
  const modelCandidates = modeConfig.model;

  // 4. Xây dựng prompt hệ thống (Context)
  // Lưu ý: Không còn append câu hỏi vào cuối system prompt nữa
  const systemInstruction = buildSystemPrompt(
    { ...context, location: fullLocationInfo }, // Truyền thông tin vị trí đầy đủ
    searchResults,
  );

  // 5. Chuẩn hóa lịch sử chat
  // Lọc bỏ tin nhắn lỗi hoặc tin nhắn hệ thống không cần thiết
  // Chỉ lấy các tin nhắn text từ user hoặc assistant
  const formattedHistory = history
    .filter(
      (msg) =>
        msg.type === "text" &&
        (msg.sender === "user" || msg.sender === "assistant"),
    )
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "model", // Gemini dùng 'model', Groq dùng 'assistant' (sẽ map lại trong provider)
      content: msg.content,
    }));

  // Thêm câu hỏi hiện tại vào cuối history
  formattedHistory.push({ role: "user", content: query });

  // 6. Gọi AI với cơ chế Failover và Temperature từ config
  try {
    const responseText = await processQueryWithFailover(
      modelCandidates,
      formattedHistory,
      systemInstruction,
      modeConfig.temperature,
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

    console.log(
      `Đang thử gọi model: ${model} (${provider}) with temp=${temperature}...`,
    );

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
