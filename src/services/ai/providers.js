/**
 * providers.js
 * Quản lý các hàm gọi API cấp thấp đến các nhà cung cấp AI (Gemini, Groq) và Search (Tavily).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROVIDERS, TAVILY_API_URL, geminiSafetySettings } from "./config";

// --- CÁC HÀM GỌI API ---

/**
 * Gọi API Google Gemini
 * @param {string} modelName
 * @param {Array} history - Danh sách tin nhắn [{role: 'user'|'model', content: '...'}]
 * @param {string} systemInstruction - Prompt hệ thống
 * @param {number} temperature
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
    systemInstruction: systemInstruction, // Gemini hỗ trợ systemInstruction trực tiếp
    generationConfig: {
      temperature: temperature,
    },
  });

  // Chuyển đổi format history sang format của Gemini (Content objects)
  // Gemini expects: { role: "user" | "model", parts: [{ text: "..." }] }
  // Lưu ý: history ở đây đã bao gồm câu hỏi mới nhất ở cuối
  const contents = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Gọi generateContent với toàn bộ lịch sử hội thoại
  const result = await model.generateContent({ contents });
  const response = await result.response;
  return response.text();
};

/**
 * Gọi API Groq (Tương thích OpenAI)
 * @param {string} modelName
 * @param {Array} history - Danh sách tin nhắn [{role: 'user'|'model', content: '...'}]
 * @param {string} systemInstruction - Prompt hệ thống
 * @param {number} temperature
 */
export const callGroqAPI = async (
  modelName,
  history,
  systemInstruction,
  temperature = 0.5,
) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình VITE_GROQ_API_KEY");

  // Chuyển đổi format history sang format của OpenAI/Groq
  // Groq expects: { role: "user" | "assistant" | "system", content: "..." }
  const messages = [
    {
      role: "system",
      content: systemInstruction,
    },
    ...history.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant", // Map 'model' -> 'assistant'
      content: msg.content,
    })),
  ];

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        model: modelName,
        temperature: temperature,
        max_tokens: 1024,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Groq API Error: ${errorData?.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
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
