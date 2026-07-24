/**
 * aiAssistantService.js
 * "Bộ não" xử lý logic cho Trợ lý Quản lý Tiny Shop.
 */

import { getModeConfig, PROVIDERS } from "./ai/config";
import { callGeminiAPI, callGroqAPI, searchWeb } from "./ai/providers";
import { buildDynamicSystemPrompt, buildSummarizePrompt } from "./ai/prompts";
import {
  getCurrentLocation,
  getAddressFromCoordinates,
} from "./ai/locationUtils";
import { createResponse } from "./ai/chatHelpers";
import { INVENTORY_TOOLS } from "./ai/toolsDefinitions";
import { checkDuplicateQuery } from "./ai/textAnalysisUtils";
import { detectIntent } from "./ai/intentService";

// --- CẤU HÌNH MEMORY ---
const SLIDING_WINDOW_SIZE = 6;

// --- XỬ LÝ CHÍNH ---

export const processQuery = async (
  query,
  context,
  modeKey = "standard",
  history = [],
  currentSummary = "",
  onStatusUpdate = () => {},
  explicitIntent = null,
) => {
  if (!navigator.onLine) {
    return createResponse("text", "Mất mạng rồi mẹ Trang ơi 🥺");
  }

  const modeConfig = getModeConfig(modeKey);

  // 0. Parallel Execution: Intent & Location
  // Chạy song song để tối ưu thời gian phản hồi (giảm 50% wait time nếu balanced)

  // Task A: Intent Detection
  const intentPromise = (async () => {
    if (explicitIntent) return explicitIntent;
    try {
      onStatusUpdate("Misa đang suy nghĩ...");
      return await detectIntent(query);
    } catch (err) {
      console.warn("Intent check failed, fallback to CHAT:", err);
      return "CHAT";
    }
  })();

  // Task B: Location Context
  const locationPromise = (async () => {
    try {
      const coords = await getCurrentLocation();
      if (!coords) return "Chưa rõ";

      let info = `${coords}`;
      const locName = await getAddressFromCoordinates(coords);
      if (locName) info = `${locName} (${coords})`;
      return info;
    } catch (err) {
      console.warn("Location check failed:", err);
      return "Chưa rõ";
    }
  })();

  const [intent, fullLocationInfo] = await Promise.all([
    intentPromise,
    locationPromise,
  ]);

  // 2. Logic Tìm kiếm (Simplified based on Intent)
  const shouldSearch =
    intent === "SEARCH" || (modeKey === "deep" && query.length > 3);

  let searchResults = null;

  if (shouldSearch) {
    onStatusUpdate("Misa đang đi soi giá thị trường...");
    const lowerQuery = query.toLowerCase();
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

  const cleanHistory = [];
  for (let i = 0; i < history.length; i++) {
    const msg = history[i];
    if (
      (msg.sender === "user" || msg.sender === "assistant") &&
      msg.type !== "error"
    ) {
      cleanHistory.push({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }
  }

  const recentHistory = cleanHistory.slice(-SLIDING_WINDOW_SIZE);

  // 4. Build Dynamic Prompt based on Intent
  const systemInstruction = buildDynamicSystemPrompt(
    intent,
    { ...context, location: fullLocationInfo },
    searchResults,
    currentSummary,
    isDuplicate,
  );

  // 5. Gọi AI với Tools
  try {
    // Chỉ bật Tool khi Intent là IMPORT hoặc EXPORT để tránh ảo giác (hallucination)
    // khi AI cố gọi tool trong lúc đang tư vấn (SEARCH) hoặc tán gẫu (CHAT).
    const availableTools = ["IMPORT", "EXPORT"].includes(intent)
      ? INVENTORY_TOOLS
      : null;

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
          "tool_request",
          result.content || "Đợi Misa một xíu nha...",
          {
            toolCallId: toolCall.id,
            functionName: toolCall.function.name,
            functionArgs: args,
            // Không cần rawToolCallMessage nữa vì đã parse xong
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
  toolCallData, // { toolCallId, functionName, functionArgs }
  toolOutputString,
  modeKey = "standard",
) => {
  const modeConfig = getModeConfig(modeKey);

  // Khi xử lý kết quả tool, thường là đã xong việc, quay về CHAT hoặc giữ context cơ bản.
  // Ta dùng intent='CHAT' để load Common Prompt (có product list mới nhất) mà không cần rules phức tạp.
  const systemInstruction = buildDynamicSystemPrompt(
    "CHAT",
    context,
    null,
    "",
    false,
  );

  // Xây dựng history đặc biệt cho turn này theo chuẩn OpenAI/Groq:
  // 1. History cũ
  // 2. User Query (câu lệnh dẫn đến việc gọi tool)
  // 3. Assistant Message (chứa tool_calls)
  // 4. Tool Message (chứa kết quả tool)

  const len = history.length;
  const cleanHistory = new Array(len);
  for (let i = 0; i < len; i++) {
    const m = history[i];
    cleanHistory[i] = {
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    };
  }

  const conversation = [
    ...cleanHistory,
    { role: "user", content: originalQuery },
    {
      role: "assistant",
      content: null, // Message gọi tool thường không có content
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
    {
      role: "tool",
      tool_call_id: toolCallData.toolCallId,
      content: toolOutputString,
    },
  ];

  try {
    // Sử dụng chung luồng failover, đảm bảo tính nhất quán
    // Các provider đã được update để xử lý message có role='tool' và tool_calls
    const result = await processQueryWithFailover(
      modeConfig.model,
      conversation,
      systemInstruction,
      modeConfig.temperature,
      INVENTORY_TOOLS,
    );

    return createResponse("text", result.content);
  } catch (e) {
    console.error("Tool Result processing failed", e);
    // Fallback nếu AI chết
    return createResponse(
      "text",
      `Xong rồi nha! (Chi tiết: ${toolOutputString})`,
    );
  }
};

export const summarizeChatHistory = async (
  currentSummary,
  messagesToSummarize,
) => {
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
