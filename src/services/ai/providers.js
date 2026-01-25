/**
 * providers.js
 * Quản lý các hàm gọi API cấp thấp đến các nhà cung cấp AI (Gemini, Groq) và Search (Tavily).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { TAVILY_API_URL, geminiSafetySettings } from "./config";

// --- CÁC HÀM GỌI API ---

/**
 * Gọi API Google Gemini
 * Return format chuẩn: { content: string, tool_calls: null }
 */
export const callGeminiAPI = async (
  modelName,
  history,
  systemInstruction,
  temperature = 0.7,
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình VITE_GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: geminiSafetySettings,
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: temperature,
    },
  });

  const contents = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Gọi generateContent với toàn bộ lịch sử hội thoại
  const result = await model.generateContent({ contents });
  const response = await result.response;

  // Chuẩn hóa output object
  return {
    content: response.text(),
    tool_calls: null, // Hiện tại Gemini Flash chưa implement tool call trong code này
  };
};

/**
 * Gọi API Groq (Tương thích OpenAI & Tool Use)
 * Return format chuẩn: { content: string | null, tool_calls: array | null }
 */
export const callGroqAPI = async (
  modelName,
  history,
  systemInstruction,
  temperature = 0.5,
  tools = null, // Thêm tham số tools
) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình VITE_GROQ_API_KEY");

  const messages = [
    {
      role: "system",
      content: systemInstruction,
    },
    ...history.map((msg) => {
      // Xử lý message lịch sử đặc biệt nếu là tool result (để support luồng chat tiếp theo)
      if (msg.role === "tool") {
        return {
          role: "tool",
          tool_call_id: msg.tool_call_id,
          content: msg.content,
        };
      }
      return {
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
        // Nếu lịch sử có tool_calls, cần map lại đúng format (tùy chỉnh nâng cao sau)
      };
    }),
  ];

  const payload = {
    messages: messages,
    model: modelName,
    temperature: temperature,
    max_tokens: 1024,
  };

  // Chỉ gắn tools nếu model hỗ trợ và có tools truyền vào
  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = "auto";
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Groq API Error: ${errorData?.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  const message = data.choices[0]?.message;

  // Trả về object đầy đủ để service xử lý
  return {
    content: message.content || "", // Có thể null nếu AI chỉ gọi tool
    tool_calls: message.tool_calls || null,
  };
};

/**
 * Gọi Tavily API để tìm kiếm thông tin trên web
 */
export const searchWeb = async (
  query,
  location = null,
  searchDepth = "basic",
  maxResults = 3,
) => {
  const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;
  if (!tavilyKey) {
    console.warn("Chưa cấu hình VITE_TAVILY_API_KEY");
    return null;
  }

  try {
    const searchQuery = location ? `${query} tại ${location}` : query;
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        search_depth: searchDepth,
        include_answer: false,
        max_results: maxResults,
      }),
    });

    const data = await response.json();
    if (!data.results) return null;

    return data.results
      .map(
        (item) =>
          `[Tiêu đề: ${item.title}]\n[Nội dung: ${item.content}]\n[Link: ${item.url}]`,
      )
      .join("\n\n");
  } catch (error) {
    console.error("Lỗi Tavily:", error);
    return null;
  }
};
