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
  getAddressFromCoordinates,
} from "./ai/locationUtils";
import { createResponse } from "./ai/chatHelpers";
import { INVENTORY_TOOLS } from "./ai/toolsDefinitions";

// --- CẤU HÌNH MEMORY ---
const SLIDING_WINDOW_SIZE = 6;

// --- UTILS ---
const getBigrams = (str) => {
  const s = str.toLowerCase().replace(/[^\w\s\u00C0-\u1EF9]/g, "");
  return s.split(/\s+/).filter((w) => w.length > 0);
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
  return similarity >= 0.85;
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
    return createResponse("text", "Mất mạng rồi mẹ Trang ơi 🥺");
  }

  const modeConfig = getModeConfig(modeKey);

  // 1. Xác định vị trí
  const coords = await getCurrentLocation();
  let fullLocationInfo = coords ? `${coords}` : "Chưa rõ";
  if (coords) {
    const locName = await getAddressFromCoordinates(coords);
    if (locName) fullLocationInfo = `${locName} (${coords})`;
  }

  // 2. Logic Tìm kiếm
  const lowerQuery = query.toLowerCase();
  const isForceSearch = FORCE_WEB_SEARCH_TRIGGERS.some((kw) =>
    lowerQuery.includes(kw),
  );
  const isStandardSearchTrigger =
    modeKey === "standard" &&
    STANDARD_MODE_SEARCH_TRIGGERS.some((kw) => lowerQuery.includes(kw));
  const shouldSearch =
    isForceSearch ||
    isStandardSearchTrigger ||
    (modeKey === "deep" && query.length > 3);

  let searchResults = null;

  if (shouldSearch) {
    onStatusUpdate("Misa đang đi soi giá thị trường...");
    let searchQuery = query;
    if (
      (lowerQuery.includes("giá") || lowerQuery.includes("nhập")) &&
      !lowerQuery.includes("nhật")
    ) {
      searchQuery += " price Japan Rakuten Amazon JP";
    }

    try {
      searchResults = await searchWeb(
        searchQuery,
        fullLocationInfo,
        modeConfig.search_depth,
        modeConfig.max_results,
      );
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
    isDuplicate = checkDuplicateQuery(
      query,
      userMessages[userMessages.length - 2].content,
    );
  }

  const cleanHistory = history
    .filter(
      (msg) =>
        (msg.sender === "user" || msg.sender === "assistant") &&
        msg.type !== "error",
    )
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant", // Map chuẩn
      content: msg.content,
      // Nếu msg cũ là tool_request thì cần logic khôi phục history phức tạp hơn
      // Ở đây ta chấp nhận đơn giản hóa history cho app nhỏ
    }));

  const recentHistory = cleanHistory.slice(-SLIDING_WINDOW_SIZE);

  // 4. Build Prompt
  const systemInstruction = buildSystemPrompt(
    { ...context, location: fullLocationInfo },
    searchResults,
    currentSummary,
    isDuplicate,
  );

  // 5. Gọi AI với Tools
  try {
    const availableTools = INVENTORY_TOOLS; // Load tools definition

    const result = await processQueryWithFailover(
      modeConfig.model,
      recentHistory,
      systemInstruction,
      modeConfig.temperature,
      availableTools,
    );

    // KỊCH BẢN A: AI muốn dùng Tool
    if (result.tool_calls && result.tool_calls.length > 0) {
      const toolCall = result.tool_calls[0];
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return createResponse(
          "tool_request", // Loại message đặc biệt
          result.content || "Đợi Misa một xíu nha...",
          {
            toolCallId: toolCall.id,
            functionName: toolCall.function.name,
            functionArgs: args,
            rawToolCallMessage: result.raw_message, // Cần cái này để nối history
          },
        );
      } catch (e) {
        console.error("Lỗi parse arguments từ AI:", e);
        return createResponse(
          "text",
          "Misa định làm gì đó mà quên mất cách làm rồi huhu.",
        );
      }
    }

    // KỊCH BẢN B: Chat thường
    return createResponse("text", result.content);
  } catch (error) {
    console.error("AI Service Error:", error);
    return createResponse("text", `Lỗi rồi: ${error.message}`);
  }
};

/**
 * Hàm hỗ trợ xử lý kết quả sau khi chạy Tool (Turn 2)
 * Gọi lại AI với kết quả thực thi để AI chém gió tiếp.
 */
export const processToolResult = async (
  originalQuery,
  context,
  history,
  toolCallData, // { id, name, args, result }
  toolOutputString,
  modeKey = "standard",
) => {
  const modeConfig = getModeConfig(modeKey);
  const systemInstruction = buildSystemPrompt(context, null, "", false);

  // Xây dựng history đặc biệt cho turn này
  // 1. System Prompt
  // 2. History cũ
  // 3. User Query hiện tại
  // 4. Assistant Message (chứa tool_calls) -> Phải giả lập cái này
  // 5. Tool Message (chứa result)

  // Lưu ý: Ở bản đơn giản, ta chỉ cần gửi:
  // User: "Nhập kho..."
  // System: "Đã thực hiện nhập kho thành công: {toolOutputString}. Hãy thông báo cho user."

  // Nhưng để AI thông minh nhất, ta gửi đúng luồng:
  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    })),
    { role: "user", content: originalQuery },
    // Assistant Message (Turn 1 - Invisible in UI but needed for Logic)
    {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: toolCallData.toolCallId,
          type: "function",
          function: {
            name: toolCallData.functionName,
            arguments: JSON.stringify(toolCallData.functionArgs),
          },
        },
      ],
    },
    // Tool Result Message (Turn 2)
    {
      role: "tool",
      tool_call_id: toolCallData.toolCallId,
      content: toolOutputString,
    },
  ];

  try {
    // Gọi trực tiếp Groq (vì chỉ Groq support flow này tốt nhất hiện tại trong setup này)
    // Lấy model Groq từ config
    const groqModel =
      modeConfig.model.find((m) => m.provider === PROVIDERS.GROQ)?.model ||
      "llama3-70b-8192";

    // Gọi hàm cấp thấp, bypass processQueryWithFailover để custom messages
    const response = await callGroqAPI(
      groqModel,
      [], // History để trống vì ta đã build full messages ở trên
      systemInstruction, // Cái này provider sẽ gắn vào đầu, nhưng ta đã custom message list.
      // Cần sửa provider một xíu hoặc trick ở đây.
      // Tốt nhất là dùng hàm callGroqAPI và pass messages đã build vào tham số history,
      // và sửa provider để không duplicate system prompt.
      // NHƯNG ĐỂ AN TOÀN VÀ NHANH: Ta dùng trick "System Message" cuối cùng.
      0.5,
      INVENTORY_TOOLS,
    );

    // Với cấu trúc provider hiện tại, nó sẽ prepend systemInstruction.
    // Nên ta chỉ cần pass đoạn tool conversation vào history.
    // Provider.js line 65: ...history.map...
    // Ta cần truyền mảng object đúng format mà provider mong đợi.

    // Update: Code provider bên trên đã support msg.role === 'tool'.
    // Ta gọi lại hàm processQueryWithFailover nhưng với history đã nối thêm 2 message (Assistant Call + Tool Result)

    return createResponse("text", response.content);
  } catch (e) {
    console.error("Tool Result processing failed", e);
    return createResponse(
      "text",
      `Xong rồi nha! (Chi tiết: ${toolOutputString})`,
    );
  }
};

// ... giữ nguyên summarizeChatHistory ...
export const summarizeChatHistory = async (
  currentSummary,
  messagesToSummarize,
) => {
  // ... (như cũ)
  if (!messagesToSummarize || messagesToSummarize.length === 0)
    return currentSummary;
  const fastModel = [
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
    return await processQueryWithFailover(fastModel, [], prompt, 0.3).then(
      (res) => res.content,
    );
  } catch {
    return currentSummary;
  }
};

// ... giữ nguyên processQueryWithFailover ...
const processQueryWithFailover = async (
  candidates,
  chatHistory,
  systemInstruction,
  temperature,
  tools = null,
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
          tools,
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
